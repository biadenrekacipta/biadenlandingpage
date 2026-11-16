// Jalankan setelah `astro build`: pasang entry pembungkus header di dist/server/.
import { renameSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const server = join(here, '..', 'dist', 'server');
if (!existsSync(join(server, 'entry.mjs'))) throw new Error('dist/server/entry.mjs tidak ada: jalankan astro build dulu');
renameSync(join(server, 'entry.mjs'), join(server, 'astro-entry.mjs'));
copyFileSync(join(here, 'entry-wrapper.mjs'), join(server, 'entry.mjs'));
copyFileSync(join(here, 'security-headers.mjs'), join(server, 'security-headers.mjs'));
console.log('[wrap-entry] dist/server/entry.mjs membungkus astro-entry.mjs dengan header keamanan');
