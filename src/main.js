import { parseMdxToJson } from "./parser/parseMdxToJson.js";
import { parseObjectProperties } from "./parser/parseObjectProperties.js";
import { parseType } from "./parser/parseType.js";
import { reactToText } from "./reactUtils.js";

async function parseDoc(filePath) {
  const data = await parseMdxToJson(filePath);

  // Build params
  const params = [];
  for (const block of data.paramsData.blocks) {
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

  // Build result
  const result = {
    name: "result",
    schema: {
      $ref: "#/components/schemas/getBlockResult",
    },
  };
  const resultProperties = parseObjectProperties(data.resultData);

  return {
    method: {
      name: data.name,
      description: data.description,
      params,
      result,
    },
    resultSchema: resultProperties,
  };
}

async function makeOpenRPC() {
  const getBlock = await parseDoc("getblock.mdx");

  const openRpc = {
    methods: [getBlock.method],
    components: {
      schemas: {
        getBlockResult: getBlock.resultSchema,
      },
    },
  };

  console.log(JSON.stringify(openRpc, null, 2));
}

await makeOpenRPC();
