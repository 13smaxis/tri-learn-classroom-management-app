import { v4 as uuidv4 } from 'uuid'

/**
 * Utility functions for common operations
 */

export function generateId(prefix: string = ''): string {
  const id = uuidv4()
  return prefix ? `${prefix}_${id}` : id
}

export function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function calculateFinalMark(
  classWorks: number[],
  assignment1: number,
  assignment2: number,
  exam: number
): number {
  const avgClassWorks = classWorks.length > 0 ? classWorks.reduce((a, b) => a + b, 0) / classWorks.length : 0
  
  return (
    avgClassWorks * 0.1 +
    assignment1 * 0.25 +
    assignment2 * 0.25 +
    exam * 0.4
  )
}

export function calculatePassRate(marks: number[], passMark: number = 50): number {
  if (marks.length === 0) return 0
  const passCount = marks.filter((m) => m >= passMark).length
  return (passCount / marks.length) * 100
}

export function calculateClassAverage(marks: number[]): number {
  if (marks.length === 0) return 0
  return marks.reduce((a, b) => a + b, 0) / marks.length
}

export function getCurrentDate(): Date {
  return new Date()
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
