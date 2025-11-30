import "@nomicfoundation/hardhat-toolbox";

import { getHardhatConfig } from "@zetachain/toolkit/utils";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  ...getHardhatConfig({ accounts: [process.env.PRIVATE_KEY || ""] }),
  solidity: {
    compilers: [
      {
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
        version: "0.8.26",
      },
      {
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
        version: "0.8.24",
      },
      {
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
        version: "0.8.20",
      },
    ],
  },
};

export default config;
