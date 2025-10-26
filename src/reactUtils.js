import { renderToStaticMarkup } from "react-dom/server";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

/**
 * Convert React HTML to markdown string
 * @param {*} reactNode
 * @returns Markdown string
 */
export function reactToText(reactNode) {
  const out = unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify)
    .processSync(renderToStaticMarkup(reactNode));
  return out.toString().trim();
}
