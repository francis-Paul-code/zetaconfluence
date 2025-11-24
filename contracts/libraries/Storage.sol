// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Types.sol";

// consider using offChain storage to reduce costs (maybe by archiving old items offChain leaving active loans and bids on chain)

library StorageLib {
    struct LendingStorage {
        mapping(uint256 => Types.LoanRequest) loanRequests;
        mapping(address => Types.User) users;
        mapping(bytes32 => Types.EscrowInfo) escrows;
        mapping(uint256 => Types.Loan) loans;
        mapping(uint256 => Types.Bid) bids;
        mapping(uint256 => uint256) activeLoanIndex;
        uint256[] activeLoanIds; // loanId -> index in activeLoanIds
        uint256 loanRequestCounter;
        uint256 loanCounter;
        uint256 bidCounter;
    }
}