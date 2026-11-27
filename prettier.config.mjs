/** @type {import('prettier').Config} */
const config = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind 4 has no JS config: the plugin reads the design tokens from this stylesheet.
  tailwindStylesheet: './apps/web/src/app/globals.css',
};

export default config;
