import { ethers } from "ethers";

import { CONTRACT_ADDRESS, PRIVATE_KEY, RPC_URL } from "./config";

let cachedABI: any = null;

export const fetchABI = async (url: string) => {
  if (cachedABI) return cachedABI;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ABI: ${response.statusText}`);
  }

  cachedABI = await response.json();
  return cachedABI;
};

export const getContract = async (abiUrl?: string) => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);


  const abi = abiUrl
    ? await fetchABI(abiUrl)
    : (await import("../abi/P2PLendingProtocol.json")).default;

  return new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
};
