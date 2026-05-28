import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('skills', 'dist/skills', { recursive: true });
await cp('templates', 'dist/templates', { recursive: true });
