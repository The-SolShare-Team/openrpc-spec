/**
 * Parse the type from the Solana RPC documentation to an OpenRPC type
 * Here is the Solana RPC documentation: https://solana.com/docs/rpc
 * @param {string} blockType - A type in string format
 * @returns An array containing an object with the type and the required boolean
 */
export function parseType(blockType) {
  const type = blockType.replace(/\s*\|\s*null/g, "");
  const nullable = type !== blockType;
  switch (type) {
    case "object":
    case "string":
    case "number":
    case "array":
      return { nullable, obj: { type: type } };
    case "bool":
      return { nullable, obj: { type: "boolean" } };
    default:
      return { nullable, obj: { $ref: `#/components/schemas/${type}` } };
  }
}
