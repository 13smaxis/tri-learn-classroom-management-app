import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, corsOptions, errorHandler } from '../../../shared/middleware/index.js'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

// In-memory user storage (replace with DynamoDB in production)
const users = new Map()

// Middleware
app.use(express.json())
app.use(cors(corsOptions))

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth Routes (no auth middleware)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password.length < 6) 
    {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Create user
    const user = {
      id: uuidv4(),
      email,
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
    }

    // Store user with password (in production, hash the password!)
    users.set(email, { ...user, password })

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    })

    // Return user without password
    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' })
    }

    // Find user by phone
    let userData: any = null
    for (const [, u] of users) {
      if (u.phone === phone) {
        userData = u
        break
      }
    }
    if (!userData || userData.password !== password) {
      return res.status(401).json({ error: 'Invalid phone number or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return user without password
    const { password: _, ...user } = userData
    res.json({ user, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Protected API Routes (with auth middleware)
app.use('/api', authMiddleware)

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'School Management App Backend',
    version: '1.0.0',
    services: [
      'auth-service',
      'class-service',
      'marks-service',
      'messaging-service',
      'notification-service',
    ],
  })
})

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error Handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})
