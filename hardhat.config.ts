import "@nomicfoundation/hardhat-toolbox";

import { getHardhatConfig } from "@zetachain/toolkit/utils";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  ...getHardhatConfig({ accounts: [process.env.PRIVATE_KEY || ""] }),
};

export default config;
