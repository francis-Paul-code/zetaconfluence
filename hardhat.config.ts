import "@nomicfoundation/hardhat-toolbox";
import "./tasks/deploy";
import "@zetachain/localnet/tasks";
import "@zetachain/toolkit/tasks";

import { getHardhatConfig } from "@zetachain/toolkit/utils";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  ...getHardhatConfig({ accounts: [process.env.PRIVATE_KEY || ""] }),
};

export default config;
