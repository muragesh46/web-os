const js = require('@eslint/js');

module.exports = [
  { ignores: ['node_modules', 'coverage', 'temp', 'logs'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        node: true,
        jest: true,
        process: true,
        console: true,
        __dirname: true,
        module: true,
        require: true,
        exports: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': 'warn',
    },
  },
];
