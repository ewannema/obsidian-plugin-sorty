import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		ignores: ['node_modules/**', 'main.js', 'dist/**', 'build/**', 'coverage/**', 'lib/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	prettierConfig,
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		plugins: {
			prettier,
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'prettier/prettier': 'error',
		},
	},
];
