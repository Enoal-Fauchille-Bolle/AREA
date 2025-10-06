/**
 * Application-wide constants that are not configurable
 */

/**
 * Radix for parseInt operations
 */
export const PARSE_INT_RADIX = 10;

/**
 * Helper function to safely parse integers from string parameters
 * @param value The string value to parse
 * @returns The parsed integer
 */
export function parseIdParam(value: string): number {
  return parseInt(value, PARSE_INT_RADIX);
}
