const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**/page.tsx",
    "!src/app/layout.tsx",
    "!src/**/generated/**",
    "!src/test/**"
  ],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 75,
      functions: 85,
      lines: 85
    }
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
};

module.exports = createJestConfig(customJestConfig);
