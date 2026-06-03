import bcrypt from "bcryptjs";
import { seedDemoData } from "./seedDemoData.js";

async function main() {
  await seedDemoData({
    passwordHash: await bcrypt.hash("password123", 10)
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
