import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import { authMiddleware, corsOptions, errorHandler } from '../../../shared/middleware/index.js'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Using in-memory storage as fallback.'
  )
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const users = new Map() // Fallback in-memory storage if Supabase is not configured

// Middleware
app.use(express.json())
app.use(cors(corsOptions))

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: supabase ? 'supabase' : 'in-memory' })
})

// Auth Routes (no auth middleware)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    if (supabase) {
      // Use Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          firstName,
          lastName,
          role,
        },
      })

      if (authError) {
        return res.status(400).json({ error: authError.message || 'Registration failed' })
      }

      // Return user info
      const token = jwt.sign(
        { id: authUser.id, email: authUser.email, role },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(201).json({
        user: {
          id: authUser.id,
          email: authUser.email,
          firstName,
          lastName,
          role,
          createdAt: authUser.created_at,
        },
        token,
      })
    } else {
      // Fallback: In-memory storage
      if (users.has(email)) {
        return res.status(400).json({ error: 'User already exists' })
      }

      const user = {
        id: uuidv4(),
        email,
        firstName,
        lastName,
        role,
        createdAt: new Date().toISOString(),
      }

      users.set(email, { ...user, password })

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '7d',
      })

      return res.status(201).json({ user, token })
    }
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

    if (supabase) {
      // Use Supabase Auth with email (if phone needs to be used, consider storing it in user_metadata)
      // For now, treating phone as email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: phone,
        password,
      })

      if (error) {
        return res.status(401).json({ error: error.message || 'Invalid credentials' })
      }

      const token = jwt.sign(
        { id: data.user.id, email: data.user.email, role: data.user.user_metadata?.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
        },
        token,
      })
    } else {
      // Fallback: In-memory storage
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

      const token = jwt.sign(
        { id: userData.id, email: userData.email, role: userData.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      const { password: _, ...user } = userData
      return res.json({ user, token })
    }
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
    database: supabase ? 'Supabase' : 'In-Memory (Development)',
    services: ['auth-service', 'class-service', 'marks-service', 'messaging-service', 'notification-service'],
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
  console.log(`🗄️  Database: ${supabase ? 'Supabase' : 'In-Memory (Development)'}`)
})
