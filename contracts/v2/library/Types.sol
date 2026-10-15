// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

library Types {
    struct Strategy {
        address maker;   // required — makes strategyHash unique per maker
        address[] allowedPrincipal;
        address[] allowedCollateral;
        address[] tokens; // approved tokens to fund strategy
        uint256[] amounts; // amounts for approved tokens
        uint256 minIntRate;
        uint256 maxDuration;
        bool allowPartialFill;
        bool allowFullFill;

        // ... strategy parameters (IMMUTABLE once shipped)
        uint256 feeBps;  // optional - strategy fees
        bytes32 salt;    // optional — allows multiple strategies per (maker, pair, fee)
    }

    struct User {
        address userAddress;
        uint256[] loans;
        uint256[] loanRequests;
        byte32[] strategies;
        bool exists;
    }
}