// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";

/**
 * @title ClaimRevenue
 * @notice Claim accumulated swap fee revenue as a publisher
 * @dev Run: forge script script/ClaimRevenue.s.sol --rpc-url xlayer --broadcast
 */
contract ClaimRevenue is Script {
    address constant ALPHA_HOOK = 0x3D28D43FFB4ed9321B0d740B2B457E802259C0c0;
    address constant MOCK_AUREX = 0x8819A7972e17C61A4eeFe0F06e4bbef521228c82;
    address constant MOCK_USDC = 0x4229Df8c78F60D1Daf54035E01527B9B025C231d;
    address constant WETH = 0x5A77f1443D16ee5761d310e38b62f77f726bC71c;
    address constant USDC = 0x74b7F16337b8972027F6196A17a631aC6dE26d22;

    function run() external {
        uint256 publisherPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address publisher = vm.addr(publisherPrivateKey);

        AurexAlphaHook hook = AurexAlphaHook(ALPHA_HOOK);

        console.log("=== Claim Revenue ===");
        console.log("Publisher:", publisher);
        console.log("");

        // Check claimable amounts for each token
        address[] memory tokens = new address[](4);
        tokens[0] = MOCK_AUREX;
        tokens[1] = MOCK_USDC;
        tokens[2] = WETH;
        tokens[3] = USDC;

        string[] memory names = new string[](4);
        names[0] = "MockAUREX";
        names[1] = "MockUSDC";
        names[2] = "WETH";
        names[3] = "USDC";

        vm.startBroadcast(publisherPrivateKey);

        for (uint i = 0; i < tokens.length; i++) {
            uint256 claimable = hook.getClaimable(publisher, tokens[i]);
            if (claimable > 0) {
                console.log("Claiming", names[i], ":", claimable);
                hook.claimFees(tokens[i]);
                console.log("  -> Claimed");
            } else {
                console.log("No claimable", names[i]);
            }
        }

        vm.stopBroadcast();
        console.log("");
        console.log("=== Claim Complete ===");
    }
}
