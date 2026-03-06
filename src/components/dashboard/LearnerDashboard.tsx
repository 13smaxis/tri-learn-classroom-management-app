import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StatsCard from '@/components/ui/StatsCard';

interface LearnerDashboardProps {
  onViewChange: (view: string) => void;
}

const LearnerDashboard: React.FC<LearnerDashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('edu-auth', {
        body: { action: 'getUserClasses', userId: user.id, role: 'learner' }
      });

      if (data?.enrollments) {
        setEnrollments(data.enrollments);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
    setLoading(false);
  };

  // Mock data for demonstration
  const stats = {
    overallAverage: 74,
    assignmentsDue: 3,
    homeworkPending: 2,
    classesEnrolled: 6
  };

  const todaySchedule = [
    { time: '08:00', subject: 'Mathematics', room: 'Room 12', teacher: 'Mr. Smith' },
    { time: '09:00', subject: 'English', room: 'Room 8', teacher: 'Mrs. Davis' },
    { time: '10:00', subject: 'Break', room: '', teacher: '' },
    { time: '10:30', subject: 'Physical Sciences', room: 'Lab 2', teacher: 'Dr. Brown' },
    { time: '11:30', subject: 'Life Sciences', room: 'Room 15', teacher: 'Ms. Wilson' },
    { time: '12:30', subject: 'Lunch', room: '', teacher: '' },
    { time: '13:30', subject: 'Geography', room: 'Room 10', teacher: 'Mr. Taylor' }
  ];

  const pendingAssignments = [
    { subject: 'Mathematics', title: 'Chapter 5: Quadratic Equations', due: 'Feb 3', weight: '25%', status: 'not_started' },
    { subject: 'English', title: 'Essay: Climate Change Impact', due: 'Feb 5', weight: '25%', status: 'in_progress' },
    { subject: 'Physical Sciences', title: 'Lab Report: Chemical Reactions', due: 'Feb 7', weight: '25%', status: 'not_started' }
  ];

  const recentGrades = [
    { subject: 'Mathematics', assessment: 'Class Test 3', mark: 72, maxMark: 100, date: 'Jan 25' },
    { subject: 'English', assessment: 'Oral Presentation', mark: 85, maxMark: 100, date: 'Jan 23' },
    { subject: 'Life Sciences', assessment: 'Quiz 4', mark: 18, maxMark: 20, date: 'Jan 22' },
    { subject: 'Geography', assessment: 'Map Work', mark: 45, maxMark: 50, date: 'Jan 20' }
  ];

  const achievements = [
    { title: 'Perfect Attendance', description: 'No absences this month', icon: '🏆' },
    { title: 'Top Performer', description: 'English - Highest in class', icon: '⭐' },
    { title: 'Homework Streak', description: '10 consecutive submissions', icon: '🔥' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-700 to-blue-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Hey, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-slate-100 mt-2">Ready to learn something new today?</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onViewChange('assignments')}
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Assignments
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overall Average"
          value={`${stats.overallAverage}%`}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatsCard
          title="Assignments Due"
          value={stats.assignmentsDue}
          subtitle="This week"
          color="orange"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Homework Pending"
          value={stats.homeworkPending}
          color="red"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatsCard
          title="Classes Enrolled"
          value={stats.classesEnrolled}
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Schedule</h3>
          <div className="space-y-2">
            {todaySchedule.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  item.subject === 'Break' || item.subject === 'Lunch' 
                    ? 'bg-gray-50' 
                    : 'bg-slate-50'
                }`}
              >
                <span className="text-sm font-mono text-gray-500 w-12">{item.time}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    item.subject === 'Break' || item.subject === 'Lunch' 
                      ? 'text-gray-500' 
                      : 'text-gray-900'
                  }`}>
                    {item.subject}
                  </p>
                  {item.room && (
                    <p className="text-xs text-gray-500">{item.room} • {item.teacher}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending Assignments</h3>
            <button
              onClick={() => onViewChange('assignments')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingAssignments.map((assignment, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    assignment.status === 'in_progress' ? 'bg-orange-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{assignment.title}</p>
                    <p className="text-sm text-gray-500">{assignment.subject} • Weight: {assignment.weight}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Due: {assignment.due}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    assignment.status === 'in_progress' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {assignment.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Grades</h3>
            <button
              onClick={() => onViewChange('marks')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentGrades.map((grade, idx) => {
              const percentage = Math.round((grade.mark / grade.maxMark) * 100);
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{grade.assessment}</p>
                    <p className="text-xs text-gray-500">{grade.subject} • {grade.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      percentage >= 70 ? 'text-green-600' : 
                      percentage >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {grade.mark}/{grade.maxMark}
                    </p>
                    <p className="text-xs text-gray-500">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">My Achievements</h3>
          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-3xl">{achievement.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Submit Homework', icon: '📤', view: 'homework' },
            { label: 'View Timetable', icon: '📅', view: 'timetable' },
            { label: 'Message Teacher', icon: '💬', view: 'messages' },
            { label: 'Study Resources', icon: '📖', view: 'resources' }
          ].map((link, idx) => (
            <button
              key={idx}
              onClick={() => onViewChange(link.view)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;
