import "reflect-metadata";

import { DataSource } from "typeorm";

import { DATABASE_URL } from "./configs";
import { Loan } from "./entities/Loan";

export const AppDataSource = new DataSource({
  entities: [Loan],
  logging: false,

  synchronize: true,
  type: "postgres",
  url: DATABASE_URL,
});

export async function initDB() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("✅ Database connected");
  }
}
