/**
 * Tests unitarios (rápidos, sin red ni base de datos). Corren con `npm test` y en el CI.
 * Un test vive junto a lo que prueba, en una carpeta __tests__/ y termina en `.test.ts(x)`.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/types/**', '!src/app/**'],
};
