/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    'import/order': [
      'warn',
      {
        groups: [['builtin', 'external'], ['internal', 'parent', 'sibling', 'index']],
        'newlines-between': 'always'
      }
    ]
  }
};


