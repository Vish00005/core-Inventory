import { ZodError } from 'zod';

export const validateRequest = (schema) => async (req, res, next) => {
  try {
    const parsedParams = await schema.parseAsync({
      body: req.body,
      query: req.query || {},
      params: req.params || {},
    });
    
    // In Express 5.x, req.query and req.params are getters and cannot be reassigned directly.
    // We only reassign req.body which is safe and mutable.
    req.body = parsedParams.body;
    
    // For query and params, if mutation is strictly required (e.g. type coercion by zod), 
    // it's better to Object.assign them instead of reassignment, or access validated data elsewhere.
    if (parsedParams.query) Object.assign(req.query, parsedParams.query);
    if (parsedParams.params) Object.assign(req.params, parsedParams.params);
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Safely parse Zod errors
      let errorMessage = 'Validation failed';
      try {
        errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      } catch (e) {
        // Fallback if structure is unexpected
        errorMessage = error.message;
      }
      res.status(400);
      return next(new Error(`Validation error: ${errorMessage}`));
    }
    next(error);
  }
};
