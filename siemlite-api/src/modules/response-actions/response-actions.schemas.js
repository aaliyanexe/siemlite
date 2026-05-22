const { z } = require('zod');

const actionTypeEnum = z.enum([
  'Containment',
  'Eradication',
  'Recovery',
  'Investigation',
  'Escalation',
]);

const createResponseSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    action_type: actionTypeEnum,
    action_description: z.string().min(1).max(500),
  }),
});

const updateResponseSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
    rid: z.coerce.number().int().positive(),
  }),
  body: z.object({
    action_type: actionTypeEnum.optional(),
    action_description: z.string().min(1).max(500).optional(),
  }),
});

const responseIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
    rid: z.coerce.number().int().positive(),
  }),
});

module.exports = { createResponseSchema, updateResponseSchema, responseIdSchema, actionTypeEnum };
