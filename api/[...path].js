// This file is the Vercel serverless function entry point.
// It loads the pre-compiled, esbuild-bundled Express handler from dist/api/index.cjs.
// All TypeScript compilation and @shared/* path alias resolution is handled by
// the esbuild build step (npm run build), NOT by Vercel's TypeScript compiler.

const compiled = require('../dist/api/index.cjs');
module.exports = compiled.default || compiled;
