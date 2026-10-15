import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";

// Connect to Pyth price service
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");

export const getPrice = async (feedId: string): Promise<number> => {
  const priceFeed = await connection.getLatestPriceFeeds([feedId]);
  if (!priceFeed || priceFeed.length === 0) {
    throw new Error("Price feed not available");
  }
  const price = priceFeed[0].getPriceNoOlderThan(60); // 60s freshness
  return Number(price!?.price) / 10 ** price!?.expo; // normalize
};
