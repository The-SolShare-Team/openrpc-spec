import { evaluate } from "@mdx-js/mdx";
import { parseProps } from "codehike/blocks";
import { recmaCodeHike, remarkCodeHike } from "codehike/mdx";
import * as fs from "fs/promises";
import React from "react";
import * as runtime from "react/jsx-runtime";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { reactToText } from "../reactUtils.js";
import { MethodSchema } from "../zodSchemas.js";

/**
 * Parse MDX file into an intermediary JSON object
 * @param {string} filePath
 * @returns Intermediary JSON object
 */
export async function parseMdxToJson(filePath) {
  const mdxContent = await fs.readFile(filePath);

  let data;
  const components = {
    APIMethod: (props) => {
      data = parseProps(props, MethodSchema);
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

  const content = reactToText(
    React.createElement(Content, {
      components: components,
    })
  );

  return {
    frontmatter,
    content,
    data,
  };
}
