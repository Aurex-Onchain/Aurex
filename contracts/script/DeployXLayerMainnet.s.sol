// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {AurexAlphaHook} from "../src/hooks/AurexAlphaHook.sol";
import {AurexSignalRegistry} from "../src/registry/AurexSignalRegistry.sol";
import {AurexPolicyManager} from "../src/policy/AurexPolicyManager.sol";
import {MockAUREX} from "../src/tokens/MockAUREX.sol";
import {MockUSDC} from "../src/tokens/MockUSDC.sol";

contract DeployXLayerMainnet is Script {
    // BEFORE_SWAP_FLAG | AFTER_SWAP_FLAG = 0x80 | 0x40 = 0xC0
    uint160 constant HOOK_FLAGS = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Tokens
        MockAUREX aurexToken = new MockAUREX();
        console.log("MockAUREX:", address(aurexToken));

        MockUSDC usdcToken = new MockUSDC();
        console.log("MockUSDC:", address(usdcToken));

        // 2. Deploy Signal Registry (stake-to-publish)
        uint256 minStake = 100 * 1e18;
        AurexSignalRegistry signalRegistry = new AurexSignalRegistry(
            address(aurexToken),
            poolManagerAddress,
            minStake
        );
        console.log("AurexSignalRegistry:", address(signalRegistry));

        // 3. Deploy Policy Manager
        AurexPolicyManager policyManager = new AurexPolicyManager();
        console.log("AurexPolicyManager:", address(policyManager));

        // 4. Deploy Hook using CREATE2 with salt mining
        bytes memory hookCreationCode = abi.encodePacked(
            type(AurexAlphaHook).creationCode,
            abi.encode(poolManagerAddress, address(signalRegistry), address(policyManager))
        );

        address hookAddress;
        bytes32 salt;
        bool found = false;
        bytes32 initCodeHash = keccak256(hookCreationCode);

        // Mine for a salt that produces an address with correct hook flags
        for (uint256 i = 0; i < 100000; i++) {
            salt = bytes32(i);
            hookAddress = _computeCreate2(salt, initCodeHash);

            if (uint160(hookAddress) & HOOK_FLAGS == HOOK_FLAGS) {
                found = true;
                break;
            }
        }

        require(found, "Could not find valid hook address");

        // Deploy with CREATE2
        AurexAlphaHook hook;
        assembly {
            hook := create2(0, add(hookCreationCode, 0x20), mload(hookCreationCode), salt)
        }
        require(address(hook) != address(0), "CREATE2 deployment failed");
        require(address(hook) == hookAddress, "Address mismatch");
        console.log("AurexAlphaHook:", address(hook));
        console.log("Salt used:", uint256(salt));

        // 5. Register deployer as publisher by staking
        aurexToken.approve(address(signalRegistry), minStake);
        signalRegistry.registerPublisher(minStake);
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Publisher registered:", deployer);

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary (X Layer Mainnet) ===");
        console.log("Chain: X Layer Mainnet (196)");
        console.log("PoolManager:", poolManagerAddress);
        console.log("SignalRegistry:", address(signalRegistry));
        console.log("PolicyManager:", address(policyManager));
        console.log("Hook:", address(hook));
        console.log("AUREX Token:", address(aurexToken));
        console.log("USDC Token:", address(usdcToken));
    }

    function _computeCreate2(bytes32 _salt, bytes32 _initCodeHash) internal view returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            _salt,
            _initCodeHash
        )))));
    }
}
