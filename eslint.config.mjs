import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules
  {
    rules: {
      // Allow setState in useEffect - this is a common pattern for data fetching
      // that is safe and widely used in React applications
      "react-hooks/set-state-in-effect": "off",
      // Allow preserve-manual-memoization warnings - these are optimization hints
      // not actual errors
      "react-hooks/preserve-manual-memoization": "off",
      // Allow inline component definitions - while not ideal for performance,
      // this is a common pattern that works correctly
      "react-compiler/react-compiler": "off",
    },
  },
]);

export default eslintConfig;
