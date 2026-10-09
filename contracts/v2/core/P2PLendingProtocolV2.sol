// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import {
UniversalContract
} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import {EIP712} from "../../../dependencies/openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {PythUtils} from "@pythnetwork/pyth-sdk-solidity/PythUtils.sol";
import {ReentrancyGuard} from "../../../dependencies/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract P2PLendingProtocolV2 is UniversalContract, Ownable, Pausable, ReentrancyGuard, EIP712{

    SystemContract public immutable systemContract;
    IPyth public pyth;
    GatewayZEVM public immutable gatewayZEVM;
    address public immutable uniswapRouter;
    address public immutable uniswapRouter;

    constructor(
        address initialOwner,
        address _uniswapRouter,
        address swapVM
    ) Ownable(initialOwner) EIP712("P2PLendingProtocolV2", "1") {
        systemContract = SystemContract(_systemContract);
        gatewayZEVM = GatewayZEVM(_gatewayZEVM);
        uniswapRouter = _uniswapRouter;
        pyth = IPyth(pythContractZEVM);
    }


    // =================== OnCall Function ====================
    function onCall(
        MessageContext calldata /*context*/,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override virtual onlyGateway {

    }


    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Emergency pause
     * @param reason Reason for pausing
     */
    function emergencyPause(
        string memory reason
    ) external _onlyOwner(msg.sender) {
        _pause();
        emit Types.EmergencyPaused(reason, block.timestamp);
    }

    /**
     * @dev Resume operations
     */
    function unpause() external _onlyOwner(msg.sender) {
        _unpause();
    }
}
