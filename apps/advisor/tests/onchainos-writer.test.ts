import { describe, it, expect, vi } from "vitest";
import { decodeFunctionData } from "viem";
import { createOnchainosChainWriter, type OnchainosCommandRunner } from "../src/chain/onchainos-writer.js";
import { signalRegistryWriteAbi } from "../src/chain/writer.js";
import type { ContractAddresses, ChainConfig, AurexSignal } from "../src/types.js";

const chainConfig: ChainConfig = {
  rpcUrl: "http://localhost:8545",
  chainId: 196,
};

const contracts: ContractAddresses = {
  signalRegistry: "0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45",
  policyManager: "0xEe55CF595586527d5ADE7065CD2766899b123E5F",
  alphaHook: "0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4",
  poolFactory: "0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40",
  poolManager: "0x360e68faccca8ca495c1b759fd9eee466db9fb32",
  aurexToken: "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82",
};

const ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`;
const TX_HASH = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as `0x${string}`;

describe("OnchainOS ChainWriter", () => {
  it("uses configured Agentic Wallet address and reports TEE signer info", async () => {
    const writer = await createOnchainosChainWriter(chainConfig, contracts, {
      address: ADDRESS,
      runner: vi.fn(),
    });

    expect(writer.getAddress()).toBe(ADDRESS);
    expect(writer.getSignerInfo?.()).toEqual({ provider: "onchainos", teeBacked: true });
  });

  it("runs security scan and contract-call with encoded publishSignal calldata", async () => {
    const calls: string[][] = [];
    const runner: OnchainosCommandRunner = vi.fn(async (_command, args) => {
      calls.push(args);
      if (args[0] === "security") {
        return { stdout: JSON.stringify({ action: "", riskItemDetail: [] }), stderr: "", code: 0 };
      }
      return { stdout: JSON.stringify({ txHash: TX_HASH }), stderr: "", code: 0 };
    });

    const writer = await createOnchainosChainWriter(chainConfig, contracts, {
      address: ADDRESS,
      runner,
    });

    const signal: AurexSignal = {
      signalId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      poolId: "0x2222222222222222222222222222222222222222222222222222222222222222",
      riskScore: 45n,
      alphaScore: 72n,
      liquidityScore: 80n,
      volatilityScore: 35n,
      recommendedFee: 5000,
      expiresAt: 1700003600n,
      signer: ADDRESS,
    };

    await expect(writer.publishSignal(signal)).resolves.toBe(TX_HASH);

    expect(calls[0]).toEqual(expect.arrayContaining(["security", "tx-scan", "--chain", "196", "--from", ADDRESS]));
    expect(calls[1]).toEqual(expect.arrayContaining(["wallet", "contract-call", "--to", contracts.signalRegistry]));

    const dataIndex = calls[1]!.indexOf("--input-data") + 1;
    const decoded = decodeFunctionData({
      abi: signalRegistryWriteAbi,
      data: calls[1]![dataIndex] as `0x${string}`,
    });
    expect(decoded.functionName).toBe("publishSignal");
    expect(decoded.args[0]).toEqual(signal);
  });

  it("blocks transactions when OnchainOS security scan blocks", async () => {
    const runner: OnchainosCommandRunner = vi.fn(async () => ({
      stdout: JSON.stringify({
        action: "block",
        riskItemDetail: [{ name: "black_tag", action: "block" }],
      }),
      stderr: "",
      code: 0,
    }));
    const writer = await createOnchainosChainWriter(chainConfig, contracts, {
      address: ADDRESS,
      runner,
    });

    await expect(writer.registerPublisher(100n)).rejects.toThrow("blocked transaction");
  });

  it("re-runs contract-call with force after confirming response when autoConfirm is enabled", async () => {
    const calls: string[][] = [];
    const runner: OnchainosCommandRunner = vi.fn(async (_command, args) => {
      calls.push(args);
      if (args[0] === "security") {
        return { stdout: JSON.stringify({ action: "" }), stderr: "", code: 0 };
      }
      if (!args.includes("--force")) {
        return { stdout: JSON.stringify({ confirming: true, message: "Confirm publish" }), stderr: "", code: 2 };
      }
      return { stdout: JSON.stringify({ txHash: TX_HASH }), stderr: "", code: 0 };
    });
    const writer = await createOnchainosChainWriter(chainConfig, contracts, {
      address: ADDRESS,
      runner,
      autoConfirm: true,
    });

    await expect(writer.registerPublisher(100n)).resolves.toBe(TX_HASH);
    expect(calls.at(-1)).toContain("--force");
  });
});
