// eslint.config.js - ESLint "flat config" for the project.
// Defines a single linting config object covering app components/pages, with
// React + React Hooks + unused-import rules tuned for a Vite/React 18 codebase.
import globals from "globals"; // Predefined global identifier sets (here: browser globals).
import pluginJs from "@eslint/js"; // ESLint's core recommended JS rules.
import pluginReact from "eslint-plugin-react"; // React-specific lint rules.
import pluginReactHooks from "eslint-plugin-react-hooks"; // Enforces the Rules of Hooks.
import pluginUnusedImports from "eslint-plugin-unused-imports"; // Detects/auto-removes unused imports and vars.

// Flat config is an array of config objects; this project uses just one.
export default [
  {
    // Only lint app-authored components/pages and the Layout file.
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    // Skip library/util code and the generated shadcn UI primitives.
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    ...pluginJs.configs.recommended, // Spread in the recommended core JS ruleset.
    ...pluginReact.configs.flat.recommended, // Spread in the recommended React ruleset.
    languageOptions: {
      globals: globals.browser, // Treat browser globals (window, document, ...) as defined.
      parserOptions: {
        ecmaVersion: 2022, // Allow modern (ES2022) syntax.
        sourceType: "module", // Files use ES module import/export.
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing.
        },
      },
    },
    settings: {
      react: {
        version: "detect", // Auto-detect the installed React version for rule behavior.
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off", // Disabled in favor of the unused-imports plugin's variant below.
      "react/jsx-uses-vars": "error", // Mark vars used in JSX as "used" (prevents false unused reports).
      "react/jsx-uses-react": "error", // Same, for the React import under classic runtime.
      "unused-imports/no-unused-imports": "error", // Fail on imports that are never referenced.
      // Warn on unused variables, but ignore ones intentionally prefixed with "_".
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used", // Only flag unused args that come after the last used one.
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off", // Not using PropTypes (project relies on other typing/conventions).
      "react/react-in-jsx-scope": "off", // Vite's automatic JSX runtime makes the React import unnecessary.
      // Allow specific non-standard DOM props used by cmdk/toast components.
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error", // Enforce correct hook call ordering/placement.
    },
  },
];
