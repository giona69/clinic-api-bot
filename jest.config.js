// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  automock: false,
  bail: 0,
  clearMocks: true,
  collectCoverage: false,
  notify: false,
  resetMocks: true,
  resetModules: true,
  coverageDirectory: 'test-results/coverage',
  collectCoverageFrom: ['./**/*.js', '!./routes/**/*.js', '!./views/js/*.js'],
  coverageReporters: ['json-summary', 'json', 'text'],
  reporters: ['default', 'jest-junit'],
  testEnvironment: 'node',
};
