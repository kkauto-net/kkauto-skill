import { describe, expect, it } from 'vitest';
import { readRegistry } from '../src/core/registry.js';

describe('update registry', () => {
  it('returns empty registry when missing', async () => {
    const registry = await readRegistry('/tmp/kkauto-skill-missing-home');
    expect(registry.installs).toEqual([]);
  });
});
