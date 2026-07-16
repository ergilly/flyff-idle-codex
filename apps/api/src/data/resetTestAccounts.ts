import bcrypt from "bcryptjs";

import { closeDatabase } from "./database.js";
import { seedDemoData } from "./seedDemoData.js";

async function main() {
  try {
    const password = process.env.TEST_ACCOUNT_PASSWORD;

    if (!password) {
      throw new Error("TEST_ACCOUNT_PASSWORD is required to reset the seeded test accounts");
    }

    await seedDemoData({
      passwordHash: await bcrypt.hash(password, 10)
    });
    console.log("Reset the seeded test accounts without changing other player accounts.");
  } finally {
    closeDatabase();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
