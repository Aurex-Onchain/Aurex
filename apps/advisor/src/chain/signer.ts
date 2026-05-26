import type { Address } from "viem";
import type { ChainConfig, ContractAddresses } from "../types.js";
import { createChainWriter, type ChainWriter } from "./writer.js";
import { createOnchainosChainWriter } from "./onchainos-writer.js";

export type SignerProvider = "private-key" | "onchainos";

export async function createAdvisorWriterFromEnv(
  chain: ChainConfig,
  contracts: ContractAddresses,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ChainWriter | null> {
  const provider = resolveSignerProvider(env);
  if (!provider) return null;

  if (provider === "onchainos") {
    return createOnchainosChainWriter(chain, contracts, {
      cliPath: env.ONCHAINOS_CLI,
      chain: env.AUREX_ONCHAINOS_CHAIN ?? String(chain.chainId),
      address: (env.AUREX_ONCHAINOS_ADDRESS || undefined) as Address | undefined,
      autoConfirm: envFlag(env.AUREX_ONCHAINOS_AUTO_CONFIRM),
      securityScan: !envFlag(env.AUREX_ONCHAINOS_DISABLE_SECURITY_SCAN),
      allowUnscanned: envFlag(env.AUREX_ONCHAINOS_ALLOW_UNSCANNED),
    });
  }

  const privateKey = (env.AUREX_PRIVATE_KEY || env.DEPLOYER_PRIVATE_KEY) as `0x${string}` | undefined;
  return privateKey ? createChainWriter(chain, contracts, privateKey) : null;
}

export function resolveSignerProvider(env: NodeJS.ProcessEnv): SignerProvider | null {
  const explicit = env.AUREX_SIGNER_PROVIDER?.toLowerCase();
  if (explicit) {
    if (explicit === "private-key" || explicit === "local") return "private-key";
    if (explicit === "onchainos" || explicit === "agentic-wallet") return "onchainos";
    throw new Error(`Unsupported AUREX_SIGNER_PROVIDER: ${env.AUREX_SIGNER_PROVIDER}`);
  }

  if (env.AUREX_PRIVATE_KEY || env.DEPLOYER_PRIVATE_KEY) return "private-key";
  if (env.AUREX_ONCHAINOS_ADDRESS || env.ONCHAINOS_CLI) return "onchainos";
  return null;
}

export function envFlag(value: string | undefined): boolean {
  return value ? ["1", "true", "yes", "on"].includes(value.toLowerCase()) : false;
}
