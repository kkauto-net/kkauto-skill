import { copyFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathExists } from './file-utils.js';

function stamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').replace('.', '-').replace('Z', `-${randomUUID().slice(0, 8)}Z`);
}

export async function backupIfExists(path: string): Promise<string | null> {
  if (!(await pathExists(path))) return null;
  const backupPath = `${path}.bak-${stamp()}`;
  await copyFile(path, backupPath);
  return backupPath;
}
