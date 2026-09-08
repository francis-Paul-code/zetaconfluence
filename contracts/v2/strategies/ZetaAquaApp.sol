// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {AquaApp} from "@aqua/src/AquaApp.sol";
import {IAqua} from "@aqua/src/interfaces/IAqua.sol";

contract ZetaAquaApp is AquaApp {

    constructor(IAqua aqua) AquaApp(aqua){

    }
}
