module.exports = {
  'src/**/*.{ts,js}': ['eslint --fix', 'prettier --write'],
  'tests/**/*.{ts,js}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
};
