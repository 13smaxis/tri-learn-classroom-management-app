import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

const HomeworkView: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    dueDate: '',
    attachments: [] as File[]
  });

  const classes = [
    { id: '1', name: 'Grade 10A - Mathematics' },
    { id: '2', name: 'Grade 11B - Mathematics' }
  ];

  const homeworkList = [
    { id: '1', title: 'Exercise 5.1 - Quadratic Equations', dueDate: 'Feb 2, 2026', status: 'active', completed: 18, total: 25 },
    { id: '2', title: 'Revision: Chapter 4', dueDate: 'Feb 1, 2026', status: 'closed', completed: 24, total: 25 },
    { id: '3', title: 'Practice Problems Set 3', dueDate: 'Jan 30, 2026', status: 'closed', completed: 25, total: 25 },
    { id: '4', title: 'Word Problems Worksheet', dueDate: 'Feb 5, 2026', status: 'active', completed: 5, total: 25 }
  ];

  const handleCreate = () => {
    console.log('Creating homework:', newHomework);
    setShowCreateModal(false);
    setNewHomework({
      title: '',
      description: '',
      dueDate: '',
      attachments: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
          <p className="text-gray-500">Assign and track homework completion</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Assign Homework
        </button>
      </div>

      {/* Class Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Homework List */}
      <div className="space-y-4">
        {homeworkList.map((hw) => (
          <div key={hw.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{hw.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    hw.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {hw.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {hw.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    {hw.completed}/{hw.total} completed
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">
                  View Details
                </button>
                {hw.status === 'active' && (
                  <button className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all">
                    Send Reminder
                  </button>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    hw.completed === hw.total ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(hw.completed / hw.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Homework Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Assign Homework" size="lg">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Homework Title</label>
            <input
              type="text"
              value={newHomework.title}
              onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g., Exercise 5.2 - Functions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
            <textarea
              value={newHomework.description}
              onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter homework instructions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="datetime-local"
              value={newHomework.dueDate}
              onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <svg className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, Images (Max 10MB)</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              Assign Homework
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomeworkView;
