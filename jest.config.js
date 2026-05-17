/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Add this line to tell Jest to ignore the dist folder
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};