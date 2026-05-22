const { z } = require('zod');

const severityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);
const statusEnum = z.enum(['Open', 'Investigating', 'Resolved', 'Reopened']);

const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    severity: severityEnum,
    threat_type_id: z.number().int().positive(),
    asset_id: z.number().int().positive(),
  }),
});

const updateIncidentSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    description: z.string().max(1000).optional(),
    severity: severityEnum.optional(),
    threat_type_id: z.number().int().positive().optional(),
    asset_id: z.number().int().positive().optional(),
    assigned_analyst_id: z.number().int().positive().nullable().optional(),
  }),
});

const incidentIdSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listIncidentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: statusEnum.optional(),
    severity: severityEnum.optional(),
    threat_type_id: z.coerce.number().int().positive().optional(),
    asset_id: z.coerce.number().int().positive().optional(),
    assigned_analyst_id: z.coerce.number().int().positive().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    sla_breached: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    sort: z.enum(['date_reported', 'severity', 'status', 'sla_deadline']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

const assignSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    assigned_analyst_id: z.number().int().positive().optional(),
  }),
});

const statusSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    status: statusEnum,
  }),
});

const resolveSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    resolution_summary: z.string().min(1).max(500),
  }),
});

module.exports = {
  createIncidentSchema,
  updateIncidentSchema,
  incidentIdSchema,
  listIncidentsSchema,
  assignSchema,
  statusSchema,
  resolveSchema,
};
