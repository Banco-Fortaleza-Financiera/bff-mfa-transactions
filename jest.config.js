const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = {
  ...createCjsPreset({
    tsconfig: '<rootDir>/tsconfig.spec.json',
  }),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/app/**/*.ts',
    '!<rootDir>/src/app/**/*.spec.ts',
    '!<rootDir>/src/app/**/*.module.ts',
    '!<rootDir>/src/app/**/*.routes.ts',
    '!<rootDir>/src/app/**/*.config.ts',
    '!<rootDir>/src/app/remoteEntry.ts',
    '!<rootDir>/src/app/**/*.interface.ts',
    '!<rootDir>/src/app/**/*.types.ts',
  ],
};
