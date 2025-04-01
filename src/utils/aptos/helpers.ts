
/**
 * Helper functions for Aptos-related operations
 */

/**
 * Converts a string to the Aptos StructTag format required by the SDK
 * @param input A string in the format "0x{address}::{module}::{name}"
 * @returns The same string typed as a template literal
 * @throws Error if the input doesn't match the expected format
 */
export function toStructTag(input: string): `${string}::${string}::${string}` {
  // Validate that the input matches the expected format for a Move struct tag
  if (!/^0x[a-fA-F0-9]+::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+$/.test(input)) {
    throw new Error(`Invalid StructTag format: ${input}`);
  }
  
  // TypeScript casting to the required template literal type
  return input as `${string}::${string}::${string}`;
}
