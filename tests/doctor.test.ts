import { describe, expect, it } from 'vitest';
import { registryPath } from '../src/core/registry.js';

describe('doctor helpers', () => {
  it('uses kkauto-skill registry path', () => {
    expect(registryPath('/tmp/home')).toBe('/tmp/home/.config/kkauto-skill/registry.json');
  });
});
