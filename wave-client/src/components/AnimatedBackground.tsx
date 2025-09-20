import { useEffect, useState } from 'react'
import ParticleEffect from './ParticleEffect'

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900" />
      
      {/* Particle Effect */}
      <ParticleEffect />
      
      {/* Animated Orbs */}
      <div className="absolute inset-0">
        <div className="floating-orb orb-1" />
        <div className="floating-orb orb-2" />
        <div className="floating-orb orb-3" />
        <div className="floating-orb orb-4" />
        <div className="floating-orb orb-5" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid-pattern" />
      </div>
      
      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-radial-gradient" />
      
      <style>{`
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(2px);
          animation: float 20s infinite ease-in-out;
          opacity: 0.6;
        }
        
        .orb-1 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2));
          top: -150px;
          left: -150px;
          animation-delay: 0s;
        }
        
        .orb-2 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.2));
          top: 20%;
          right: -100px;
          animation-delay: -5s;
        }
        
        .orb-3 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2));
          bottom: -125px;
          left: 30%;
          animation-delay: -10s;
        }
        
        .orb-4 {
          width: 180px;
          height: 180px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.2));
          top: 60%;
          left: 10%;
          animation-delay: -15s;
        }
        
        .orb-5 {
          width: 220px;
          height: 220px;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(147, 51, 234, 0.3));
          top: 30%;
          right: 20%;
          animation-delay: -7s;
        }
        
        .grid-pattern {
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 30s linear infinite;
        }
        
        .bg-radial-gradient {
          background: radial-gradient(
            circle at 50% 50%,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(147, 51, 234, 0.05) 25%,
            transparent 50%
          );
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-100px) translateX(50px) scale(1.1);
          }
          50% {
            transform: translateY(-50px) translateX(-30px) scale(0.9);
          }
          75% {
            transform: translateY(80px) translateX(20px) scale(1.05);
          }
        }
        
        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .orb-1 { width: 200px; height: 200px; top: -100px; left: -100px; }
          .orb-2 { width: 150px; height: 150px; right: -75px; }
          .orb-3 { width: 180px; height: 180px; bottom: -90px; }
          .orb-4 { width: 120px; height: 120px; }
          .orb-5 { width: 160px; height: 160px; }
          
          .grid-pattern {
            background-size: 30px 30px;
          }
        }
        
        /* Enhanced blur effects for modern browsers */
        @supports (backdrop-filter: blur(10px)) {
          .floating-orb {
            backdrop-filter: blur(1px);
          }
        }
      `}</style>
    </div>
  )
}