import React from 'react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenInvite: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenRegister, onOpenInvite }) => {
  const features = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'Class Register',
      description: 'Track daily attendance with ease. Mark present, absent, or late with one click.',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Assignment Manager',
      description: 'Create, distribute, and grade assignments. Track submissions in real-time.',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Mark Capture',
      description: 'Record marks with automatic weighted calculations. 10% classwork, 25% assignments, 40% exam.',
      bgColor: 'bg-pink-50',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Unified Messaging',
      description: 'Send messages to parents and learners simultaneously. Keep everyone informed.',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: 'Progress Tracking',
      description: 'Monitor class pass rates and identify at-risk learners early.',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Works Everywhere',
      description: 'Responsive design for laptops, tablets, and phones. Install as a PWA for offline access.',
      bgColor: 'bg-cyan-50',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    }
  ];

  const roles = [
    {
      title: 'Teachers',
      description: 'Create classes, manage attendance, assignments, and communicate with parents and learners.',
      color: 'blue',
      features: ['Create unlimited classes', 'Track attendance', 'Grade assignments', 'Message parents & learners']
    },
    {
      title: 'Parents',
      description: 'Stay connected with your child\'s education journey and communicate with teachers.',
      color: 'green',
      features: ['View child progress', 'Track attendance', 'See upcoming assignments', 'Message teachers']
    },
    {
      title: 'Learners',
      description: 'Access assignments, view grades, and stay on top of your studies.',
      color: 'purple',
      features: ['View assignments', 'Submit homework', 'Track grades', 'Message teachers']
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="
                          relative overflow-hidden 
                          bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 
                          text-white
                          min-h-[70vh]
                          "
      >                                                                                                         {/* Hero Section */}
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Education Management Made Simple
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Connect teachers, parents, and learners on one powerful platform. 
              Track attendance, manage assignments, capture marks, and communicate seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={onOpenRegister}
                className="
                            px-8 py-4 
                            bg-white 
                            text-blue-600 font-semibold 
                            rounded-xl hover:bg-blue-50 
                            transition-all 
                            shadow-lg
                          "
              >
                SignUp
              </button>
              <button
                onClick={onOpenInvite}
                  className=" px-8 py-4 
                            bg-blue-500/30 
                            text-white font-semibold 
                            rounded-xl 
                            hover:bg-blue-500/40 
                            transition-all 
                            border border-white/30
                          "
              >
                Join with Invite Code
              </button>
            </div>
          </div>
        </div>
        <div className="
                        absolute 
                        bottom-0 left-0 right-0 
                        h-20 
                        bg-gradient-to-t from-white to-transparent
                      "
        >
        </div>
      </section>

      <section className="py-20 bg-white">                                                                    {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="
                            text-3xl text-center sm:text-4xl lg:text-5xl font-extrabold 
                            mt-12 
                            tracking-tight leading-tight 
                            animate-in fade-in slide-in-from-bottom-4 
                            duration-700
                            mb-4
                          "
            style={{
                    fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    letterSpacing: '-0.02em'
                  }}
          >
            Keep your classroom organised and efficient
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chose from a viarity of features designed to streamline your teaching experience
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className={`
                                          p-6 rounded-2xl 
                                          border border-gray-200 
                                          hover:border-blue-200 hover:shadow-lg 
                                          transition-all 
                                          ${feature.bgColor}
                                        `}
              >                                                                                               {/* Feature Card   */}
                <div className={`
                                  w-14 h-14 
                                  rounded-xl 
                                  ${feature.iconBg} 
                                  ${feature.iconColor} 
                                  flex items-center 
                                  justify-center 
                                  mb-4
                                `}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">                                                                  {/* Roles Section */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              One App, Three Roles
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Same platform, different experiences tailored to each user
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role, idx) => (
              <div key={idx} className={`p-8 rounded-2xl bg-white border-2 ${
                role.color === 'blue' ? 'border-blue-200' :
                role.color === 'green' ? 'border-green-200' : 'border-purple-200'
              } hover:shadow-xl transition-all`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  role.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  role.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600 mb-6">{role.description}</p>
                <ul className="space-y-3">
                  {role.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-gray-700">
                      <svg className={`h-5 w-5 ${
                        role.color === 'blue' ? 'text-blue-500' :
                        role.color === 'green' ? 'text-green-500' : 'text-purple-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" 
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-tl from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="
                        absolute 
                        top-0 left-0 right-0 
                        h-20 
                        bg-gradient-to-b from-white to-transparent
                      "
        >
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of educators already using TriLearn to streamline their teaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onOpenRegister}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
            >
              Start Teaching Today
            </button>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl hover:bg-white/10 transition-all border-2 border-white"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">TriLearn</span>
              </div>
              <p className="text-sm">
                Connecting teachers, parents, and learners for better education outcomes.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2026 TriLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
