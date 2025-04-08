import * as esbuild from 'esbuild';
import dotenv from 'dotenv';
import { readdirSync } from 'fs';
import { join, sep } from 'path';

// Load environment variables based on BUILD_ENV
const envFile = `.env.${process.env.BUILD_ENV || 'local'}`;
dotenv.config({ path: envFile });

if (!process.env.API_ENDPOINTS) {
  console.error('❌ API_ENDPOINTS is not defined. Check your .env files.');
  process.exit(1);
}

const BUILD_DIRECTORY = `dist/${process.env.BUILD_ENV || 'local'}`;
const IS_PRODUCTION = process.env.BUILD_ENV === 'production';
const IS_STAGING = process.env.BUILD_ENV === 'staging';
const LIVE_RELOAD = !(IS_PRODUCTION || IS_STAGING); // only run dev server in local/dev
const SERVE_PORT = 3000;
const SERVE_ORIGIN = LIVE_RELOAD ? `http://localhost:${SERVE_PORT}` : '';

// Define environment variables for esbuild
const defineEnv = {
  'process.env.API_ENDPOINTS': JSON.stringify(process.env.API_ENDPOINTS),
  ...(LIVE_RELOAD && { SERVE_ORIGIN: JSON.stringify(SERVE_ORIGIN) }),
};

// Setup esbuild
const context = await esbuild.context({
  entryPoints: ['src/index.ts'],
  outdir: BUILD_DIRECTORY,
  bundle: true,
  sourcemap: LIVE_RELOAD,
  target: LIVE_RELOAD ? 'esnext' : 'es2020',
  inject: LIVE_RELOAD ? ['./bin/live-reload.js'] : undefined,
  define: defineEnv,
});

if (LIVE_RELOAD) {
  await context.watch();
  await context
    .serve({
      servedir: BUILD_DIRECTORY,
      port: SERVE_PORT,
    })
    .then(logServedFiles);
} else {
  await context.rebuild();
  context.dispose();
}

/**
 * Logs information about the files that are being served during local development.
 */
function logServedFiles() {
  const getFiles = (dirPath) => {
    return readdirSync(dirPath, { withFileTypes: true })
      .flatMap((dirent) => {
        const path = join(dirPath, dirent.name);
        return dirent.isDirectory() ? getFiles(path) : path;
      });
  };

  const files = getFiles(BUILD_DIRECTORY);

  const filesInfo = files
    .map((file) => {
      if (file.endsWith('.map')) return;

      const paths = file.split(sep);
      paths[0] = SERVE_ORIGIN;

      const location = paths.join('/');
      const tag = location.endsWith('.css')
        ? `<link href="${location}" rel="stylesheet" type="text/css"/>`
        : `<script defer src="${location}"></script>`;

      return { 'File Location': location, 'Import Suggestion': tag };
    })
    .filter(Boolean);

  console.table(filesInfo);
}
