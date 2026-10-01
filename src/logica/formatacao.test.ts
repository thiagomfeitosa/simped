import { describe, expect, it } from 'vitest';
import { fmt } from './formatacao';

describe('formatação brasileira', () => {
  it('usa vírgula decimal', () => {
    expect(fmt(11.7)).toBe('11,7');
    expect(fmt(5.5556)).toBe('5,56');
    expect(fmt(1000)).toBe('1.000');
  });
});
