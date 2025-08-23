import { runBot } from "./bot";
import { initDB } from "./db";

async function main() {
  console.log("Starting liquidation bot...");
  await initDB();
  await runBot();
}

main();
