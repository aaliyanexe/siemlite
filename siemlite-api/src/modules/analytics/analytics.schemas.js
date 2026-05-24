const { z } = require('zod');

const dateRangeSchema = z.object({
  query: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    days: z.string().optional(),
    period: z.enum(['daily', 'weekly', 'monthly']).optional(),
    groupBy: z.string().optional(),
  }),
});

module.exports = { dateRangeSchema };