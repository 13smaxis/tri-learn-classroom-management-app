import React, { useEffect, useState } from 'react';

interface LandingPageProps 
{
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenInvite: () => void;
}

/**
 * Each ball needs separate X and Y keyframes so it "bounces" off walls independently 
 */
const bounceKeyframes = `
@keyframes bx0{0%{left:5%}50%{left:85%}100%{left:5%}}
@keyframes by0{0%{top:8%}50%{top:75%}100%{top:8%}}
@keyframes bx1{0%{left:80%}50%{left:10%}100%{left:80%}}
@keyframes by1{0%{top:70%}50%{top:5%}100%{top:70%}}
@keyframes bx2{0%{left:45%}33%{left:5%}66%{left:90%}100%{left:45%}}
@keyframes by2{0%{top:5%}50%{top:80%}100%{top:5%}}
@keyframes bx3{0%{left:15%}50%{left:75%}100%{left:15%}}
@keyframes by3{0%{top:65%}50%{top:10%}100%{top:65%}}
@keyframes bx4{0%{left:70%}33%{left:20%}66%{left:85%}100%{left:70%}}
@keyframes by4{0%{top:40%}50%{top:80%}100%{top:40%}}
@keyframes bx5{0%{left:35%}50%{left:80%}100%{left:35%}}
@keyframes by5{0%{top:75%}50%{top:15%}100%{top:75%}}
@keyframes pop-in {
  0% { opacity:0; transform:scale(0.3); }
  60% { opacity:1; transform:scale(1.1); }
  100% { opacity:1; transform:scale(1); }
}
@keyframes pulse-glow {
  0%,100% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
}
`;

/**
 * Landing page with animated feature bubbles and role-based sections. 
 * This is a separate component from the main AppLayout to avoid loading all the dashboard data and components 
 *  for unauthenticated users who just want to see the landing page.
 * @param param0  - handlers to open login, register and invite modals in the parent AppLayout component
 * @returns component with animated features and role sections and CTA buttons to open login/register modals 
 */
const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenRegister, onOpenInvite }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 
                   002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
          />
        </svg>
      ),
      title: 'Class Register',
      gradient: 'radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6 50%, #1e40af)',
      shadowColor: 'rgba(59,130,246,0.5)',
      iconColor: 'text-blue-900'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 
                   01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      ),
      title: 'Assignments',
      gradient: 'radial-gradient(circle at 35% 30%, #d8b4fe, #a855f7 50%, #7e22ce)',
      shadowColor: 'rgba(168,85,247,0.5)',
      iconColor: 'text-blue-900'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 
                   012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 
                   2 0 01-2-2z" 
          />
        </svg>
      ),
      title: 'Mark Capture',
      gradient: 'radial-gradient(circle at 35% 30%, #fda4af, #f43f5e 50%, #be123c)',
      shadowColor: 'rgba(244,63,94,0.5)',
      iconColor: 'text-blue-900'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 
                   20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
      ),
      title: 'Messaging',
      gradient: 'radial-gradient(circle at 35% 30%, #86efac, #22c55e 50%, #15803d)',
      shadowColor: 'rgba(34,197,94,0.5)',
      iconColor: 'text-blue-900'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: 'Progress',
      gradient: 'radial-gradient(circle at 35% 30%, #fdba74, #f97316 50%, #c2410c)',
      shadowColor: 'rgba(249,115,22,0.5)',
      iconColor: 'text-blue-900'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'PWA Ready',
      gradient: 'radial-gradient(circle at 35% 30%, #67e8f9, #06b6d4 50%, #0e7490)',
      shadowColor: 'rgba(6,182,212,0.5)',
      iconColor: 'text-blue-900'
    }
  ];

  /**
   * Balls have randomised timings to create organic feel
   * X and Y durations differ so the path isn't a straight line — creates DVD-logo style bouncing 
   */
  const popDelays = [0, 0.12, 0.24, 0.36, 0.48, 0.6];
  const xDurations = [18, 22, 16, 24, 19, 26];
  const yDurations = [24, 17, 21, 18, 26, 16];
  const glowDurations = [3, 3.5, 2.8, 4, 3.2, 2.5];

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
      <style>{bounceKeyframes}</style>
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
              Classroom Management Made Simple
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Connect teachers, parents and learners on one powerful platform. <br/> 
            </p>
            <div className="mb-16"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-20">                                                          {/* Bouncing bubbles box */}
          <div className="relative w-full h-52 sm:h-64 rounded-3xl overflow-hidden">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  animation: mounted
                    ? `pop-in 0.4s ${popDelays[idx]}s both, bx${idx} ${xDurations[idx]}s ${popDelays[idx] + 0.4}s ease-in-out infinite, by${idx} ${yDurations[idx]}s ${popDelays[idx] + 0.4}s ease-in-out infinite`
                    : 'none',
                  opacity: mounted ? undefined : 0,
                }}
              >
                <div
                  className={`
                    w-20 h-20 sm:w-24 sm:h-24
                    rounded-full
                    flex flex-col items-center justify-center
                    cursor-default select-none
                    hover:scale-110 transition-transform duration-200
                  `}
                  style={{
                    background: feature.gradient,
                    boxShadow: `inset -4px -6px 12px rgba(0,0,0,0.25), inset 3px 3px 8px rgba(255,255,255,0.35), 0 8px 24px ${feature.shadowColor}`,
                    animation: `pulse-glow ${glowDurations[idx]}s ease-in-out infinite`,
                  }}
                  title={feature.title}
                >
                  <div className={`${feature.iconColor} mb-0.5 drop-shadow-sm`}>
                    {feature.icon}
                  </div>
                  <span className="
                                    text-[10px] sm:text-xs font-bold text-gray-800 leading-tight text-center px-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {feature.title}
                  </span>
                </div>
              </div>
            ))}
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
            Chose from a variety of features designed to streamline your teaching experience
          </p>
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
