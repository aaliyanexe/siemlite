const { z } = require('zod');

const assetTypeEnum = z.enum([
  'Server',
  'Endpoint',
  'Network',
  'Cloud',
  'Application',
  'Mobile',
]);
const criticalityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);

const createSchema = z.object({
  body: z.object({
    asset_name: z.string().min(1).max(60),
    asset_type: assetTypeEnum,
    ip_address: z.string().max(45).optional().nullable(),
    owner_department: z.string().max(60).optional().nullable(),
    owner_name: z.string().max(50).optional().nullable(),
    criticality: criticalityEnum,
    location: z.string().max(100).optional().nullable(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: createSchema.shape.body.partial(),
});

const idSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listSchema = z.object({
  query: z.object({
    asset_type: assetTypeEnum.optional(),
    department: z.string().optional(),
    criticality: criticalityEnum.optional(),
    active_only: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});

module.exports = { createSchema, updateSchema, idSchema, listSchema };
