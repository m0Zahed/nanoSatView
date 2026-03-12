import { Satellite } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { useState } from 'react';
import Engine from '@/app/engine/components/Engine';
import { satellite_search_params } from '@/app/engine/interfaces/sat_data_intf';

export function ViewPage() {
  const navigate = useNavigate();
  const [trackedSatList, setTrackedSat] = useState<satellite_search_params[]>([]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      {/* Film Grain Texture */}
      <div 
        className="fixed inset-0 opacity-[0.15] pointer-events-none z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Satellite className="h-8 w-8 text-gray-300" />
              <span className="text-xl font-bold text-white font-mono tracking-wider">nanoSat</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/5 font-mono rounded-none"
                onClick={() => navigate('/systems')}
              >
                Systems
              </Button>
              <Button
                variant="ghost"
                className="font-mono rounded-none text-white"
                onClick={() => navigate('/view')}
              >
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
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/5 border border-white/20"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Engine */}
      <div className="pt-20 relative">
        <Engine trackedSatList={trackedSatList} setTrackedSat={setTrackedSat} />
      </div>
    </div>
  );
}
