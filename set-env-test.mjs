import fs from "node:fs";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const wanted = [
  ["DATABASE_URL", "Paste the POOLED connection string (Connection pooling ON), then press Enter: "],
  ["DIRECT_URL", "Paste the DIRECT connection string (Connection pooling OFF), then press Enter: "],
];
const lines = [];
for (const [key, prompt] of wanted) {
  const answer = await rl.question(prompt);
  const m = answer.match(/postgres(?:ql)?:\/\/[^\s"']+/);
  if (!m) { console.log(`${key}: that was not a postgresql:// URL. Nothing written.`); process.exit(1); }
  const url = new URL(m[0]);
  console.log(`${key}: ok, host-is-pooler=${url.hostname.includes("-pooler")}, database=${url.pathname}`);
  lines.push(`${key}="${m[0]}"`);
}
rl.close();
fs.writeFileSync("apps/api/.env.test", lines.join("\n") + "\n");
console.log("Wrote apps/api/.env.test");
