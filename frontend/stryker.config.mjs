/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vite.config.js',
  },
  mutate: ['src/utils/formatters.js'],
  coverageAnalysis: 'perTest',
  concurrency: 2,
  reporters: ['html', 'progress'],
  htmlReporter: {
    fileName: 'test-results/mutation/index.html',
  },
  ignorePatterns: ['node_modules', 'test-results', 'tests/e2e'],
  thresholds: { high: 80, low: 60, break: null },
};
