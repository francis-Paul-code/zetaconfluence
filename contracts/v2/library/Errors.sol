// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library Errors {
    error Unauthorized();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidLoan();
    error InvalidStatus();
    error InvalidChain();
    error AlreadyExecuted();
    error CollateralNotLocked();
    error InsufficientFunding();
}