// server/api-route-utils.ts
import type { Request, Response } from "express"
import { z } from "zod"
import { fromZodError } from "zod-validation-error"

/**
 * 🔧 UTILITY: API Route Handler Configuration
 * 
 * This utility eliminates the repetitive API route boilerplate found across
 * routes.ts, standalone.ts, and standalone-complete.ts, providing a unified
 * approach for API route creation with consistent error handling.
 */

export interface RouteHandlerConfig<TSchema extends z.ZodSchema = z.ZodSchema> {
  schema?: TSchema
  successMessage?: string
  errorMessage?: string
  validateId?: boolean
}

/**
 * 🎯 OPTIMIZED: Creates a standardized API route handler
 * 
 * Eliminates duplicate error handling, validation, and response patterns
 * found across 20+ route handlers in the codebase.
 */
export function createRouteHandler<TData = any, TSchema extends z.ZodSchema = z.ZodSchema>(
  handler: (
    req: Request, 
    res: Response, 
    validatedData?: z.infer<TSchema>,
    id?: number
  ) => Promise<TData>,
  config: RouteHandlerConfig<TSchema> = {}
) {
  return async (req: Request, res: Response) => {
    try {
      // 🔧 Unified ID validation
      let id: number | undefined
      if (config.validateId) {
        id = parseInt(req.params.id)
        if (isNaN(id)) {
          return res.status(400).json({ message: "ID attività non valido" })
        }
      }

      // 🔧 Unified schema validation
      let validatedData: z.infer<TSchema> | undefined
      if (config.schema) {
        const result = config.schema.safeParse(req.body)
        if (!result.success) {
          const validationError = fromZodError(result.error)
          return res.status(400).json({ 
            message: config.errorMessage || "Dati non validi",
            errors: validationError.message 
          })
        }
        validatedData = result.data
      }

      // 🔧 Execute handler with unified error handling
      const data = await handler(req, res, validatedData, id)
      
      // 🔧 Handle different response types
      if (data === null || data === false) {
        return res.status(404).json({ message: "Risorsa non trovata" })
      }
      
      if (typeof data === 'boolean' && data === true) {
        return res.json({ message: config.successMessage || "Operazione completata" })
      }
      
      // 🔧 Return data or success message
      if (config.successMessage && typeof data === 'object') {
        return res.status(201).json(data)
      }
      
      return res.json(data)
      
    } catch (error) {
      console.error('API Error:', error)
      return res.status(500).json({ 
        message: config.errorMessage || "Errore interno del server" 
      })
    }
  }
}

/**
 * 🔧 UTILITY: Pre-configured route handlers for common patterns
 */
export const routePatterns = {
  // GET /api/resource
  getAll: <T>(handler: () => Promise<T[]>, errorMessage = "Errore nel recupero delle risorse") =>
    createRouteHandler(async () => handler(), { errorMessage }),

  // GET /api/resource/:id  
  getById: <T>(handler: (id: number) => Promise<T | null>, errorMessage = "Errore nel recupero della risorsa") =>
    createRouteHandler(async (req, res, data, id) => handler(id!), { 
      validateId: true, 
      errorMessage 
    }),

  // POST /api/resource
  create: <T, TSchema extends z.ZodSchema>(
    schema: TSchema,
    handler: (data: z.infer<TSchema>) => Promise<T>,
    errorMessage = "Errore nella creazione della risorsa"
  ) =>
    createRouteHandler(async (req, res, validatedData) => handler(validatedData!), { 
      schema, 
      errorMessage 
    }),

  // PATCH /api/resource/:id
  update: <T, TSchema extends z.ZodSchema>(
    schema: TSchema,
    handler: (id: number, data: z.infer<TSchema>) => Promise<T | null>,
    errorMessage = "Errore nell'aggiornamento della risorsa"
  ) =>
    createRouteHandler(async (req, res, validatedData, id) => handler(id!, validatedData!), { 
      schema, 
      validateId: true, 
      errorMessage 
    }),

  // DELETE /api/resource/:id
  delete: <T>(
    handler: (id: number) => Promise<boolean>,
    successMessage = "Risorsa eliminata con successo",
    errorMessage = "Errore nell'eliminazione della risorsa"
  ) =>
    createRouteHandler(async (req, res, data, id) => handler(id!), { 
      validateId: true, 
      successMessage, 
      errorMessage 
    })
}

/**
 * 🔧 UTILITY: Query parameter helpers
 */
export function extractQueryFilters(req: Request) {
  const { category, status, search } = req.query
  
  return {
    category: typeof category === 'string' ? category : undefined,
    status: typeof status === 'string' ? status : undefined,
    search: typeof search === 'string' ? search : undefined
  }
}
