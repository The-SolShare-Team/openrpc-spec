import { evaluate } from "@mdx-js/mdx";
import * as fs from "fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { remarkCodeHike, recmaCodeHike } from "codehike/mdx";
import { parseProps, Block, CodeBlock } from "codehike/blocks";
import { z } from "zod";
import React from "react";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";

const BaseParamSchema = Block.extend({
  type: z.string(),
  required: z.optional(z.string()).transform((val) => val != null),
  values: z.optional(z.string()).transform((val) => val?.split(/\s+/)),
  default: z.string().optional(),
});
const ParamSchema = BaseParamSchema.extend({
  blocks: z.lazy(() => ParamSchema.array()).optional(),
});

const ResultSchema = ParamSchema.extend({
  response: CodeBlock.optional(),
});

function parseType(typeStr) {
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

const MethodSchema = Block.extend({
  request: CodeBlock.array(),
  params: Block.extend({
    blocks: z.array(ParamSchema).optional(),
  }),
  result: z.array(ResultSchema),
});

function reactToText(reactNode) {
  const out = unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify)
    .processSync(renderToStaticMarkup(reactNode));
  return out.toString().trim();
}

async function parseDoc(filePath) {
  const mdxContent = await fs.readFile(filePath);

  let params = [];
  let result = {};

  const components = {
    APIMethod: (props) => {
      const data = parseProps(props, MethodSchema);
      for (const block of data.params.blocks) {
        params.push({
          name: block.title,
          description: reactToText(block.children),
          schema: {
            ...parseType(block.type),
            ...parseObjectProperties(block.blocks),
          },
          required: block.required,
        });
      }
    },
  };

  const { default: Content, frontmatter } = await evaluate(mdxContent, {
    ...runtime,
    components,
    remarkPlugins: [
      remarkFrontmatter,
      [remarkMdxFrontmatter, { name: "frontmatter" }],
      remarkCodeHike,
    ],
    recmaPlugins: [recmaCodeHike],
  });

  const description = reactToText(
    React.createElement(Content, {
      components: components,
    })
  );

  return {
    name: frontmatter.title,
    description,
    params,
    result,
  };
}

function parseObjectProperties(blocks) {
  if (!blocks) return {};
  const properties = {};
  const required = [];

  blocks.forEach((block) => {
    const prop = { ...parseType(block.type) };

    if (block.blocks) {
      const nested = parseObjectProperties(block.blocks);
      prop.type = "object";
      prop.properties = nested.properties;
      if (nested.required.length > 0) {
        prop.required = nested.required;
      }
    }

    if (block.values) {
      prop.enum = block.values;
    }

    // Add default if present
    if (block.default !== undefined) {
      prop.default = block.default;
    }

    // Add description if present
    prop.description = reactToText(block.children);

    properties[block.title || block.key || "param"] = prop;

    if (block.required) required.push(block.title || block.key || "param");
  });

  return { properties, required };
}

console.log(JSON.stringify(await parseDoc("getblock.mdx"), null, 2));
