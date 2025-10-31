import nextJest from "next/jest";
import type { Config } from "jest";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig: Config = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "^.+\\.(css|scss|sass)$": "identity-obj-proxy",
        "^.+\\.(png|jpg|jpeg|gif|webp|avif|svg)$": "<rootDir>/test/__mocks__/fileMock.ts",
    },
    testEnvironment: "jest-environment-jsdom",
    testMatch: [
        "<rootDir>/**/__tests__/**/*.(test|spec).[jt]s?(x)",
        "<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)",
    ],
};

export default createJestConfig(customJestConfig);
