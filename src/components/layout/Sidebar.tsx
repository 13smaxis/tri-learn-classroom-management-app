import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenInvite: () => void;
  onGoHome?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  activeView,
  onViewChange,
  onOpenLogin,
  onOpenRegister,
  onOpenInvite,
  onGoHome,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  /* ─── Swipe-to-close on mobile ─── */
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -60) onClose();          // swiped left ≥ 60px → close
    touchStartX.current = null;
  }, [onClose]);

  const roleColors: Record<string, string> = {
    teacher: 'bg-blue-100 text-blue-700',
    parent: 'bg-green-100 text-green-700',
    learner: 'bg-purple-100 text-purple-700',
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 
                1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          />
        </svg>
      ),
      roles: ['teacher', 'parent', 'learner'],
    },
    {
      id: 'classes',
      label: 'My Classes',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 
                4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
          />
        </svg>
      ),
      roles: ['teacher', 'parent', 'learner'],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ['teacher'],
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['teacher', 'learner'],
    },
    {
      id: 'homework',
      label: 'Homework',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      roles: ['teacher', 'learner'],
    },
    {
      id: 'marks',
      label: 'Marks & Grades',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['teacher', 'parent', 'learner'],
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      roles: ['teacher', 'parent', 'learner'],
    },
    {
      id: 'progress',
      label: 'Child Progress',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      roles: ['parent'],
    },
  ];

  const filteredItems = user
    ? menuItems.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          <div 
            className="flex items-center gap-3 px-4 py-10 border-b border-gray-200 cursor-pointer"
            onClick={() => { onClose(); onGoHome?.(); }}
            role="button"
            tabIndex={0}
          >
            <div className="
                              w-10 h-10 
                              rounded-xl 
                              bg-gradient-to-br from-blue-600 to-indigo-600 
                              flex items-center 
                              justify-center 
                              flex-shrink-0
                            "
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 
                  7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 
                  1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">TriLearn</h1>
              <p className="text-[11px] text-gray-400 truncate">Class Management</p>
            </div>

            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ─── Navigation (authenticated) ─── */}
          
          {user && (
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onViewChange(item.id);
                          onClose();
                        }}
                        className={`
                          w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all
                          px-4 py-2.5
                          ${isActive
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                      >
                        <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* ─── Guest content (unauthenticated) ─── */}
          {!user && (
            <div className="flex-1 flex flex-col px-3 py-10">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider px-3 mb-4">
                Get Started
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => { onClose(); onOpenLogin(); }}
                  className="
                                w-full 
                                flex items-center 
                                gap-3 
                                rounded-xl 
                                text-sm font-medium 
                                transition-all 
                                text-gray-600 
                                hover:bg-gray-50 hover:text-gray-900
                                px-4 py-2.5
                              "
                >
                  <svg className="h-5 w-5 text-gray-400 flex-shrink-0" 
                       fill="none" 
                       viewBox="0 0 24 24" 
                       stroke="currentColor"
                  >
                    <path strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 
                          3 0 013-3h7a3 3 0 013 3v1" 
                    />
                  </svg>
                  Sign In
                </button>
                <button
                  onClick={() => { onClose(); onOpenRegister(); }}
                  className="
                    w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all
                    px-4 py-2.5
                    bg-blue-600 text-white hover:bg-blue-700
                  "
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up
                </button>
              </div>

              {/* ─── Separator + Join Class with Invite Code ─── */}
              <div className="mt-48 text-center">
                <div className="border-t border-gray-200 mx-1 mb-4"></div>
                <p className="text-[11px] text-gray-400 px-3 mb-1 uppercase font-semibold tracking-wider">
                  Parents & Learners
                </p>
                <p className="text-[11px] text-gray-400 px-3 mb-3">
                  Register using a class invite code
                </p>
                <button
                  onClick={() => { onClose(); onOpenInvite(); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                >

                  Join Class with Invite Code
                    <svg className="h-5 w-5 text-white flex-shrink-0 -scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round"
                          strokeLinejoin="round" 
                          strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 
                                             01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── User section (authenticated) ─── */}
          {user && (
            <div className="border-t border-gray-200">
              {/* Notifications row */}
              <div className="px-3 pt-3">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
                  <span className="relative flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </span>
                  Notifications
                </button>
              </div>

              {/* User profile / sign-out */}
              <div className="relative px-3 py-3">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="
                    w-full flex items-center gap-3 rounded-xl transition-all
                    px-3 py-2.5
                    hover:bg-gray-50
                  "
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                  <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Flyout user menu */}
                {showUserMenu && (
                  <div
                    className={`
                      absolute bottom-full mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2
                      left-3 right-3
                    `}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile hamburger button — shown when sidebar is closed on mobile */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="lg:hidden fixed top-3 right-3 z-40 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
};

export default Sidebar;
