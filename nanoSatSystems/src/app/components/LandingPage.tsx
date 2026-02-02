import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Satellite, ChevronRight, Zap, Shield, Users, Target, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { TypeAnimation } from 'react-type-animation';
import { Footer } from '@/app/components/Footer';

// Pre-generated text descriptions for random selection
const COMPLETE_PLATFORM_TEXTS = [
  "Integrated systems engineering environment for end-to-end mission lifecycle management. From requirements capture through operations, maintain full traceability across all project phases."
];

const EVERYTHING_YOU_NEED_TEXTS = [
  "Semantic vector embeddings enable context-aware document retrieval across terabytes of technical documentation. Query using natural language and receive ranked results based on conceptual similarity."
];

const VIDEO_SOURCES = Object.values(
  import.meta.glob('/public/assets/*.mp4', { eager: true, query: '?url', import: 'default' })
) as string[];

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="bg-[#1a1a1a] relative">
      {/* Film Grain Texture */}
      <div 
        className="fixed inset-0 opacity-[0.15] pointer-events-none z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Satellite className="h-8 w-8 text-gray-300" />
              <span className="text-xl font-bold text-white font-mono tracking-wider">nanoSat</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                className={`font-mono rounded-none relative ${
                  location.pathname === '/' 
                    ? 'text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => navigate('/')}
              >
                {location.pathname === '/' ? (
                  <motion.span
                    className="relative"
                    animate={{
                      textShadow: [
                        '0 0 4px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.2)',
                        '0 0 8px rgba(255,255,255,0.5), 0 0 16px rgba(255,255,255,0.3)',
                        '0 0 4px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.2)',
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Systems
                    {/* Sparkle particles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </motion.span>
                ) : (
                  'Systems'
                )}
              </Button>
              <Button
                variant="ghost"
                className={`font-mono rounded-none ${
                  location.pathname === '/view'
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => navigate('/view')}
              >
                {location.pathname === '/view' ? (
                  <motion.span
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(255,255,255,0.8)',
                        '0 0 20px rgba(255,255,255,0.4)',
                        '0 0 10px rgba(255,255,255,0.8)',
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    View
                  </motion.span>
                ) : (
                  'View'
                )}
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/5 border border-white/20"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              className="bg-white hover:bg-gray-200 text-black font-semibold"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Section 1: Hero with Video */}
      <Section1 isMuted={isMuted} setIsMuted={setIsMuted} />

      {/* Section 1.5: Sliding Features Section */}
      <SlidingFeaturesSection />

      {/* Section 2: Features */}
      <Section2 />

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Section1({ isMuted, setIsMuted }: { isMuted: boolean, setIsMuted: (value: boolean) => void }) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSources = VIDEO_SOURCES.length > 0 ? VIDEO_SOURCES : ['/assets/hero-video.mp4'];
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log('Video autoplay prevented:', error);
      });
    }
  }, [videoIndex]);

  const handleVideoEnded = () => {
    if (videoSources.length === 0) {
      return;
    }
    setVideoIndex((prev) => (prev + 1) % videoSources.length);
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        {videoSources.length > 0 && (
          <video
            ref={videoRef}
            key={videoSources[videoIndex]}
            src={videoSources[videoIndex]}
            muted={isMuted}
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-[#1a1a1a]/70" />
      </div>

      {/* Minimal Stars */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Subtle Corner Accents */}
      <div className="absolute top-20 left-8 w-24 h-24 border-l border-t border-white/10" />
      <div className="absolute top-20 right-8 w-24 h-24 border-r border-t border-white/10" />
      <div className="absolute bottom-8 left-8 w-24 h-24 border-l border-b border-white/10" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-r border-b border-white/10" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl">
        {/* Technical Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-4 flex items-center justify-center gap-4"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-gray-400 font-mono text-xs tracking-widest uppercase">Systems Engineering Platform</span>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl md:text-8xl font-bold text-white mb-12 tracking-tight italic"
          style={{ fontFamily: 'serif', transform: 'perspective(400px) rotateX(15deg)' }}
        >
          Build the Future
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <Button
            size="lg"
            className="bg-white hover:bg-gray-200 text-black font-bold text-lg px-10 py-7"
            onClick={() => navigate('/signup')}
          >
            <Target className="mr-2 h-5 w-5" />
            Initialize Mission
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border border-white/20 text-gray-400 hover:text-white hover:bg-white/5 text-lg px-10 py-7"
            onClick={scrollToFeatures}
          >
            <ChevronRight className="mr-2 h-5 w-5" />
            Learn More
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <ChevronDown className="h-6 w-6 text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function SlidingFeaturesSection() {
  const [randomText] = useState(() => 
    COMPLETE_PLATFORM_TEXTS[Math.floor(Math.random() * COMPLETE_PLATFORM_TEXTS.length)]
  );

  const features = [
    {
      icon: Shield,
      title: 'Requirements Management',
      description: 'Track and manage system requirements with precision. Link requirements to tests, components, and documentation for complete traceability.',
      tag: 'STRUCTURE'
    },
    {
      icon: Zap,
      title: 'Operations Management',
      description: 'Design and visualize operational workflows with intelligent diagramming. Create process flows, decision trees, and system interactions.',
      tag: 'WORKFLOW'
    },
    {
      icon: Users,
      title: 'Testing Management with AI Agents',
      description: 'Leverage AI-powered testing agents to automate test generation, execution, and analysis. Verify system behavior intelligently.',
      tag: 'AI-DRIVEN'
    },
  ];

  return (
    <section
      id="features-section"
      className="min-h-screen flex items-center justify-center py-32 bg-[#1a1a1a] overflow-hidden relative"
    >
      <div className="w-full px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-16 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Mission-Critical Systems</span>
              <div className="h-px w-16 bg-white/10" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Complete Platform
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              End-to-end systems engineering from requirements to verification
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            <div className="grid gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative group"
                >
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-l border-t border-white/10 group-hover:border-white/30 transition-colors" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-r border-t border-white/10 group-hover:border-white/30 transition-colors" />
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l border-b border-white/10 group-hover:border-white/30 transition-colors" />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r border-b border-white/10 group-hover:border-white/30 transition-colors" />
                  
                  <div className="relative bg-[#222222] border border-white/10 p-8 h-full overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.02]" style={{
                      backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }} />
                    
                    <div className="mb-6">
                      <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1.5 border border-white/10">
                        {feature.tag}
                      </span>
                    </div>
                    
                    <div className="mb-6">
                      <feature.icon className="h-14 w-14 text-gray-300" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4 font-mono tracking-wide">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center">
              <div className="w-full">
                <TypeAnimation
                  sequence={[
                    randomText,
                    2000
                  ]}
                  wrapper="p"
                  speed={50}
                  className="text-gray-300 font-mono text-base leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Section2() {
  const [randomText] = useState(() => 
    EVERYTHING_YOU_NEED_TEXTS[Math.floor(Math.random() * EVERYTHING_YOU_NEED_TEXTS.length)]
  );

  const features = [
    {
      icon: Shield,
      title: 'RAG System for Information Retrieval',
      description: 'Intelligent document retrieval using advanced RAG technology to find the information you need instantly',
      tag: 'AI-POWERED'
    },
    {
      icon: Users,
      title: 'AI Assisted Requirements and V&V Management',
      description: 'Leverage AI to manage requirements and verification & validation processes with precision and efficiency',
      tag: 'AUTONOMOUS'
    },
  ];

  return (
    <section
      className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#1a1a1a]"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-white/10" />
            <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Core Capabilities</span>
            <div className="h-px w-12 bg-white/10" />
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
            Powered by AI to streamline your systems engineering workflow
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          <div className="grid gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 border-l border-t border-white/10 group-hover:border-white/30 transition-colors" />
                <div className="absolute -top-2 -right-2 w-4 h-4 border-r border-t border-white/10 group-hover:border-white/30 transition-colors" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l border-b border-white/10 group-hover:border-white/30 transition-colors" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r border-b border-white/10 group-hover:border-white/30 transition-colors" />
                
                <div className="relative bg-[#222222] border border-white/10 p-10 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `
                      linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }} />
                  
                  <div className="mb-4">
                    <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 border border-white/10">
                      {feature.tag}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <feature.icon className="h-12 w-12 text-gray-300" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center">
            <div className="w-full">
              <TypeAnimation
                sequence={[
                  randomText,
                  2000
                ]}
                wrapper="p"
                speed={50}
                className="text-gray-300 font-mono text-base leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
