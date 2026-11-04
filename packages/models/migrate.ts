import { createStore } from "./mod.ts";
const url = Deno.env.get("DATABASE_URL");
if (Deno.env.get("NODE_ENV") === "production" && !url) {
  throw new Error("DATABASE_URL is required in production");
}
const store = await createStore({ databaseUrl: url, dataDir: url ? undefined : ".data/clearpath" });
await store.close();
console.log("Database migrations applied.");
