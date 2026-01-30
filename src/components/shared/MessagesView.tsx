import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const conversations = [
    { 
      id: '1', 
      name: user?.role === 'teacher' ? 'Grade 10A Parents & Learners' : 'Mr. Smith - Mathematics',
      lastMessage: 'Reminder: Assignment due tomorrow',
      time: '2 hours ago',
      unread: 3,
      type: 'group'
    },
    { 
      id: '2', 
      name: user?.role === 'teacher' ? 'Sarah Smith (Parent)' : 'Mrs. Davis - English',
      lastMessage: 'Thank you for the update',
      time: '1 day ago',
      unread: 0,
      type: 'individual'
    },
    { 
      id: '3', 
      name: user?.role === 'teacher' ? 'Alex Johnson (Learner)' : 'Dr. Brown - Physical Sciences',
      lastMessage: 'I have a question about the homework',
      time: '2 days ago',
      unread: 1,
      type: 'individual'
    }
  ];

  const messages = [
    { id: '1', sender: 'Mr. Smith', content: 'Good morning everyone! Just a reminder that Assignment 2 is due tomorrow.', time: '10:30 AM', isOwn: user?.role === 'teacher' },
    { id: '2', sender: 'Parent - Mrs. Johnson', content: 'Thank you for the reminder. Alex is working on it.', time: '10:45 AM', isOwn: false },
    { id: '3', sender: 'Learner - Sarah', content: 'Sir, can we get an extension? I\'m struggling with question 5.', time: '11:00 AM', isOwn: false },
    { id: '4', sender: 'Mr. Smith', content: 'Sarah, I\'ll post a hint for question 5. The deadline remains the same but I\'m available for extra help after school.', time: '11:15 AM', isOwn: user?.role === 'teacher' },
    { id: '5', sender: 'Parent - Mr. Davis', content: 'Thank you for your support, Mr. Smith.', time: '11:30 AM', isOwn: false }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500">Communicate with {user?.role === 'teacher' ? 'parents and learners' : 'your teachers'}</p>
        </div>
        {user?.role === 'teacher' && (
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Message
          </button>
        )}
      </div>

      <div className="flex-1 flex bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedConversation === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    conv.type === 'group' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {conv.type === 'group' ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ) : conv.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{conv.name}</p>
                      {conv.unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">{conv.time}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {conversations.find(c => c.id === selectedConversation)?.name}
                  </p>
                  <p className="text-sm text-gray-500">25 members</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : ''}`}>
                      {!msg.isOwn && (
                        <p className="text-xs text-gray-500 mb-1">{msg.sender}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${
                        msg.isOwn 
                          ? 'bg-blue-600 text-white rounded-br-md' 
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${msg.isOwn ? 'text-right' : ''}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
