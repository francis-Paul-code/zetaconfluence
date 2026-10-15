// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {AquaApp} from "@aqua/src/AquaApp.sol";
import {Errors} from "../library/Errors.sol";
import {IAqua} from "@aqua/src/interfaces/IAqua.sol";
import {Types} from "../library/Types.sol";
import {ZetaSwapVMRouter} from "./ZetaSwapVMRouter.sol";

contract ZetaAquaApp is AquaApp {
    using Math for uint256;

    IAqua public immutable AQUA;
    address public immutable fundingExecutor;
    address public zetaSwapVMRouter;

    /// @notice Base for basis points calculations (100% = 10_000 bps)
    uint256 internal constant BPS_BASE = 10_000;

    constructor(IAqua _aqua) AquaApp(_aqua) {}

    /**
     * @notice Execute an Aqua-backed
     * ZetaConfluence funding strategy.
     *
     * TODO:
     * Wire this into the official AquaApp /
     * AquaSwapVMRouter contracts.
     */
    function executeStrategy(
        address maker,
        bytes32 strategyHash,
        bytes calldata program,
        bytes calldata executionData
    ) external {
        maker;
        strategyHash;
        program;
        executionData;

        // TODO:
        // SwapVM execution.
    }

    /**
     * @notice Create an Aqua-backed
     * ZetaConfluence funding strategy.
     *
     * TODO:
     * Wire this into the official AquaApp /
     * AquaSwapVMRouter contracts.
     */
    function shipStrategy(
        address maker,
        Types.Strategy calldata strategy
    ) external nonReentrantStrategy(strategy.maker, keccak256(abi.encode(strategy))) returns (bytes32 strategyHash){

        strategyHash = AQUA.ship(ZetaSwapVMRouter, strategy, tokens, amounts);
    }
}
