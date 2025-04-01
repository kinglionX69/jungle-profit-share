
/**
 * Helper functions for Aptos interactions
 */

/**
 * Converts a string to a valid StructTag format for type safety
 * @param input A string in the format "0x1::module::struct"
 * @returns The same string but typed as `${string}::${string}::${string}`
 */
export function toStructTag(input: string): `${string}::${string}::${string}` {
  // Optional validation
  if (!/^0x[a-fA-F0-9]+::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+$/.test(input)) {
    throw new Error(`Invalid StructTag format: ${input}`);
  }
  return input as `${string}::${string}::${string}`;
}

/**
 * Formats an address to include 0x prefix if missing
 * @param address The address to format
 * @returns The formatted address
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return address.startsWith('0x') ? address : `0x${address}`;
}

/**
 * Truncates an address for display
 * @param address The address to truncate
 * @param start Number of characters to keep at the start
 * @param end Number of characters to keep at the end
 * @returns The truncated address
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
