import { runBot } from "./bot";
import { initDB } from "./db";

const main = async () => {
  console.log("Starting liquidation bot...");
  await initDB();
  await runBot();
};

main();
