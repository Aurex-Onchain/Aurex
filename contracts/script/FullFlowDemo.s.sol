// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";
import {AurexSignal} from "../src/libraries/AurexTypes.sol";

/**
 * @title FullFlowDemo
 * @notice End-to-end demo: Register Publisher → Publish Signal → Verify → Claim Revenue
 * @dev Run: forge script script/FullFlowDemo.s.sol --rpc-url xlayer --broadcast
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY - Publisher's private key
 *
 * What this does:
 *   1. Register as publisher (stake 100 AUREX)
 *   2. Publish 4 signals with different risk profiles
 *   3. Display publisher stats (signal count, accuracy)
 *   4. Show next steps for verification + claim
 */
contract FullFlowDemo is Script {
    // X Layer Mainnet contracts
    address constant SIGNAL_REGISTRY = 0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f;
    address constant ALPHA_HOOK = 0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0;
    address constant MOCK_AUREX = 0x8819A7972e17C61A4eeFe0F06e4bbef521228c82;
    address constant MOCK_USDC = 0x4229Df8c78F60D1Daf54035E01527B9B025C231d;

    // Deployed pool IDs
    bytes32 constant POOL_WETH_USDC = 0xa42ef95993739b4b4fa31f493b8e6fe2ecfdaa946a9eda3cf820d641e247bcb1;
    bytes32 constant POOL_USDC_WBTC = 0x8f902fdacc92a4a7b9c6d373a1a2692748d761b68fe9a2c9372b0713636923db;
    bytes32 constant POOL_USDT_WETH = 0x5a9e74da2155ebb698b778fedaba2ef54e40b0e415e81be96682827851700eff;
    bytes32 constant POOL_USDC_WOKB = 0xb192334b574994b2e7aea853242032a86efb5af60938d97bdbc57908e1f1d838;

    function run() external {
        uint256 publisherPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address publisher = vm.addr(publisherPrivateKey);

        AurexSignalRegistry registry = AurexSignalRegistry(SIGNAL_REGISTRY);
        AurexAlphaHook hook = AurexAlphaHook(ALPHA_HOOK);
        IERC20 aurex = IERC20(MOCK_AUREX);

        console.log("=================================================");
        console.log("        Aurex Full Flow Demo");
        console.log("=================================================");
        console.log("Publisher:", publisher);
        console.log("AUREX Balance:", aurex.balanceOf(publisher) / 1e18, "AUREX");
        console.log("");

        // Check current state
        (uint256 stakeAmount, uint256 signalCount, uint256 accuracyScore, , , bool active) = registry.publishers(publisher);
        console.log("Current State:");
        console.log("  Active:", active);
        console.log("  Stake:", stakeAmount / 1e18, "AUREX");
        console.log("  Signals:", signalCount);
        console.log("  Accuracy:", accuracyScore, "/100");
        console.log("");

        vm.startBroadcast(publisherPrivateKey);

        // Step 1: Register publisher (skip if already registered)
        if (!active) {
            console.log("[Step 1] Registering as publisher...");
            uint256 minStake = 100 * 1e18;
            require(aurex.balanceOf(publisher) >= minStake, "Insufficient AUREX balance");

            aurex.approve(SIGNAL_REGISTRY, minStake);
            registry.registerPublisher(minStake);
            console.log("  -> Registered with stake of 100 AUREX");
        } else {
            console.log("[Step 1] Already registered, skipping...");
        }
        console.log("");

        // Step 2: Publish 4 signals with diverse profiles
        console.log("[Step 2] Publishing signals...");
        uint64 expiry = uint64(block.timestamp + 2 hours);

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, POOL_WETH_USDC, "demo-1")),
            poolId: POOL_WETH_USDC,
            riskScore: 42,
            alphaScore: 81,
            liquidityScore: 90,
            volatilityScore: 55,
            recommendedFee: 2000,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("  -> Signal 1 (WETH/USDC): risk=42, alpha=81");

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, POOL_USDC_WBTC, "demo-2")),
            poolId: POOL_USDC_WBTC,
            riskScore: 28,
            alphaScore: 55,
            liquidityScore: 95,
            volatilityScore: 30,
            recommendedFee: 1500,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("  -> Signal 2 (USDC/WBTC): risk=28, alpha=55");

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, POOL_USDT_WETH, "demo-3")),
            poolId: POOL_USDT_WETH,
            riskScore: 72,
            alphaScore: 35,
            liquidityScore: 60,
            volatilityScore: 85,
            recommendedFee: 7500,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("  -> Signal 3 (USDT/WETH): risk=72, alpha=35 [HIGH RISK]");

        registry.publishSignal(AurexSignal({
            signalId: keccak256(abi.encodePacked(block.timestamp, POOL_USDC_WOKB, "demo-4")),
            poolId: POOL_USDC_WOKB,
            riskScore: 30,
            alphaScore: 78,
            liquidityScore: 70,
            volatilityScore: 40,
            recommendedFee: 2000,
            expiresAt: expiry,
            signer: publisher
        }));
        console.log("  -> Signal 4 (USDC/WOKB): risk=30, alpha=78");

        vm.stopBroadcast();
        console.log("");

        // Step 3: Show updated state
        (uint256 newStake, uint256 newSignalCount, uint256 newAccuracy, , , ) = registry.publishers(publisher);
        console.log("[Step 3] Updated Publisher State:");
        console.log("  Stake:", newStake / 1e18, "AUREX");
        console.log("  Total Signals:", newSignalCount);
        console.log("  Accuracy Score:", newAccuracy, "/100");
        console.log("");

        // Step 4: Show claimable revenue (skip if contract doesn't implement getClaimable)
        console.log("[Step 4] Claimable Revenue:");
        try hook.getClaimable(publisher, MOCK_AUREX) returns (uint256 claimableAUREX) {
            console.log("  AUREX:", claimableAUREX);
        } catch {
            console.log("  (Revenue tracking will be available after first swap)");
        }
        console.log("");

        console.log("=================================================");
        console.log("        Flow Complete!");
        console.log("=================================================");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Wait for signals to expire (2 hours)");
        console.log("2. Run VerifySignals.s.sol to trigger verification");
        console.log("3. Accurate predictions -> accuracy score increases");
        console.log("4. Bad predictions -> 10% stake slashed");
        console.log("5. Run ClaimRevenue.s.sol to claim accumulated fees");
        console.log("");
        console.log("View on explorer:");
        console.log("  https://www.okx.com/web3/explorer/xlayer/address/0x713d8C2f1983848eDFe2F1f3730d9Ff74aBa4b7f");
    }
}
