/**
 * Auth Service - User Registration and Authentication
 * 
 * Endpoints:
 * POST /auth/register - Register new user
 * POST /auth/login - Login user
 * POST /auth/logout - Logout user
 * GET /auth/me - Get current user
 * POST /auth/refresh - Refresh token
 */

import { v4 as uuidv4 } from 'uuid'
import { User } from '../../../shared/models/index.js'

/**
 * Register a new user
 */
export class AuthService 
{
  async registerUser(userData: 
  {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'teacher' | 'parent' | 'learner'
  }): Promise<User> {
    // TODO: Integrate with AWS Cognito
    const user: User = {
      userId: uuidv4(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedClassIds: [],
    }

    console.log('User registered:', user)                                                                       //-Save to database
    return user
  }

  /**
   * Authenticate user
   */
  async loginUser(email: string, _password: string): Promise<{ user: User; token: string }> {
    // TODO: Integrate with AWS Cognito
    const user: User = {
      userId: uuidv4(),
      email,
      firstName: 'John',
      lastName: 'Doe',
      role: 'teacher',
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedClassIds: [],
    }

    const token = 'mock-jwt-token'
    return { user, token }
  }

  /**
   * Verify Json Web Token (JWT)  
   * Return the user ID if valid
   */
  verifyToken(_token: string): { valid: boolean; userId?: string } {
    // TODO: Verify JWT token
    return { valid: true, userId: 'user-id' }
  }

  /**
   * Get user by ID
   */
  async getUserById(_userId: string): Promise<User | null> {
    // TODO: Fetch from database
    return null
  }
}

export default new AuthService()
