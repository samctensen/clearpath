import { strict as assert } from "node:assert";
import { parseWebOrigins } from "../src/config.ts";

Deno.test("WEB_ORIGIN parses trimmed exact origins and removes empty entries", () => {
  assert.deepEqual(
    parseWebOrigins(" https://clearpathfinancial.xyz, ,https://clearpath-review-psi.vercel.app "),
    ["https://clearpathfinancial.xyz", "https://clearpath-review-psi.vercel.app"],
  );
  assert.deepEqual(parseWebOrigins(" , "), []);
  assert.deepEqual(parseWebOrigins(undefined), []);
});
