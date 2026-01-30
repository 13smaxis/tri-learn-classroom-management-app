import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

const AssignmentsView: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    type: 'assignment1',
    dueDate: '',
    maxMarks: 100
  });

  const classes = [
    { id: '1', name: 'Grade 10A - Mathematics' },
    { id: '2', name: 'Grade 11B - Mathematics' }
  ];

  const assignments = [
    { id: '1', title: 'Chapter 5: Quadratic Equations', type: 'assignment1', dueDate: 'Feb 3, 2026', status: 'active', submissions: 15, total: 25 },
    { id: '2', title: 'Trigonometry Practice', type: 'homework', dueDate: 'Feb 1, 2026', status: 'closed', submissions: 23, total: 25 },
    { id: '3', title: 'Mid-Term Test', type: 'exam', dueDate: 'Feb 15, 2026', status: 'draft', submissions: 0, total: 25 },
    { id: '4', title: 'Problem Set 4', type: 'classwork', dueDate: 'Jan 30, 2026', status: 'closed', submissions: 25, total: 25 },
    { id: '5', title: 'Chapter 6: Functions', type: 'assignment2', dueDate: 'Feb 20, 2026', status: 'active', submissions: 8, total: 25 }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment1':
      case 'assignment2':
        return 'bg-purple-100 text-purple-700';
      case 'homework':
        return 'bg-blue-100 text-blue-700';
      case 'exam':
        return 'bg-red-100 text-red-700';
      case 'classwork':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCreate = () => {
    console.log('Creating assignment:', newAssignment);
    setShowCreateModal(false);
    setNewAssignment({
      title: '',
      description: '',
      type: 'assignment1',
      dueDate: '',
      maxMarks: 100
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500">Create and manage class assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Assignment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">All Types</option>
            <option value="assignment1">Assignment 1</option>
            <option value="assignment2">Assignment 2</option>
            <option value="homework">Homework</option>
            <option value="classwork">Classwork</option>
            <option value="exam">Exam</option>
          </select>
          <select className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(assignment.type)}`}>
                    {assignment.type.replace(/([0-9])/g, ' $1').trim()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {assignment.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {assignment.submissions}/{assignment.total} submitted
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">
                  View Submissions
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  Edit
                </button>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(assignment.submissions / assignment.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Assignment Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Assignment" size="lg">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
            <input
              type="text"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter assignment title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter assignment description and instructions"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newAssignment.type}
                onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="homework">Homework</option>
                <option value="classwork">Classwork (10%)</option>
                <option value="assignment1">Assignment 1 (25%)</option>
                <option value="assignment2">Assignment 2 (25%)</option>
                <option value="exam">Exam (40%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Marks</label>
            <input
              type="number"
              value={newAssignment.maxMarks}
              onChange={(e) => setNewAssignment({ ...newAssignment, maxMarks: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
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
              Create Assignment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentsView;
