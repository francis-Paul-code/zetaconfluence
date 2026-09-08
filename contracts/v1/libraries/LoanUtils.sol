// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Types} from "./Types.sol";
import {IZRC20} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {BytesHelperLib} from "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

library LoanUtils {

    /**
     * @dev Get USD value of an asset amount
     */
    function getAssetValueUSD(
        address, // asset parameter not used in calculation
        uint256 amount,
        uint256 price
    ) internal pure returns (uint256) {
        require(price > 0, "Asset price not available");

        // Assuming 18 decimals for both price and amount
        return (amount * price) / 1e18;
    }

    // Private implementation for token swap
    function executeSwap(
        address initiator,
        address inputToken,
        address outputToken,
        uint256 amount,
        address uniswapRouter
    ) internal returns (bool) {
        IZRC20(inputToken).approve(uniswapRouter, amount);

        // calculate the minimum amount of outputToken that would be returned by the inputAmount swap
        uint256 minOutAmount = SwapHelperLib.getMinOutAmount(
            uniswapRouter,
            inputToken,
            outputToken,
            amount
        );

        // Get initial output token balance to calculate actual swap output
        uint256 initialBalance = IZRC20(outputToken).balanceOf(initiator);
        
        // Execute the swap using SwapHelperLib
        uint256 _amount = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
            amount,
            outputToken,
            minOutAmount
        );

        // Gas tracking for future use
        // uint256 gasUsed = gasBefore - gasAfter;

        if (_amount <= 0) return false;

        // Calculate the actual output amount
        uint256 finalBalance = IZRC20(outputToken).balanceOf(address(this));
        uint256 outputAmount = finalBalance - initialBalance;

        // Verify minimum output was received, idk about this
        if (outputAmount < minOutAmount) return false;

        return true;
    }

}
