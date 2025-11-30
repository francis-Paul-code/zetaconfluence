import server from "./server";

export default async (silent: boolean) => {
  await runServer(silent);
};
const runServer = async (silent: boolean) => {
  await server(silent);
};
