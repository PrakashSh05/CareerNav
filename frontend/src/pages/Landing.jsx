import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, SparklesIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const heroText = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const highlightCards = [
  {
    icon: SparklesIcon,
    title: 'AI-Powered Insights',
    description: 'Identify the exact skills companies are hiring for using real-time market intelligence.',
    border: 'border-sky-400/70',
    glow: 'shadow-[0_0_60px_rgba(56,189,248,0.35)]',
    accent: 'from-sky-400/40 via-transparent to-transparent'
  },
  {
    icon: ChartBarIcon,
    title: 'Personalized Roadmaps',
    description: 'Receive a tailored learning plan that bridges the gap between where you are and where you want to be.',
    border: 'border-violet-400/70',
    glow: 'shadow-[0_0_60px_rgba(167,139,250,0.35)]',
    accent: 'from-violet-400/40 via-transparent to-transparent'
  },
  {
    icon: LightBulbIcon,
    title: 'Project-Ready Portfolio',
    description: 'Build portfolio-ready projects with guided features designed for modern tech roles.',
    border: 'border-amber-400/70',
    glow: 'shadow-[0_0_60px_rgba(245,197,24,0.45)]',
    accent: 'from-[#FEE715]/50 via-transparent to-transparent'
  }
];

const journeySteps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Tell us about your experience, academic background, and dream role.'
  },
  {
    number: '02',
    title: 'Analyze Skill Gaps',
    description: 'Our AI compares your profile with live job data to pinpoint strengths and gaps.'
  },
  {
    number: '03',
    title: 'Receive Your Roadmap',
    description: 'Follow curated learning paths and projects to become industry-ready faster.'
  }
];

const Landing = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  const networkPattern = useMemo(() => encodeURIComponent(`
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g stroke="rgba(255,255,255,0.07)" stroke-width="1">
        <line x1="20" y1="60" x2="160" y2="20" />
        <line x1="160" y1="20" x2="300" y2="80" />
        <line x1="300" y1="80" x2="360" y2="200" />
        <line x1="360" y1="200" x2="280" y2="320" />
        <line x1="280" y1="320" x2="140" y2="360" />
        <line x1="140" y1="360" x2="40" y2="240" />
        <line x1="40" y1="240" x2="20" y2="60" />
        <line x1="140" y1="360" x2="300" y2="80" />
        <line x1="40" y1="240" x2="300" y2="80" />
        <line x1="160" y1="20" x2="280" y2="320" />
        <circle cx="20" cy="60" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="160" cy="20" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="300" cy="80" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="360" cy="200" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="280" cy="320" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="140" cy="360" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="40" cy="240" r="3" fill="rgba(255,255,255,0.18)" />
      </g>
    </svg>
  `), []);

  const handleCursorMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
    if (!isPointerActive) {
      setIsPointerActive(true);
    }
  };

  const handleCursorLeave = () => {
    setIsPointerActive(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  const parallaxShift = (value, intensity) => (value - 0.5) * intensity;

  const glowBackdropStyle = useMemo(() => ({
    background: `radial-gradient(340px circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(254,231,21,0.18), transparent 60%)`
  }), [mousePosition]);

  return (
    <div 
      className="min-h-screen bg-primary-950 text-white overflow-hidden"
      onMouseMove={handleCursorMove}
      onMouseLeave={handleCursorLeave}
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 -z-20 opacity-70"
          style={{
            backgroundImage: `url("data:image/svg+xml,${networkPattern}")`,
            backgroundSize: '520px 520px'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '60% 40%', '100% 80%', '0% 0%']
          }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f2f46_0%,#0a1016_60%,#04060a_100%)]" />
          <motion.div
            className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-[#FEE715]/20 blur-3xl"
            animate={{
              x: [0, 30, -20, 0],
              y: [0, 20, -25, 0],
              scale: [1, 1.05, 0.95, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              transform: `translate(${parallaxShift(mousePosition.x, 40)}px, ${parallaxShift(mousePosition.y, 30)}px)`
            }}
          />
          <motion.div
            className="absolute top-1/3 right-[-6rem] h-80 w-80 rounded-full bg-teal-500/10 blur-3xl"
            animate={{
              x: [0, -35, 25, 0],
              y: [0, -20, 15, 0],
              scale: [1, 0.92, 1.08, 1]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              transform: `translate(${parallaxShift(mousePosition.x, -30)}px, ${parallaxShift(mousePosition.y, -40)}px)`
            }}
          />
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={glowBackdropStyle}
            animate={{ opacity: isPointerActive ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>

        {/* Full-screen Experience */}
        <section className="relative w-full px-6 md:px-10 lg:px-16 xl:px-24 py-14 lg:py-20 min-h-screen flex items-center justify-center">
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 md:opacity-100"
            animate={{
              x: parallaxShift(mousePosition.x, 60),
              y: parallaxShift(mousePosition.y, 40),
              opacity: isPointerActive ? 1 : 0.7
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(200px_circle,rgba(255,255,255,0.08),transparent)]" />
          </motion.div>
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-stretch">
            <motion.div
              variants={heroText}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 space-y-6 self-center"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-white">
                Navigate Your Engineering Career with <span className="text-[#FEE715]">Intelligent Guidance</span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-xl">
                Stop guessing what to learn next. Our AI-driven platform analyses the market, uncovers your skill gaps, and builds a personalized roadmap to land your dream role faster.
              </p>
              <motion.button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-[#101820] bg-[#FEE715] hover:bg-[#f9d900] transition-colors shadow-[0_8px_30px_rgba(254,231,21,0.35)]"
                whileHover={{ x: 4, y: -2, boxShadow: '0 12px 45px rgba(254,231,21,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative lg:col-span-7"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FEE715]/10 via-transparent to-transparent rounded-3xl blur-2xl" />
              <div className="relative grid sm:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6 text-sm">
                {highlightCards.map(({ icon: Icon, title, description, accent, glow, border }, idx) => (
                  <motion.div
                    key={title}
                    className={`p-6 xl:p-7 rounded-3xl bg-black/30 border ${border} backdrop-blur-xl min-h-[220px] flex flex-col justify-between overflow-hidden ${glow}`}
                    whileHover={{ translateY: -6, scale: 1.01 }}
                    style={{
                      transform: `translate(${parallaxShift(mousePosition.x, idx % 2 === 0 ? 6 : -6)}px, ${parallaxShift(mousePosition.y, 6)}px)`
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70`} />
                    <div className="relative">
                      <Icon className="h-7 w-7 text-white mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Landing;
