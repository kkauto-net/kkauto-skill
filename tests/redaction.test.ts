import { describe, expect, it } from 'vitest';
import { redact } from '../src/core/redaction.js';

describe('redaction', () => {
  it('redacts KK_API_TOKEN', () => {
    expect(redact('KK_API_TOKEN=secret-value')).not.toContain('secret-value');
  });

  it('redacts bearer tokens', () => {
    expect(redact('Authorization: Bearer abc123')).not.toContain('abc123');
  });

  it('redacts quoted JSON token values', () => {
    expect(redact('{"KK_API_TOKEN":"secret-value"}')).not.toContain('secret-value');
  });
});
