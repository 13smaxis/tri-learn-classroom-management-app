import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface ClassesViewProps {
  onCreateClass?: () => void;
  classesVersion?: number;
  onSelectClass?: (cls: any) => void;
}

const ClassesView: React.FC<ClassesViewProps> = ({ classesVersion, onSelectClass }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed selectedClass state, now handled by parent

  useEffect(() => {
    if (user) {
      setLoading(true); // Force spinner and re-fetch
      fetchClasses();
    }
  }, [user, classesVersion]);

  const fetchClasses = async () => {
    if (!user) return;
    try {
      const data = await api.getMyClasses();
      setClasses(data || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setClasses([]);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-500">Loading your classes...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Color palette for unique card colors
  const colorPalette = [
    'from-blue-500 to-indigo-500',
    'from-green-400 to-teal-500',
    'from-pink-500 to-rose-500',
    'from-yellow-400 to-orange-500',
    'from-purple-500 to-fuchsia-500',
    'from-cyan-500 to-sky-500',
    'from-red-500 to-pink-500',
    'from-emerald-500 to-lime-500',
    'from-violet-500 to-purple-500',
    'from-orange-500 to-amber-500',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-500">
            {user?.role === 'teacher' 
              ? 'Manage your classes and share invite codes' 
              : 'View your enrolled classes'}
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-500 mb-4">
            {user?.role === 'teacher' 
              ? 'Create your first class to get started' 
              : 'Join a class using an invite code from your teacher'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pb-2">
          {classes.map((cls, idx) => {
            const learnerCount = cls.enrollments?.filter((e: any) => e.role === 'learner').length || 0;
            const parentCount = cls.enrollments?.filter((e: any) => e.role === 'parent').length || 0;
            const color = colorPalette[idx % colorPalette.length];
            return (
              <div
                key={cls.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all w-full text-xs"
                style={{ fontSize: '0.92rem' }}
              >
                <div className={`h-1.5 bg-gradient-to-r ${color}`}></div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{cls.name}</h3>
                      <p className="text-xs text-gray-500">{cls.grade} • {cls.subject}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                      {cls.academicYear}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className={`text-xs ${user?.role === 'teacher' ? 'text-gray-500' : 'text-gray-600'}`}>
                      {user?.role === 'teacher' ? 'Teacher' : 'Teacher'}: {cls.teacherName}
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-medium">{learnerCount}</span>
                      </div>
                      <div className="h-4 border-l border-gray-300 hidden sm:block"></div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">{parentCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="font-medium">--</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-all"
                      onClick={() => onSelectClass && onSelectClass(cls)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassesView;
