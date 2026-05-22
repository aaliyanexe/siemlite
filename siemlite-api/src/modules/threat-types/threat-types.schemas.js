const { z } = require('zod');

const categoryEnum = z.enum([
  'Network',
  'Endpoint',
  'Application',
  'Social Engineering',
  'Insider',
]);
const severityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(300).optional(),
    category: categoryEnum,
    severity_default: severityEnum,
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(300).optional(),
    category: categoryEnum.optional(),
    severity_default: severityEnum.optional(),
  }),
});

const idSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listSchema = z.object({
  query: z.object({
    active_only: z.enum(['true', 'false']).optional(),
  }),
});

module.exports = { createSchema, updateSchema, idSchema, listSchema };
