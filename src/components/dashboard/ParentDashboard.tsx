import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StatsCard from '@/components/ui/StatsCard';

interface ParentDashboardProps {
  onViewChange: (view: string) => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('edu-auth', {
        body: { action: 'getUserClasses', userId: user.id, role: 'parent' }
      });

      if (data?.enrollments) {
        setEnrollments(data.enrollments);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user, fetchEnrollments]);

  // Mock data for demonstration
  const childProgress = {
    name: 'Alex Johnson',
    grade: 'Grade 10',
    overallAverage: 72,
    attendance: 94,
    subjects: [
      { name: 'Mathematics', mark: 68, trend: 'up' },
      { name: 'English', mark: 75, trend: 'stable' },
      { name: 'Physical Sciences', mark: 62, trend: 'down' },
      { name: 'Life Sciences', mark: 78, trend: 'up' },
      { name: 'Geography', mark: 82, trend: 'up' }
    ]
  };

  const upcomingAssignments = [
    { subject: 'Mathematics', title: 'Chapter 5 Assignment', due: 'Feb 3, 2026', status: 'pending' },
    { subject: 'English', title: 'Essay: Climate Change', due: 'Feb 5, 2026', status: 'submitted' },
    { subject: 'Physical Sciences', title: 'Lab Report', due: 'Feb 7, 2026', status: 'pending' }
  ];

  const recentMessages = [
    { from: 'Mr. Smith', subject: 'Mathematics', preview: 'Regarding Alex\'s recent test...', time: '2 hours ago' },
    { from: 'Mrs. Davis', subject: 'English', preview: 'Great improvement in writing!', time: '1 day ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-700 to-blue-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-slate-100 mt-2">Stay connected with your child's education journey</p>
          </div>
          <button
            onClick={() => onViewChange('messages')}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message Teachers
          </button>
        </div>
      </div>

      {/* Child Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {childProgress.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{childProgress.name}</h2>
            <p className="text-gray-500">{childProgress.grade}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Overall Average"
            value={`${childProgress.overallAverage}%`}
            color="blue"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatsCard
            title="Attendance Rate"
            value={`${childProgress.attendance}%`}
            color="green"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <StatsCard
            title="Classes Enrolled"
            value={enrollments.length || 5}
            color="purple"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Subject Performance</h3>
          <button
            onClick={() => onViewChange('progress')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details
          </button>
        </div>
        <div className="space-y-4">
          {childProgress.subjects.map((subject, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      subject.mark >= 70 ? 'text-green-600' : 
                      subject.mark >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {subject.mark}%
                    </span>
                    {subject.trend === 'up' && (
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                    {subject.trend === 'down' && (
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      subject.mark >= 70 ? 'bg-green-500' : 
                      subject.mark >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${subject.mark}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Upcoming Assignments</h3>
            <span className="text-xs text-gray-500">{upcomingAssignments.length} pending</span>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-xs text-gray-500">{assignment.subject} • Due: {assignment.due}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  assignment.status === 'submitted' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {assignment.status === 'submitted' ? 'Submitted' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Messages</h3>
            <button
              onClick={() => onViewChange('messages')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentMessages.map((message, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onViewChange('messages')}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{message.from}</p>
                  <span className="text-xs text-gray-500">{message.time}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{message.subject}</p>
                <p className="text-sm text-gray-600 truncate">{message.preview}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Calendar Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Attendance This Month</h3>
          <span className="text-sm text-green-600 font-medium">94% Present</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => {
            const status = i < 22 ? (Math.random() > 0.1 ? 'present' : 'absent') : 'future';
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                  status === 'present' ? 'bg-green-100 text-green-700' :
                  status === 'absent' ? 'bg-red-100 text-red-700' :
                  'bg-gray-50 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
