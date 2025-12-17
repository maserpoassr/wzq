module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.property.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
