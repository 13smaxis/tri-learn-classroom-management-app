import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const HomeworkView: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Track homework assigned count from database
  const [totalHomeworkCount, setTotalHomeworkCount] = useState(0);
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    dueDate: '',
    attachments: [] as File[],
    attachmentUrls: [] as string[],
  });

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files);
    setNewHomework((prev) => ({ ...prev, attachments: fileArr }));
    // Upload files immediately
    const uploadedUrls: string[] = [];
    const token = localStorage.getItem('authToken');
    for (const file of fileArr) {
      const formData = new FormData();
      formData.append('attachment', file);
      try {
        const res = await fetch('/api/homework/upload-attachment', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        // Optionally show error
      }
    }
    setNewHomework((prev) => ({ ...prev, attachmentUrls: uploadedUrls }));
  };

  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [homeworkError, setHomeworkError] = useState('');
  const [homeworkSuccess, setHomeworkSuccess] = useState('');
  const [viewRequested, setViewRequested] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.getMyClasses();
        setClasses(data || []);
      } catch (err) {
        setClasses([]);
      }
      setLoadingClasses(false);
    };
    fetchClasses();
    fetchHomeworkCount();
  }, []);

  // Fetch the total homework count for this teacher from the database
  const fetchHomeworkCount = async () => {
    try {
      const count = await api.getHomeworkCount();
      setTotalHomeworkCount(typeof count === 'number' ? count : 0);
    } catch {
      // Ignore errors for count
    }
  };

  // Homework list state (fetched from backend)
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loadingHomework, setLoadingHomework] = useState(false);

  const getClassId = (cls: any) => cls?.id || cls?.classId || '';

  const normalizeDueDate = (value: string) => {
    if (!value) return value;
    // HTML datetime-local is often yyyy-MM-ddTHH:mm; backend LocalDateTime expects seconds.
    return value.length === 16 ? `${value}:00` : value;
  };

  // Fetch homework for selected class
  const fetchHomework = async (classId: string) => {
    setHomeworkError('');
    setViewRequested(true);
    setLoadingHomework(true);
    try {
      const data = await api.getHomeworkList(classId);
      setHomeworkList(data || []);
    } catch (err) {
      setHomeworkList([]);
      setHomeworkError(err instanceof Error ? err.message : 'Failed to load homework');
    }
    setLoadingHomework(false);
  };

  // Delete homework handler
  const handleDeleteHomework = async (id: string) => {
    try {
      await api.deleteHomework(id);
      setHomeworkList(list => list.filter(hw => hw.id !== id));
      fetchHomeworkCount();
      setHomeworkSuccess('Homework deleted successfully.');
      setTimeout(() => setHomeworkSuccess(''), 3000);
    } catch (err) {
      setHomeworkError(err instanceof Error ? err.message : 'Failed to delete homework');
    }
  };

  const handleCreate = async () => {
    // Assign to the selected class if chosen, otherwise first class
    const fallbackClassId = classes.length > 0 ? getClassId(classes[0]) : '';
    const classId = selectedClass || fallbackClassId;
    if (!classId) {
      setHomeworkError('Please select a class first.');
      return;
    }
    if (!newHomework.title.trim()) {
      setHomeworkError('Homework title is required.');
      return;
    }
    if (!newHomework.dueDate) {
      setHomeworkError('Due date is required.');
      return;
    }
    setHomeworkError('');
    try {
      await api.createHomework({
        classId,
        title: newHomework.title,
        description: newHomework.description,
        dueDate: normalizeDueDate(newHomework.dueDate),
        attachmentUrls: newHomework.attachmentUrls,
      });
      // Refresh count from database
      fetchHomeworkCount();
      // Refresh homework list
      fetchHomework(classId);
      setHomeworkSuccess('Homework assigned successfully!');
      setTimeout(() => setHomeworkSuccess(''), 3000);
    } catch (err) {
      setHomeworkError(err instanceof Error ? err.message : 'Failed to create homework');
      return;
    }
    setShowCreateModal(false);
    setNewHomework({
      title: '',
      description: '',
      dueDate: '',
      attachments: [],
      attachmentUrls: [],
    });
  };

  return (
    <div className="w-full h-full min-h-screen">
      <div className="flex flex-row h-full min-h-screen">
        {/* Left: Class filter & assign button (30%) */}
        <div className="w-full md:w-[30%] p-6 bg-white border-r border-gray-200 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Homework</h1>
            {/* Class filter selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Filter</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={getClassId(cls)} value={getClassId(cls)}>{cls.name || cls.grade + ' - ' + cls.subject}</option>
                ))}
              </select>
            </div>
            {/* Assign Homework button below selector */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all mt-4"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Homework
            </button>
            {/* View Homework button */}
            <button
              onClick={() => {
                const fallbackClassId = classes.length > 0 ? getClassId(classes[0]) : '';
                const classId = selectedClass || fallbackClassId;
                if (!classId) {
                  setHomeworkError('No classes available yet.');
                  return;
                }
                fetchHomework(classId);
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-all mt-2"
              disabled={classes.length === 0 || loadingClasses}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-9 9-9 9s-9-4-9-9a9 9 0 1118 0z" />
              </svg>
              View Homework
            </button>
            {homeworkError && <p className="text-sm text-red-600 mt-2">{homeworkError}</p>}
            {homeworkSuccess && <p className="text-sm text-green-600 mt-2">{homeworkSuccess}</p>}
          </div>
        </div>

        {/* Right: Homework list (70%) or Assignment Form */}
        <div className="w-full md:w-[70%] p-6">
          {/* Stats Dashboard */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
              <div className="text-blue-600 text-2xl mb-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-lg font-bold">{classes.length}</div>
              <div className="text-sm text-gray-500">Total Classes</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
              <div className="text-red-600 text-2xl mb-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-lg font-bold">{totalHomeworkCount}</div>
              <div className="text-sm text-gray-500">Homework Assigned</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
              <div className="text-green-600 text-2xl mb-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <div className="text-lg font-bold">
                {/* Submission Rate: demo calculation */}
                {(() => {
                  const assigned = totalHomeworkCount;
                  // Demo: assume 80% submitted if assigned > 0
                  return assigned > 0 ? `${Math.round(assigned * 0.8)} / ${assigned} (${Math.round(0.8 * 100)}%)` : '-';
                })()}
              </div>
              <div className="text-sm text-gray-500">Submission Rate</div>
            </div>
          </div>

          {/* Homework List View */}
          {!showCreateModal && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-2">Homework for Selected Class</h2>
              {loadingHomework ? (
                <div>Loading...</div>
              ) : viewRequested && homeworkList.length === 0 ? (
                <div className="text-sm text-gray-500">No homework found for this class.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {homeworkList.map(hw => (
                    <li key={hw.id} className="py-4 bg-white rounded-lg border border-gray-100 px-4 mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{hw.title}</div>
                          {hw.description && (
                            <div className="text-sm text-gray-600 mt-1">{hw.description}</div>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due: {hw.dueDate}
                            </span>
                            <span className="text-xs text-gray-400">Created: {hw.createdAt}</span>
                          </div>
                          {hw.attachmentUrls && hw.attachmentUrls.length > 0 && (
                            <div className="text-xs mt-2 flex items-center gap-2">
                              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {hw.attachmentUrls.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">File {i+1}</a>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteHomework(hw.id)}
                          className="ml-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete homework"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showCreateModal ? (
            <>
              <h2 className="text-xl font-bold mb-6 text-gray-900">Assign Homework</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
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
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                    <svg className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, Images (Max 10MB)</p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,image/*"
                    />
                  </label>
                  {/* Show uploaded file names */}
                  {newHomework.attachments.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600">
                      {newHomework.attachments.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  )}
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
