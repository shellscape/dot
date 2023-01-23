module.exports = {
  extends: ['shellscape/typescript', 'plugin:import/typescript'],
  parserOptions: {
    project: ['./shared/tsconfig.eslint.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  overrides: [
    {
      files: ['**/fixtures/**', '**/scripts/**', '**/test/**'],
      rules: {
        'import/extensions': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
        'no-console': 'off'
      }
    }
  ]
};
