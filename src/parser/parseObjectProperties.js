import { reactToText } from "../reactUtils.js";
import { parseType } from "./parseType.js";

/**
 * Parse object properties
 * @param {object} blocks
 * @param {bool} requiredByDefault
 * @returns Object with the properties of the object, or an empty object if there are no properties
 */
export function parseObjectProperties(blocks, requiredByDefault) {
  if (!blocks) return {}; // If there's no more object properties, return an empty object (which will be destructured to nothing)

  const properties = {};
  const required = [];

  blocks.forEach((block) => {
    const property = parseType(block.type);

    // Recursive call if there are more sub-blocks
    if (block.blocks) {
      const nested = parseObjectProperties(block.blocks, requiredByDefault);
      property.obj.properties = nested.properties;
      property.obj.required = nested.required;
    }

    // Add enum (if present)
    if (block.values) {
      property.obj.enum = block.values;
    }

    // Add default (if present)
    if (block.default) {
      property.obj.default = block.default;
    }

    // Add description
    property.obj.description = reactToText(block.children);

    // Update properties object and required array
    properties[block.title] = property.obj;

    const isRequired = requiredByDefault ? property.nullable : block.required;
    if (isRequired) required.push(block.title);
  });

  return { properties, required };
}
