import { motion, useTransform, useScroll } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight, Play, Satellite, Database, Bot, Cpu, Radio, Target } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import capellaLogo from 'figma:asset/4cd63406e6ab2d332d6361418a9c6bf4fb53dca0.png';
import mslLogo from 'figma:asset/4e00837761b0379aa948797089aeee4e36f60ac7.png';
import googleSheetsLogo from 'figma:asset/79f9540991611acc8ef9e2c4cdd2e207c586005a.png';
import diagramGptLogo from 'figma:asset/5234ef8dd429a3869ddae4436a895d1252b4570a.png';
import githubLogo from 'figma:asset/d7c9b449ae05744848c56899970eefd75390854e.png';
import spaceConcordiaLogo from 'figma:asset/6a7b6c6adf7621a75a857983bcd1197626b53f1d.png';
import { Brain, Twitter, Linkedin, Github } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented, this is fine
          console.log('Video autoplay prevented:', error);
        });
      }
    }
    
    return () => {
      // Cleanup: pause video when component unmounts
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-[#1a1a1a] relative">
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
            className="flex items-center gap-3"
          >
            <Satellite className="h-8 w-8 text-gray-300" />
            <span className="text-xl font-bold text-white font-mono tracking-wider">nanoSatView systems</span>
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
      <Section1 videoRef={videoRef} isMuted={isMuted} setIsMuted={setIsMuted} />

      {/* Section 2: Features */}
      <Section2 scrollYProgress={scrollYProgress} />

      {/* Section 3: Technology */}
      <Section3 scrollYProgress={scrollYProgress} />

      {/* Section 4: Collaboration */}
      <Section4 scrollYProgress={scrollYProgress} />

      {/* Section 5: Footer with About, Careers, etc. */}
      <Section5 />
    </div>
  );
}

function Section1({ videoRef, isMuted, setIsMuted }: { videoRef: React.RefObject<HTMLVideoElement>, isMuted: boolean, setIsMuted: (value: boolean) => void }) {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle Dark Background */}
      <div className="absolute inset-0 bg-[#1a1a1a]" />

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
            className="border border-white/20 text-white hover:bg-white/5 text-lg px-10 py-7"
            onClick={() => navigate('/login')}
          >
            <Radio className="mr-2 h-5 w-5" />
            Access System
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

function Section2({ scrollYProgress }: { scrollYProgress: any }) {
  const opacity = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0.1, 0.2], [100, 0]);

  const features = [
    {
      icon: Database,
      title: 'RAG System for Information Retrieval',
      description: 'Intelligent document retrieval using advanced RAG technology to find the information you need instantly',
      tag: 'AI-POWERED'
    },
    {
      icon: Bot,
      title: 'AI Assisted Requirements and V&V Management',
      description: 'Leverage AI to manage requirements and verification & validation processes with precision and efficiency',
      tag: 'AUTONOMOUS'
    },
  ];

  return (
    <motion.section
      style={{ opacity, y }}
      className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#1a1a1a]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Technical Header */}
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

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
              {/* Corner Accents */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l border-t border-white/10 group-hover:border-white/30 transition-colors" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-r border-t border-white/10 group-hover:border-white/30 transition-colors" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l border-b border-white/10 group-hover:border-white/30 transition-colors" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r border-b border-white/10 group-hover:border-white/30 transition-colors" />
              
              <div className="relative bg-[#222222] border border-white/10 p-10 overflow-hidden">
                {/* Subtle Grid */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }} />
                
                {/* Tag */}
                <div className="mb-4">
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 border border-white/10">
                    {feature.tag}
                  </span>
                </div>
                
                {/* Icon */}
                <div className="mb-6">
                  <feature.icon className="h-12 w-12 text-gray-300" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function Section3({ scrollYProgress }: { scrollYProgress: any }) {
  const opacity = useTransform(scrollYProgress, [0.3, 0.4, 0.5], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0.3, 0.4], [100, 0]);

  const integrations = [
    { logo: capellaLogo, name: 'Capella' },
    { logo: mslLogo, name: 'MSL v2' },
    { logo: googleSheetsLogo, name: 'Google Sheets' },
    { logo: diagramGptLogo, name: 'DiagramGPT' },
    { logo: githubLogo, name: 'GitHub' },
  ];

  return (
    <motion.section
      style={{ opacity, y }}
      className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#1a1a1a]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Technical Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-white/10" />
            <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Interoperability</span>
            <div className="h-px w-12 bg-white/10" />
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Integrations
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
            Seamlessly connect with the tools you already use to enhance your workflow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              {/* Corner Indicators */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-white/10 group-hover:border-white/20 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-r border-t border-white/10 group-hover:border-white/20 transition-colors" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l border-b border-white/10 group-hover:border-white/20 transition-colors" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-white/10 group-hover:border-white/20 transition-colors" />
              
              <div className="bg-white p-12 transition-all duration-300 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={integration.logo} 
                  alt={integration.name}
                  className="w-full h-auto max-h-24 object-contain relative z-10"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function Section4({ scrollYProgress }: { scrollYProgress: any }) {
  const opacity = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0.5, 0.6], [100, 0]);

  return (
    <motion.section
      style={{ opacity, y }}
      className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#1a1a1a]"
    >
      <div className="max-w-7xl mx-auto text-center">
        {/* Technical Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-white/10" />
            <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Mission Partners</span>
            <div className="h-px w-12 bg-white/10" />
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-4 text-white">
            Users/Collaborators
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center mb-20"
        >
          <div className="relative group">
            {/* Corner Indicators */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-l border-t border-white/10 group-hover:border-white/20 transition-colors" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-r border-t border-white/10 group-hover:border-white/20 transition-colors" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l border-b border-white/10 group-hover:border-white/20 transition-colors" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r border-b border-white/10 group-hover:border-white/20 transition-colors" />
            
            <div className="bg-white p-16 transition-all duration-300 relative overflow-hidden">
              <img 
                src={spaceConcordiaLogo} 
                alt="Space Concordia"
                className="w-64 h-auto object-contain relative z-10"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Button
            size="lg"
            className="bg-white hover:bg-gray-200 text-black font-bold text-lg px-12 py-7"
            onClick={() => window.location.href = '/signup'}
          >
            <Target className="mr-2 h-5 w-5" />
            Join Our Community
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}

function Section5() {
  const navigate = useNavigate();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#' },
      { name: 'Pricing', href: '#' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Blog', href: '#' },
    ],
    resources: [
      { name: 'Documentation', href: '#' },
      { name: 'Help Center', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'Contact', href: '#' },
    ],
  };

  return (
    <section className="bg-black border-t border-white/10 px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
            <div className="flex items-center gap-2 mb-4">
              <Satellite className="h-8 w-8 text-cyan-400" />
              <span className="text-xl font-bold text-white font-mono">nanoSatView systems</span>
            </div>
            <p className="text-gray-400 mb-6">
              Building the future of systems engineering.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </motion.div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-semibold mb-4 capitalize">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-12 mb-12"
        >
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Get the latest updates, insights, and news delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-gray-400 text-sm">
            © 2026 nanoSatView systems. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}