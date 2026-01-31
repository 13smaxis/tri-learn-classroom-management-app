/**
 * Database Models and Schemas
 */

export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: 'teacher' | 'parent' | 'learner'
  createdAt: Date
  updatedAt: Date
  linkedClassIds?: string[]
  linkedLearnerId?: string // For parents
}

export interface Teacher extends User {
  role: 'teacher'
  subjects: Subject[]
  grades: Grade[]
  classes: Class[]
}

export interface Class {
  classId: string
  teacherId: string
  name: string
  grade: Grade
  subject: Subject
  createdAt: Date
  updatedAt: Date
  studentCount: number
  parentInviteToken: string
  learnerInviteToken: string
  tools: ClassTool[]
  passRate?: number
  classAverage?: number
}

export interface ClassTool {
  id: string
  name: 'attendance' | 'homework' | 'assignments' | 'marks' | 'monitor'
  enabled: boolean
}

export interface Subject {
  id: string
  name: string
  code: string
}

export enum Grade {
  GRADE_1 = 'Grade 1',
  GRADE_2 = 'Grade 2',
  GRADE_3 = 'Grade 3',
  GRADE_4 = 'Grade 4',
  GRADE_5 = 'Grade 5',
  GRADE_6 = 'Grade 6',
  GRADE_7 = 'Grade 7',
  GRADE_8 = 'Grade 8',
  GRADE_9 = 'Grade 9',
  GRADE_10 = 'Grade 10',
  GRADE_11 = 'Grade 11',
  GRADE_12 = 'Grade 12',
}

export interface Marks {
  markId: string
  classId: string
  learnerId: string
  classWorks: number[] // Multiple class work marks
  assignment1: number
  assignment2: number
  exam: number
  finalMark?: number // Calculated: (10% classworks + 25% assignment1 + 25% assignment2 + 40% exam)
  recordedAt: Date
}

export interface Attendance {
  attendanceId: string
  classId: string
  learnerId: string
  date: Date
  present: boolean
  recordedAt: Date
}

export interface Assignment {
  assignmentId: string
  classId: string
  title: string
  description: string
  dueDate: Date
  createdAt: Date
  attachments?: string[] // File URLs
  submissions: Submission[]
}

export interface Submission {
  submissionId: string
  assignmentId: string
  learnerId: string
  submittedAt: Date
  attachments?: string[] // File URLs
  marksObtained?: number
  feedback?: string
}

export interface Message {
  messageId: string
  senderId: string
  classId: string
  content: string
  attachments?: string[]
  createdAt: Date
  readBy: string[]
  recipients: string[] // Teacher, Parents, Learners in class
}

export interface Notification {
  notificationId: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: Date
  actionUrl?: string
}
