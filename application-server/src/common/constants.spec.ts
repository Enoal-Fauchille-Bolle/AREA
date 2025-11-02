import { PARSE_INT_RADIX, parseIdParam } from './constants';

describe('constants', () => {
  describe('PARSE_INT_RADIX', () => {
    it('should be defined', () => {
      expect(PARSE_INT_RADIX).toBeDefined();
    });

    it('should equal 10 (decimal)', () => {
      expect(PARSE_INT_RADIX).toBe(10);
    });

    it('should be a number', () => {
      expect(typeof PARSE_INT_RADIX).toBe('number');
    });
  });

  describe('parseIdParam', () => {
    it('should parse a valid numeric string', () => {
      expect(parseIdParam('123')).toBe(123);
    });

    it('should parse zero', () => {
      expect(parseIdParam('0')).toBe(0);
    });

    it('should parse large numbers', () => {
      expect(parseIdParam('999999')).toBe(999999);
    });

    it('should parse single digit', () => {
      expect(parseIdParam('5')).toBe(5);
    });

    it('should parse with leading zeros', () => {
      expect(parseIdParam('0123')).toBe(123);
    });

    it('should handle negative numbers', () => {
      expect(parseIdParam('-42')).toBe(-42);
    });

    it('should handle string with spaces (returns NaN)', () => {
      const result = parseIdParam('  ');
      expect(isNaN(result)).toBe(true);
    });

    it('should handle non-numeric strings (returns NaN)', () => {
      const result = parseIdParam('abc');
      expect(isNaN(result)).toBe(true);
    });

    it('should stop parsing at first non-numeric character', () => {
      expect(parseIdParam('123abc')).toBe(123);
    });

    it('should parse decimal notation (stops at decimal point)', () => {
      expect(parseIdParam('123.456')).toBe(123);
    });

    it('should use radix 10', () => {
      // Verify it uses base 10 by parsing a string that would differ in other bases
      expect(parseIdParam('10')).toBe(10); // In octal (base 8), this would be 8
      expect(parseIdParam('FF')).toBeNaN(); // Would be 255 in hex (base 16)
    });

    it('should handle ID-like strings from route parameters', () => {
      expect(parseIdParam('1')).toBe(1);
      expect(parseIdParam('42')).toBe(42);
      expect(parseIdParam('100')).toBe(100);
    });

    it('should return same result as parseInt with radix 10', () => {
      const testValues = ['1', '10', '100', '999', '0', '42'];

      for (const value of testValues) {
        expect(parseIdParam(value)).toBe(parseInt(value, 10));
      }
    });

    it('should handle empty string (returns NaN)', () => {
      const result = parseIdParam('');
      expect(isNaN(result)).toBe(true);
    });

    it('should parse positive numbers without plus sign', () => {
      expect(parseIdParam('42')).toBe(42);
    });

    it('should parse numbers with plus sign', () => {
      expect(parseIdParam('+42')).toBe(42);
    });
  });
});
