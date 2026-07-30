import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class TeacherService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get all classes for teacher
   */
  async getClasses() {
    try {
      const response = await this.api.get('/teacher/classes');
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching classes', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Get single class
   */
  async getClass(classId: string) {
    try {
      const response = await this.api.get(`/teacher/classes/${classId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching class', error);
      throw error;
    }
  }

  /**
   * Create new class
   */
  async createClass(data: {
    name: string;
    grade?: string;
    description?: string;
    room_number?: string;
  }) {
    try {
      const response = await this.api.post('/teacher/classes', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating class', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Update class
   */
  async updateClass(classId: string, data: any) {
    try {
      const response = await this.api.put(`/teacher/classes/${classId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating class', error);
      throw error;
    }
  }

  /**
   * Record marks
   */
  async recordMarks(data: {
    learner_id: string;
    class_id: string;
    subject?: string;
    mark: number;
    total_mark: number;
    feedback?: string;
  }) {
    try {
      const response = await this.api.post('/teacher/marks', data);
      return response.data;
    } catch (error: any) {
      console.error('Error recording marks', error);
      throw error;
    }
  }

  /**
   * Record attendance
   */
  async recordAttendance(data: {
    learner_id: string;
    class_id: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }) {
    try {
      const response = await this.api.post('/teacher/attendance', data);
      return response.data;
    } catch (error: any) {
      console.error('Error recording attendance', error);
      throw error;
    }
  }

  /**
   * Get class members (learners)
   */
  async getClassMembers(classId: string) {
    try {
      const response = await this.api.get(`/teacher/classes/${classId}`);
      return response.data.members || [];
    } catch (error: any) {
      console.error('Error fetching class members', error);
      throw error;
    }
  }

  /**
   * Get marks for class
   */
  async getClassMarks(classId: string) {
    try {
      const response = await this.api.get(`/teacher/classes/${classId}/marks`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching marks', error);
      throw error;
    }
  }
}

export const teacherService = new TeacherService();