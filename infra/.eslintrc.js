module.exports = {
  env: {
    browser: false,
    es2021: true
  },
  extends: [
    'standard'
  ],
  overrides: [{
    env: {
      node: true
    },
    files: [
      '.eslintrc.{js,cjs}'
    ],
    parserOptions: {
      sourceType: 'script'
    }
  }],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-new': 'off'
  }
}
