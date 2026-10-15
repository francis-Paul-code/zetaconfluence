import "reflect-metadata";

import { DataSource } from "typeorm";

import { DATABASE_URL } from "./config";
import { Loan } from "./entities/Loan";

export const AppDataSource = new DataSource({
  entities: [Loan],
  logging: false,

  synchronize: true,
  type: "postgres",
  url: DATABASE_URL,
});

export const initDB = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("Database connected");
  }
};
