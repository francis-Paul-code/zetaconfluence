import dotenv from "dotenv";
dotenv.config();

export const RPC_URL = process.env.RPC_URL!;
export const PRIVATE_KEY = process.env.PRIVATE_KEY!;
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
export const PYTH_FEED_ID = process.env.PYTH_FEED_ID!;
export const DATABASE_URL = process.env.DATABASE_URL;
export const OWNER_ACCOUNT = process.env.OWNER_ACCOUNT;
