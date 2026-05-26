import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { encodeFunctionData, isAddress, type Address, type Hash } from "viem";
import type { ChainConfig, ContractAddresses, AurexSignal } from "../types.js";
import type { ChainWriter } from "./writer.js";
import { alphaHookWriteAbi, erc20WriteAbi, signalRegistryWriteAbi } from "./writer.js";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 120_000;

export interface OnchainosCommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export type OnchainosCommandRunner = (
  command: string,
  args: string[],
  options: { timeoutMs: number; env: NodeJS.ProcessEnv },
) => Promise<OnchainosCommandResult>;

export interface OnchainosWriterOptions {
  cliPath?: string;
  chain?: string;
  address?: Address;
  autoConfirm?: boolean;
  securityScan?: boolean;
  allowUnscanned?: boolean;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  runner?: OnchainosCommandRunner;
}

interface ContractCallParams {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
}

export async function createOnchainosChainWriter(
  chainConfig: ChainConfig,
  contracts: ContractAddresses,
  options: OnchainosWriterOptions = {},
): Promise<ChainWriter> {
  const cliPath = options.cliPath ?? "onchainos";
  const chain = options.chain ?? String(chainConfig.chainId);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const env = { ...process.env, ...options.env };
  const runner = options.runner ?? defaultRunner;
  const autoConfirm = options.autoConfirm ?? false;
  const securityScan = options.securityScan ?? true;
  const allowUnscanned = options.allowUnscanned ?? false;
  const address = options.address ?? await resolveOnchainosAddress(cliPath, runner, timeoutMs, env, chain);
  if (!isAddress(address)) {
    throw new Error(`Invalid OnchainOS EVM address: ${address}`);
  }

  async function run(args: string[]): Promise<unknown> {
    const result = await runner(cliPath, args, { timeoutMs, env });
    return parseJsonOutput(result.stdout);
  }

  async function scanTransaction(params: ContractCallParams): Promise<void> {
    if (!securityScan) return;

    try {
      const output = await run([
        "security",
        "tx-scan",
        "--chain",
        chain,
        "--from",
        address,
        "--to",
        params.to,
        "--data",
        params.data,
        "--value",
        (params.value ?? 0n).toString(),
      ]);
      const action = String(findField(output, "action") ?? "");
      if (action === "block") {
        throw new Error(`OnchainOS security scan blocked transaction: ${summarizeRisk(output)}`);
      }
      if (action === "warn" && !autoConfirm) {
        throw new Error(
          `OnchainOS security scan returned warnings: ${summarizeRisk(output)}. ` +
          "Set AUREX_ONCHAINOS_AUTO_CONFIRM=true only after you have reviewed and accepted this policy.",
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("security scan")) throw err;
      if (!allowUnscanned) {
        throw new Error(
          `OnchainOS security scan failed: ${err instanceof Error ? err.message : String(err)}. ` +
          "Set AUREX_ONCHAINOS_ALLOW_UNSCANNED=true to allow execution without scan results.",
        );
      }
    }
  }

  async function contractCall(params: ContractCallParams): Promise<Hash> {
    await scanTransaction(params);

    const args = [
      "wallet",
      "contract-call",
      "--to",
      params.to,
      "--chain",
      chain,
      "--amt",
      (params.value ?? 0n).toString(),
      "--input-data",
      params.data,
      "--from",
      address,
      "--biz-type",
      "dapp",
      "--strategy",
      "aurex-advisor",
    ];

    let output = await run(args);
    if (isConfirming(output)) {
      if (!autoConfirm) {
        throw new Error(
          `OnchainOS confirmation required: ${String(findField(output, "message") ?? "no confirmation message")}`,
        );
      }
      output = await run([...args, "--force"]);
    }

    const txHash = findField(output, "txHash");
    if (typeof txHash === "string" && txHash.startsWith("0x")) {
      return txHash as Hash;
    }

    throw new Error(`OnchainOS contract-call did not return txHash: ${JSON.stringify(output)}`);
  }

  return {
    getAddress() {
      return address;
    },

    getSignerInfo() {
      return { provider: "onchainos", teeBacked: true };
    },

    async registerPublisher(amount) {
      return contractCall({
        to: contracts.signalRegistry,
        data: encodeFunctionData({
          abi: signalRegistryWriteAbi,
          functionName: "registerPublisher",
          args: [amount],
        }),
      });
    },

    async increaseStake(amount) {
      return contractCall({
        to: contracts.signalRegistry,
        data: encodeFunctionData({
          abi: signalRegistryWriteAbi,
          functionName: "increaseStake",
          args: [amount],
        }),
      });
    },

    async unregisterPublisher() {
      return contractCall({
        to: contracts.signalRegistry,
        data: encodeFunctionData({
          abi: signalRegistryWriteAbi,
          functionName: "unregisterPublisher",
        }),
      });
    },

    async publishSignal(signal: AurexSignal) {
      return contractCall({
        to: contracts.signalRegistry,
        data: encodeFunctionData({
          abi: signalRegistryWriteAbi,
          functionName: "publishSignal",
          args: [signal],
        }),
      });
    },

    async verifySignal(signalId) {
      return contractCall({
        to: contracts.signalRegistry,
        data: encodeFunctionData({
          abi: signalRegistryWriteAbi,
          functionName: "verifySignal",
          args: [signalId],
        }),
      });
    },

    async claimFees(token) {
      return contractCall({
        to: contracts.alphaHook,
        data: encodeFunctionData({
          abi: alphaHookWriteAbi,
          functionName: "claimFees",
          args: [token],
        }),
      });
    },

    async approveToken(token, spender, amount) {
      return contractCall({
        to: token,
        data: encodeFunctionData({
          abi: erc20WriteAbi,
          functionName: "approve",
          args: [spender, amount],
        }),
      });
    },
  };
}

async function defaultRunner(
  command: string,
  args: string[],
  options: { timeoutMs: number; env: NodeJS.ProcessEnv },
): Promise<OnchainosCommandResult> {
  try {
    const result = await execFileAsync(command, args, {
      timeout: options.timeoutMs,
      env: options.env,
      maxBuffer: 1024 * 1024,
    });
    return { stdout: result.stdout, stderr: result.stderr, code: 0 };
  } catch (err) {
    const error = err as Error & { stdout?: string; stderr?: string; code?: number };
    if (error.code === 2 && error.stdout) {
      return { stdout: error.stdout, stderr: error.stderr ?? "", code: error.code };
    }
    const details = [error.message, error.stderr, error.stdout].filter(Boolean).join("\n");
    throw new Error(details);
  }
}

async function resolveOnchainosAddress(
  cliPath: string,
  runner: OnchainosCommandRunner,
  timeoutMs: number,
  env: NodeJS.ProcessEnv,
  chain: string,
): Promise<Address> {
  const result = await runner(cliPath, ["wallet", "balance", "--chain", chain], { timeoutMs, env });
  const output = parseJsonOutput(result.stdout);
  const evmAddress = findField(output, "evmAddress");
  if (typeof evmAddress === "string" && isAddress(evmAddress)) {
    return evmAddress;
  }

  throw new Error(
    "Could not resolve OnchainOS Agentic Wallet EVM address. " +
    "Run `onchainos wallet login` or set AUREX_ONCHAINOS_ADDRESS.",
  );
}

function parseJsonOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1));
    }
    throw new Error(`Expected JSON output from onchainos, received: ${trimmed.slice(0, 500)}`);
  }
}

function findField(value: unknown, field: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  if (field in value) return (value as Record<string, unknown>)[field];

  for (const child of Object.values(value as Record<string, unknown>)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findField(item, field);
        if (found !== undefined) return found;
      }
    } else {
      const found = findField(child, field);
      if (found !== undefined) return found;
    }
  }

  return undefined;
}

function isConfirming(output: unknown): boolean {
  return findField(output, "confirming") === true;
}

function summarizeRisk(output: unknown): string {
  const riskItemDetail = findField(output, "riskItemDetail");
  if (!Array.isArray(riskItemDetail) || riskItemDetail.length === 0) {
    return JSON.stringify(output);
  }

  return riskItemDetail
    .map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const record = item as Record<string, unknown>;
      return [record.name, record.action].filter(Boolean).join(" ");
    })
    .join("; ");
}
