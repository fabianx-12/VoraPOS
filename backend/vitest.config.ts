import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests from the backend root so relative paths like
    // 'database/sqlite/migrations/...' resolve correctly.
    root: '..',
    include: ['backend/tests/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['backend/src/**/*.ts'],
      exclude: ['backend/src/**/*.interface.ts', 'backend/src/main.ts'],
    },
    // Increase timeout for integration tests that bootstrap an in-memory SQLite
    testTimeout: 15_000,
  },
});
