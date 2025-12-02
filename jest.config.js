module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	testMatch: ['**/src/**/*.test.ts'],
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!**/node_modules/**'],
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
	},
};
