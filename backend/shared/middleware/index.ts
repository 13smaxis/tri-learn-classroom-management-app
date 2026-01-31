import { Request, Response, NextFunction } from 'express'

/**
 * Middleware for checking user authentication
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' })
  }

  try {
    // TODO: Verify JWT token with Cognito
    // For now, just add a placeholder user
    (req as any).user = {
      userId: 'user-id',
      role: 'teacher',
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Middleware for role-based access control
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error)
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
}

/**
 * CORS middleware configuration
 */
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
