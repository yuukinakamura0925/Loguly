import { readFileSync } from "fs";
import pg from "pg";

const { Client } = pg;

// .env.local から DATABASE_URL を読み取る
const envContent = readFileSync(".env.local", "utf8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("ERROR: DATABASE_URL が .env.local に見つかりません");
  process.exit(1);
}

const databaseUrl = match[1].trim();
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/db-execute.mjs <sql-file>");
  process.exit(1);
}

const sql = readFileSync(sqlFile, "utf8");
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ ${sqlFile} を実行しました`);
} catch (err) {
  console.error("SQL実行エラー:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
