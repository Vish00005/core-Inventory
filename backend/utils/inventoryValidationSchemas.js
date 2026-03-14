import { z } from 'zod';

const itemSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  warehouse: z.string().min(1, 'Warehouse ID is required'),
  room: z.string().min(1, 'Room is required'),
  quantity: z.number().positive('Quantity must be positive'),
});

const adjustmentItemSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  warehouse: z.string().min(1, 'Warehouse ID is required'),
  room: z.string().min(1, 'Room is required'),
  newQuantity: z.number().min(0, 'Quantity cannot be negative'),
});

const transferItemSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
});

export const receiptSchema = z.object({
  body: z.object({
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED']).optional(),
  }),
});

export const deliverySchema = z.object({
  body: z.object({
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED']).optional(),
  }),
});

export const transferSchema = z.object({
  body: z.object({
    items: z.array(transferItemSchema).min(1, 'At least one item is required'),
    sourceWarehouse: z.string().min(1, 'Source Warehouse ID is required'),
    destinationWarehouse: z.string().min(1, 'Destination Warehouse ID is required'),
    sourceRoom: z.string().min(1, 'Source Room is required'),
    destinationRoom: z.string().min(1, 'Destination Room is required'),
    notes: z.string().optional(),
  }),
});

export const adjustmentSchema = z.object({
  body: z.object({
    items: z.array(adjustmentItemSchema).min(1, 'At least one item is required'),
    notes: z.string().optional(),
  }),
});
