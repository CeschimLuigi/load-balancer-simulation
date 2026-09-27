/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.ts$": ["@swc/jest"],
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    clearMocks: true,
    collectCoverageFrom: ["src/**/*.ts", "!src/tests/**", "!src/server.ts"],
    coverageThreshold: {
        global: {
            statements: 75,
            branches: 75,
            functions: 75,
            lines: 75,
        },
    },
}
