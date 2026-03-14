import { z } from 'zod';

export const warehouseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Warehouse name must be at least 2 characters'),
    code: z.string().length(2, 'Warehouse code must be exactly 2 characters'),
    location: z.string().min(2, 'Location is required'),
    description: z.string().optional(),
    rooms: z.array(z.string().min(1, 'Room name cannot be empty')).optional(),
  }),
});
