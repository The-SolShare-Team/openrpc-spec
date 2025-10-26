/**
 * Parse the type from the Solana RPC documentation to an OpenRPC type
 * Here is the Solana RPC documentation: https://solana.com/docs/rpc
 * @param {string} typeStr - A type in string format
 * @returns An object with the type filled in
 */
export function parseType(typeStr) {
  const type = typeStr.replace(/\s*\|\s*null/g, "");
  switch (type) {
    case "bool":
      return { type: "boolean" };
    case "object":
    case "string":
    case "number":
      return { type: type };
    default:
      return { $ref: `#/components/schemas/${type}` };
  }
}
