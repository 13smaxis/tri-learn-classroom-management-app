import React, { useState } from 'react';

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
    <div className="w-full h-full min-h-screen">
      <div className="flex flex-row h-full min-h-screen">
        {/* Left: Class filter & assign button (30%) */}
        <div className="w-full md:w-[30%] p-6 bg-white border-r border-gray-200 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Homework</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Assign Homework
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Filter</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Homework list (70%) or Assignment Form */}
        <div className="w-full md:w-[70%] p-6">
          {showCreateModal ? (
            <>
              <h2 className="text-xl font-bold mb-6 text-gray-900">Assign Homework</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="md:col-span-2">
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
                <div className="md:col-span-2 flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Assign Homework
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>


    </div>
  );
};

export default HomeworkView;
