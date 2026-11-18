import "dotenv/config";
import { prisma } from "../plugins/database.js";
import { runMediaRetentionCleanup } from "../modules/media/media-retention.service.js";

try {
  const result = await runMediaRetentionCleanup();
  console.log("Citeface media retention completed:", result);

  if (result.failed > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    "Citeface media retention failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}