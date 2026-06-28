// postcss.config.js - PostCSS pipeline used by Vite to process CSS.
// Runs every stylesheet through two plugins in order.
export default {
  plugins: {
    tailwindcss: {}, // Expands Tailwind's @tailwind directives and generates utility classes from tailwind.config.js.
    autoprefixer: {}, // Adds vendor prefixes (-webkit-, etc.) based on the project's browserslist.
  },
}
