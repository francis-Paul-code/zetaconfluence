export interface IProcessEnv {
  [key: string]: string | undefined;
}
export interface IBaseConfig {
  isDev: boolean;
  isProd: boolean;
  isStage: boolean;
  isTest: boolean;
  nodeEnv: string;
}

interface IApp {
  host: string;
  port: number;
}

interface IApi {
  extUrlencoded: boolean;
  jsonLimit: string;
  keys: string[];
  prefix: string;
  version: string;
}

interface IRatelimiter {
  max: number;
  window: string;
}

interface IJwt {
  expiredIn: string;
  secretAdmin: string;
  secretApp: string;
  secretUser: string;
}

interface ICors {
  allowOrigin: string;
}

interface IBcrypt {
  saltRounds: number;
}

interface IAWS {
  access: { keyID: string; keySecret: string };
  s3: { name: string; region: string };
}

export interface IEnvConfig {
  api: IApi;
  app: IApp;
  aws: IAWS;
  bcrypt: IBcrypt;
  //   cors: ICors;
  //   jwt: IJwt;
  ratelimiter: IRatelimiter;
}
