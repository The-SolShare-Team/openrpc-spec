import { parseMdxToJson } from "./parser/parseMdxToJson.js";
import { parseObjectProperties } from "./parser/parseObjectProperties.js";
import { parseType } from "./parser/parseType.js";
import { reactToText } from "./reactUtils.js";

async function parseDoc(filePath) {
  const mdx = await parseMdxToJson(filePath);

  const params = [];
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
}

async function makeOpenRPC() {
  const getBlock = await parseDoc("getblock.mdx");

  const openRpc = {
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
    methods: [getBlock],
    components: {
      schemas: {
        u64: {
          type: "integer",
        },
        i64: {
          type: "integer",
        },
      },
    },
  };

  console.log(JSON.stringify(openRpc, null, 2));
}

await makeOpenRPC();
