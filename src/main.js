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

  let resultSchema;
  if ("blocks" in mdx.data.result[0].blocks) {
    resultSchema = parseObjectProperties(mdx.data.result[0].blocks, true);
  } else {
    // TODO
    // resultSchema = parseType(mdx.data.result[0].blocks)[1]
  }
  const result = {
    name: "result",
    description: reactToText(mdx.data.result[0].children) || undefined,
    schema: resultSchema,
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
