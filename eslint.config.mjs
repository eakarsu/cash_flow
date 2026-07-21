import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist-server/**", "dist-web/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  }
);
