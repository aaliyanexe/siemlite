const { z } = require('zod');

const listLogsSchema = z.object({
  query: z.object({
    page:        z.coerce.number().int().positive().optional(),
    limit:       z.coerce.number().int().positive().optional(),
    actor_id:    z.coerce.number().int().positive().optional(),
    action_type: z.string().optional(),
    incident_id: z.coerce.number().int().positive().optional(),   // new
    severity:    z.enum(['Critical', 'High', 'Medium', 'Low']).optional(), // new
    date_from:   z.string().optional(),
    date_to:     z.string().optional(),
  }),
});

module.exports = { listLogsSchema };
