import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  // Mock data
  const classes = [
    { id: '1', name: 'Grade 10A - Mathematics' },
    { id: '2', name: 'Grade 11B - Mathematics' },
    { id: '3', name: 'Grade 10A - Physical Sciences' }
  ];

  const learners = [
    { id: '1', name: 'Alex Johnson', number: '001' },
    { id: '2', name: 'Sarah Smith', number: '002' },
    { id: '3', name: 'Mike Brown', number: '003' },
    { id: '4', name: 'Emily Davis', number: '004' },
    { id: '5', name: 'James Wilson', number: '005' },
    { id: '6', name: 'Lisa Anderson', number: '006' },
    { id: '7', name: 'David Taylor', number: '007' },
    { id: '8', name: 'Emma Thomas', number: '008' },
    { id: '9', name: 'Chris Martin', number: '009' },
    { id: '10', name: 'Sophie White', number: '010' }
  ];

  const handleAttendanceChange = (learnerId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [learnerId]: status }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, string> = {};
    learners.forEach(l => allPresent[l.id] = 'present');
    setAttendance(allPresent);
  };

  const handleSave = () => {
    console.log('Saving attendance:', { selectedClass, selectedDate, attendance });
    alert('Attendance saved successfully!');
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Register</h1>
          <p className="text-gray-500">Mark daily attendance for your classes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-green-700">Present</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-red-700">Absent</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{lateCount}</p>
              <p className="text-sm text-orange-700">Late</p>
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Learners ({learners.length})</h3>
              <button
                onClick={markAllPresent}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
              >
                Mark All Present
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {learners.map((learner) => (
                <div key={learner.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      {learner.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{learner.name}</p>
                      <p className="text-sm text-gray-500">#{learner.number}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {['present', 'absent', 'late', 'excused'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleAttendanceChange(learner.id, status)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          attendance[learner.id] === status
                            ? status === 'present' ? 'bg-green-500 text-white' :
                              status === 'absent' ? 'bg-red-500 text-white' :
                              status === 'late' ? 'bg-orange-500 text-white' :
                              'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
            >
              Save Attendance
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceView;
