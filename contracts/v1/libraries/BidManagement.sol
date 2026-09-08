// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Types.sol";
import "./Storage.sol";

library BidManagement {

    function createBid(
        StorageLib.LendingStorage storage store,
        uint256 loanRequestId,
        address lender,
        uint128 amount, 
        uint64 interestRate,
        address fundingAsset,
        Types.BidStatus status
    ) internal returns (Types.Bid memory bid) {
        Types.LoanRequest storage loan_request = store.loanRequests[loanRequestId];

        uint256 bidId = ++store.bidCounter;
      
        bid = Types.Bid({
            id: bidId,
            loanRequestId: loanRequestId,
            lender: lender,
            amount: amount,
            amountFilled: 0,
            interestRate: interestRate,
            fundingAsset: fundingAsset,
            requiresSwap: fundingAsset != loan_request.principalAsset,
            status: status,
            createdAt: uint128(block.timestamp),
            acceptedAt: 0,
            gasDeducted: 0,
            exists: true
        });
          
        store.bids[bidId] =  bid;

        if (store.users[lender].exists) {
            store.users[lender].bids.push(bidId);
        } else {
            Types.User storage user = store.users[lender];
            user.userAddress = lender;
            user.exists = true;
            user.bids.push(bidId);
        }

        // Add to loan Requests bids
        store.loanRequests[loanRequestId].bids.push(bidId);

    }
}