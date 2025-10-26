import fs from "fs";
import path from "path";
import { getGithubFolderContents } from "./github.js";
import { parseMdxToJson } from "./parser/parseMdxToJson.js";
import { parseObjectProperties } from "./parser/parseObjectProperties.js";
import { parseType } from "./parser/parseType.js";
import { reactToText } from "./reactUtils.js";

async function parseDoc(mdxContent) {
  const mdx = await parseMdxToJson(mdxContent);

  try {
    const params = [];
    if (mdx.data.params.blocks) {
      for (const block of mdx.data.params.blocks) {
        params.push({
          name: block.title,
          description: reactToText(block.children),
          schema: {
            ...parseType(block.type).obj,
            ...parseObjectProperties(block.blocks, false),
          },
          required: block.required,
        });
      }
    }

    const resultBlock = mdx.data.result[0];
    const result = {
      name: "result",
      description: reactToText(resultBlock.children) || undefined,
      schema: {
        ...parseType(resultBlock.type).obj,
        ...parseObjectProperties(resultBlock.blocks, true),
      },
    };

    return {
      name: mdx.frontmatter.title,
      description: mdx.content,
      params,
      result,
    };
  } catch (err) {
    console.error("An error occurred:", err);
    console.error(
      "\nHere is the MDX intermediairy JSON:",
      JSON.stringify(mdx, null, 2)
    );
    process.exit(1);
  }
}

async function makeOpenRPC() {
  const files = await getGithubFolderContents();

  const methods = [];
  for (const file of files) {
    if (
      file.type === "file" &&
      file.name.toLowerCase().endsWith(".mdx") &&
      file.name.toLowerCase() != "index.mdx"
    ) {
      console.log(`Processing ${file.name}...`);
      const fileRes = await fetch(file.download_url);
      const mdxContent = await fileRes.text();

      const method = await parseDoc(mdxContent);
      methods.push(method);
    }
  }

  const output = {
    openrpc: "1.0.0",
    info: {
      title: "Solana RPC",
      version: "0.0.0",
    },
    servers: [
      // Solana Clusters: https://solana.com/docs/references/clusters
      {
        name: "Mainnet",
        url: "https://api.mainnet-beta.solana.com",
      },
      {
        name: "Testnet",
        url: "https://api.testnet.solana.com",
      },
      {
        name: "Devnet",
        url: "https://api.devnet.solana.com",
      },
    ],
    methods: methods,
    components: {
      schemas: {
        // u
        u8: {
          type: "integer",
        },
        u16: {
          type: "integer",
        },
        u32: {
          type: "integer",
        },
        u64: {
          type: "integer",
        },
        //
        i64: {
          type: "integer",
        },
        usize: {
          type: "integer",
        },
        f64: {
          type: "float",
        },

        // #/components/schemas/(?!u64\b|f64\b|u8\b|i64\b|u32\b|u16\b|usize\b)\w+
      },
    },
  };

  // Save results to JSON file
  const outputPath = path.resolve("./openrpc.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Results saved to ${outputPath}`);
}

await makeOpenRPC().catch(console.error);
