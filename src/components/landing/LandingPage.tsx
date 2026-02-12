import React, { useEffect, useState } from 'react';

interface LandingPageProps 
{
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenInvite: () => void;
}

const animKeyframes = `
@keyframes pop-in {
  0% { opacity:0; transform:scale(0.3); }
  60% { opacity:1; transform:scale(1.1); }
  100% { opacity:1; transform:scale(1); }
}
@keyframes pulse-glow {
  0%,100% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
}
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
@keyframes slide-fade-in {
  0%   { opacity:0; transform:translateY(18px); }
  100% { opacity:1; transform:translateY(0); }
}
@keyframes slide-fade-out {
  0%   { opacity:1; transform:translateY(0); }
  100% { opacity:0; transform:translateY(-18px); }
}
@keyframes card-enter {
  0%   { opacity:0; transform:translateY(24px) scale(0.92); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
`;

/* Slide definitions for the cycling area below the hero */
interface Slide {
  type: 'text' | 'card';
  heading?: string;
  sub?: string;
  card?: { title: string; description: string; color: string; features: string[] };
}

const slides: Slide[] = [
  {
    type: 'text',
    heading: 'Keep your classroom organised and efficient',
    sub: 'Choose from a variety of features designed to streamline your teaching experience',
  },
  {
    type: 'text',
    heading: 'One App, Three Roles',
    sub: 'Same platform, different experiences tailored to each user',
  },
  {
    type: 'card',
    card: {
      title: 'Teachers',
      description: 'Create classes, manage attendance, assignments, and communicate with parents and learners.',
      color: 'blue',
      features: ['Create unlimited classes', 'Track attendance', 'Grade assignments', 'Message parents & learners'],
    },
  },
  {
    type: 'card',
    card: {
      title: 'Parents',
      description: "Stay connected with your child's education journey and communicate with teachers.",
      color: 'green',
      features: ['View child progress', 'Track attendance', 'See upcoming assignments', 'Message teachers'],
    },
  },
  {
    type: 'card',
    card: {
      title: 'Learners',
      description: 'Access assignments, view grades, and stay on top of your studies.',
      color: 'purple',
      features: ['View assignments', 'Submit homework', 'Track grades', 'Message teachers'],
    },
  },
];

const SLIDE_DURATION = 4000; // ms each slide is visible
const TRANSITION_MS  = 500;  // fade transition duration

const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenRegister, onOpenInvite }) => {
  const [mounted, setMounted] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* Cycle slides indefinitely */
  useEffect(() => {
    const iv = setInterval(() => {
      setPhase('out');
      setTimeout(() => {
        setSlideIdx((prev) => (prev + 1) % slides.length);
        setPhase('in');
      }, TRANSITION_MS);
    }, SLIDE_DURATION);
    return () => clearInterval(iv);
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

  const currentSlide = slides[slideIdx];

  /* ──── colour helpers for role cards ──── */
  const cardBorder: Record<string, string> = { blue: 'border-blue-300', green: 'border-green-300', purple: 'border-purple-300' };
  const cardIcon: Record<string, string>   = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600' };
  const checkColor: Record<string, string> = { blue: 'text-blue-500', green: 'text-green-500', purple: 'text-purple-500' };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      <style>{animKeyframes}</style>

      {/* ═══════ Top: Hero (70% of viewport) ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white" style={{ height: '80dvh', minHeight: 0 }}>
        <div className="relative h-full flex flex-col items-center justify-center px-4">
          {/* Heading */}
          <h1 className="text-[clamp(1.25rem,4vw,3rem)] font-bold mb-[1vh] text-center leading-tight">
            Classroom Management Made Simple
          </h1>
          <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-blue-100 max-w-2xl mx-auto mb-[2vh] text-center">
            Connect teachers, parents and learners on one powerful platform.
          </p>

          {/* Bouncing feature bubbles */}
          <div className="relative w-full max-w-3xl" style={{ height: 'clamp(6rem, 20vh, 11rem)' }}>
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
                  className="rounded-full flex flex-col items-center justify-center cursor-default select-none hover:scale-110 transition-transform duration-200"
                  style={{
                    width: 'clamp(3rem, 8vh, 5rem)',
                    height: 'clamp(3rem, 8vh, 5rem)',
                    background: feature.gradient,
                    boxShadow: `inset -4px -6px 12px rgba(0,0,0,0.25), inset 3px 3px 8px rgba(255,255,255,0.35), 0 8px 24px ${feature.shadowColor}`,
                    animation: `pulse-glow ${glowDurations[idx]}s ease-in-out infinite`,
                  }}
                  title={feature.title}
                >
                  <div className={`${feature.iconColor} mb-0.5 drop-shadow-sm`}>{feature.icon}</div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight text-center px-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {feature.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient fade into bottom area */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ═══════ Bottom: Animated sliding content (30% of viewport) ═══════ */}
      <section className="bg-white flex items-center justify-center px-4 py-1" style={{ height: '20dvh', minHeight: 0, flexShrink: 0 }}>
        <div
          key={slideIdx}
          className="w-full max-w-xl flex flex-col items-center text-center"
          style={{
            animation: `${phase === 'in' ? 'slide-fade-in' : 'slide-fade-out'} ${TRANSITION_MS}ms ease both`,
          }}
        >
          {/* ── Text slides ── */}
          {currentSlide.type === 'text' && (
            <>
              <h2
                className="font-extrabold text-gray-900 mb-[0.5vh] leading-tight"
                style={{ fontFamily: "'Poppins','Inter',-apple-system,BlinkMacSystemFont,sans-serif", letterSpacing: '-0.02em', fontSize: 'clamp(0.875rem, 2.5vh, 1.25rem)' }}
              >
                {currentSlide.heading}
              </h2>
              <p className="text-gray-500 max-w-md" style={{ fontSize: 'clamp(0.65rem, 1.5vh, 0.875rem)' }}>{currentSlide.sub}</p>
            </>
          )}

          {/* ── Card slides ── */}
          {currentSlide.type === 'card' && currentSlide.card && (() => {
            const c = currentSlide.card;
            return (
              <div
                className={`w-full max-w-sm rounded-xl bg-white border ${cardBorder[c.color]} shadow-md`}
                style={{ animation: `card-enter ${TRANSITION_MS}ms ease both`, padding: 'clamp(0.5rem, 1.5vh, 1rem)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cardIcon[c.color]}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900" style={{ fontSize: 'clamp(0.75rem, 1.8vh, 1rem)' }}>{c.title}</h3>
                </div>
                <p className="text-gray-600 mb-1" style={{ fontSize: 'clamp(0.6rem, 1.3vh, 0.75rem)' }}>{c.description}</p>
                <ul className="text-left" style={{ gap: 'clamp(0, 0.3vh, 0.25rem)', display: 'flex', flexDirection: 'column' }}>
                  {c.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-1.5 text-gray-700" style={{ fontSize: 'clamp(0.6rem, 1.2vh, 0.75rem)' }}>
                      <svg className={`h-3 w-3 flex-shrink-0 ${checkColor[c.color]}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}


        </div>
      </section>
    </div>
  );
};

export default LandingPage;
