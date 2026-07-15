import bcrypt from "bcryptjs";

import { closeDatabase } from "./database.js";
import { seedDemoData } from "./seedDemoData.js";

async function main() {
  await seedDemoData({
    passwordHash: await bcrypt.hash(process.env.TEST_ACCOUNT_PASSWORD ?? "password123", 10)
  });
  closeDatabase();
  console.log("Reset the seeded test accounts without changing other player accounts.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
