const { z } = require('zod');
const { passwordSchema } = require('../auth/auth.schemas');

const roleEnum = z.enum(['Analyst', 'Admin']);

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    email: z.string().email().max(80),
    role: roleEnum,
    password: passwordSchema,
  }),
});

const updateUserSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    email: z.string().email().max(80).optional(),
    role: roleEnum.optional(),
  }),
});

const userIdSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    role: roleEnum.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

const resetPasswordSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    password: passwordSchema,
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  listUsersSchema,
  resetPasswordSchema,
};
