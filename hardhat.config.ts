import "@nomicfoundation/hardhat-toolbox";
import "./tasks/deploy";
import "@zetachain/localnet/tasks";
import "@zetachain/toolkit/tasks";

import { getHardhatConfig } from "@zetachain/toolkit/utils";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();
const { solidity, ...rest } = getHardhatConfig({
  accounts: [process.env.PRIVATE_KEY || ""],
});
const config: HardhatUserConfig = {
  ...rest,
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
    version: solidity,
  },
};

export default config;
