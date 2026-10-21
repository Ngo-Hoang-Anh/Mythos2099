import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "assets/**",
      "public/**",
      "resource/**",
      "web/**",
      ".dbg/**",
      // One-off Node scripts (CJS/MJS tooling), not app code
      "scripts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Classic hooks rules only — React Compiler rules (set-state-in-effect, refs, …)
      // fight common UI patterns (reset-on-prop-change, render-time ref sync) in this codebase.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "src/tools/**/*.ts", "studio/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  // Files that intentionally co-export helpers/constants with components
  {
    files: [
      "src/ui/HandView.tsx",
      "src/ui/OpponentCardReveal.tsx",
      "src/ui/UiChrome.tsx",
      "src/ui/UnitToken.tsx",
      "src/ui/icons.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
