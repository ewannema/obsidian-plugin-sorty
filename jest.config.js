module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	testMatch: ['**/*.test.ts'],
	collectCoverageFrom: [
		'**/*.ts',
		'!**/*.test.ts',
		'!**/node_modules/**',
	],
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
	},
};
