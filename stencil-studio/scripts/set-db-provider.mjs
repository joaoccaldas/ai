// Picks the Prisma datasource provider from DATABASE_URL so the same schema runs
// on SQLite locally (zero setup) and Postgres in production.
//   file:./dev.db        -> sqlite
//   postgres(ql)://…     -> postgresql
//   mysql://…            -> mysql
import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL || "file:./dev.db";
const provider = url.startsWith("postgres")
  ? "postgresql"
  : url.startsWith("mysql")
    ? "mysql"
    : "sqlite";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const src = fs.readFileSync(schemaPath, "utf8");
const next = src.replace(/provider\s*=\s*"(sqlite|postgresql|mysql)"/, `provider = "${provider}"`);
if (next !== src) {
  fs.writeFileSync(schemaPath, next);
  console.log(`[db] datasource provider -> ${provider}`);
} else {
  console.log(`[db] datasource provider already ${provider}`);
}
