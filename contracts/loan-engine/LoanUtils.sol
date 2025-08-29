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
     * @dev Calculate total amount owed for a loan (principal + interest)
     */
    function calculateTotalOwed(uint256 loanId) view returns (uint256) {
        Types.Loan storage loan = loans[loanId];
        if (loan.status != Types.LoanStatus.ACTIVE) return 0;

        uint256 timeElapsed = block.timestamp - loan.createdAt;
        uint256 principal = loan.principalAmount;

        // Calculate weighted average interest rate
        uint256 weightedRate = 0;
        uint256[] storage bidIds = loan.bids;

        for (uint256 i = 0; i < bidIds.length; i++) {
            Types.Bid storage bid = bids[bidIds[i]];
            if (bid.status == Types.BidStatus.ACCEPTED) {
                weightedRate += (bid.amount * bid.interestRate);
            }
        }
        weightedRate = weightedRate / principal;

        uint256 minimumInterestPeriod = (loan.loanDuration * 35) / 100; // minimumInterestPeriod is 35% of loanDuration

        uint256 outstandingPrincipal = principal - loan.totalRepaid;

        if (timeElapsed < minimumInterestPeriod) {
            // interest is calculated based on entire principal regardless of totalRepaid
            uint256 interest = (principal *
                weightedRate *
                minimumInterestPeriod) / (365 days * 10000);
            return outstandingPrincipal + interest;
        }

        // intrest is calculated based on what is actually owed
        uint256 interest = (outstandingPrincipal * weightedRate * timeElapsed) /
            (365 days * 10000);

        return outstandingPrincipal + interest;
    }

    /**
     * @dev Get USD value of an asset amount
     */
    function getAssetValueUSD(
        address asset,
        uint256 amount,
        uint256 price
    ) internal view returns (uint256) {
        require(price > 0, "Asset price not available");

        // Assuming 18 decimals for both price and amount
        return (amount * price) / 1e18;
    }

    // Private implementation for token swap
    function _executeSwap(
        address inputToken,
        address outputToken,
        uint256 amount,
        address uniSwapRouter
    ) private returns (bool) {
        IZRC20(inputToken).approve(uniswapRouter, amount);

        // calculate the minimum amount of outputToken that would be returned by the inputAmount swap
        uint256 minOutAmount = SwapHelperLib.getMinOutAmount(
            uniswapRouter,
            inputToken,
            outputToken,
            amount
        );

        // Get initial output token balance to calculate actual swap output
        uint256 initialBalance = IZRC20(outputToken).balanceOf(address(this));
        uint256 gasBefore = gasleft();
        // Execute the swap using SwapHelperLib
        uint256 _amount = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
            amount,
            outputToken,
            minOutAmount
        );
        uint256 gasAfter = gasleft();

        // find a way of charging this to the initiator
        uint256 gasUsed = gasBefore - gasAfter;

        if (_amount <= 0) return false;

        // Calculate the actual output amount
        uint256 finalBalance = IZRC20(outputToken).balanceOf(address(this));
        uint256 outputAmount = finalBalance - initialBalance;

        // Verify minimum output was received, idk about this
        if (outputAmount < minOutAmount) return false;

        return true;
    }

    function _removeLoanFromActive(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        require(loan.status != LoanStatus.ACTIVE, "Loan still active");

        uint256 idx = activeLoanIndex[loanId];
        uint256 lastId = activeLoanIds[activeLoanIds.length - 1];

        // swap
        activeLoanIds[idx] = lastId;
        activeLoanIndex[lastId] = idx;

        // pop
        activeLoanIds.pop();
        delete activeLoanIndex[loanId];
    }

    /**
     *@dev Get asset last price
     *@param assets ZRC20 token address
     *@return lastPrice List of price map to assetsOut
     *@return assetsOut List of asset addresses for the price list
     */
    function _getAssetLastPrice(
        address[] memory assets,
        bytes[] calldata pythUpdateData
    )
        internal
        returns (uint128[] memory lastPrice, address[] memory assetsOut)
    {
        uint256 updateFee = pyth.getUpdateFee(pythUpdateData);
        pyth.updatePriceFeeds{value: updateFee}(pythUpdateData);

        lastPrice = new uint128[](assets.length);
        assetsOut = assets;

        for (uint256 i = 0; i < assets.length; i++) {
            require(supportedAssets[assets[i]], "Asset not supported");

            bytes32 assetID = pythPriceIds[assets[i]];

            PythStructs.Price memory assetPrice = pyth.getPriceNoOlderThan(
                assetID,
                60
            );

            uint256 basePrice = PythUtils.convertToUint(
                assetPrice.price,
                assetPrice.expo,
                18
            );

            require(basePrice > 0, "Invalid price from feed");

            lastPrice[i] = uint128(basePrice);
        }
    }
}
