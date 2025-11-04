import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  
  dir: './',
});


const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  
  setupFiles: ['<rootDir>/tests/helpers/test-env.ts'],
  
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Subscription API Test Report',
      outputPath: './test-reports/subscription-api.html',
    }]
  ],
  
  clearMocks: true,
  
  coverageDirectory: 'coverage',
  
  collectCoverageFrom: [
    'app/api/subscription/**/*.ts',
    '!**/node_modules/**',
  ],
  
  maxWorkers: 1,
};


export default createJestConfig(customJestConfig); 