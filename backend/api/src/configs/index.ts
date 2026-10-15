import * as dotenv from "dotenv";

import { IBaseConfig, IEnvConfig, IProcessEnv } from "./types";

dotenv.config();
const processEnv: IProcessEnv = process.env;
const nodeEnv: string = processEnv.NODE_ENV || "development";

const baseConfig: IBaseConfig = {
  isDev: nodeEnv === "development",
  isProd: nodeEnv === "production",
  isStage: nodeEnv === "staging",
  isTest: nodeEnv === "test",
  nodeEnv,
};
let envConfig: IEnvConfig;

switch (nodeEnv) {
  case "development":
    envConfig = {
      api: {
        extUrlencoded: processEnv.API_EXT_URLENCODED == "false" || true,
        jsonLimit: processEnv.API_JSON_LIMIT || "5mb",
        keys: (processEnv.API_KEYS && processEnv.API_KEYS.split(",")) || [],
        prefix: processEnv.API_PREFIX || "api",
        version: processEnv.API_VERSION || "v1.0.0",
      },
      app: {
        host: processEnv.HOST_URL || "localhost",
        port: (processEnv.PORT && parseInt(processEnv.PORT, 10)) || 8910,
      },
      aws: {
        access: {
          keyID: processEnv.AWS_ACCESS_KEY_ID || "",
          keySecret: processEnv.AWS_ACCESS_KEY_SECRET || "",
        },
        s3: {
          name: processEnv.AWS_S3_BUCKET_NAME || "",
          region: processEnv.AWS_S3_BUCKET_REGION || "",
        },
      },
      bcrypt: {
        saltRounds:
          (processEnv.BCRYPT_SALT_ROUNDS &&
            parseInt(processEnv.BCRYPT_SALT_ROUNDS, 10)) ||
          30,
      },

      ratelimiter: {
        max:
          (processEnv.RATE_LIMIT_MAX &&
            parseInt(processEnv.RATE_LIMIT_MAX, 10)) ||
          30,
        window: processEnv.RATE_LIMIT_WINDOW || "1 minute",
      },
    };
    break;

  default:
    envConfig = {
      api: {
        extUrlencoded: processEnv.API_EXT_URLENCODED == "false" || true,
        jsonLimit: processEnv.API_JSON_LIMIT || "5mb",
        keys: (processEnv.API_KEYS && processEnv.API_KEYS.split(",")) || [],
        prefix: processEnv.API_PREFIX || "api",
        version: processEnv.API_VERSION || "v2",
      },
      app: {
        host: processEnv.HOST_URL || "localhost",
        port: (processEnv.PORT && parseInt(processEnv.PORT, 10)) || 8835,
      },
      aws: {
        access: {
          keyID: processEnv.AWS_ACCESS_KEY_ID || "",
          keySecret: processEnv.AWS_ACCESS_KEY_SECRET || "",
        },
        s3: {
          name: processEnv.AWS_S3_BUCKET_NAME || "",
          region: processEnv.AWS_S3_BUCKET_REGION || "",
        },
      },
      bcrypt: {
        saltRounds:
          (processEnv.BCRYPT_SALT_ROUNDS &&
            parseInt(processEnv.BCRYPT_SALT_ROUNDS, 10)) ||
          30,
      },

      ratelimiter: {
        max:
          (processEnv.RATE_LIMIT_MAX &&
            parseInt(processEnv.RATE_LIMIT_MAX, 10)) ||
          30,
        window: processEnv.RATE_LIMIT_WINDOW || "1 minute",
      },
    };
}
const config = { ...baseConfig, ...envConfig };

export default config;
