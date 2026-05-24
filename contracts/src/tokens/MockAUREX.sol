// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@uniswap/v4-core/lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockAUREX is ERC20 {
    constructor() ERC20("Aurex Token", "AUREX") {
        _mint(msg.sender, 1_000_000_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
