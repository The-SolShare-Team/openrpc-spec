import { Block, CodeBlock } from "codehike/blocks";
import { z } from "zod";

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

export const MethodSchema = Block.extend({
  request: CodeBlock.array(),
  params: Block.extend({
    blocks: z.array(ParamSchema).optional(),
  }),
  result: z.array(ResultSchema),
});
