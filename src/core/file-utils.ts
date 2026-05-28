import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

export function expandHome(path: string, home = homedir()): string {
  if (path === '~') return home;
  if (path.startsWith('~/')) return join(home, path.slice(2));
  return path;
}

export function resolvePath(path: string, home = homedir()): string {
  return resolve(expandHome(path, home));
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(path: string): Promise<string | null> {
  if (!(await pathExists(path))) return null;
  return readFile(path, 'utf8');
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  const tempPath = join(dir, `.${basename(path)}.tmp-${process.pid}-${Date.now()}-${randomUUID()}`);
  try {
    await writeFile(tempPath, content, 'utf8');
    await rename(tempPath, path);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
