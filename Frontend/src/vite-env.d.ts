/// <reference types="vite/client" />

/**
 * This file ensures TypeScript knows about:
 * - import.meta.env.VITE_* variables
 * - The Vite HMR API
 *
 * If you still see ts(2339) on import.meta.env in .tsx files,
 * make sure "types": ["vite/client"] is in your tsconfig.json compilerOptions.
 */

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}