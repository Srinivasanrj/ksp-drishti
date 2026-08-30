import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ShieldCheck, Cpu, Database, Search, Share2, Layers, Terminal, CheckCircle2, Lock, Sparkles } from 'lucide-react';

const BOOT_LOGS = [
  "[0.00s] [KERNEL] Booting Karnataka State Police KSP DRISHTI Engine v4.2...",
  "[0.35s] [OAUTH] Connecting to Zoho Catalyst QuickML GLM-4.7B LLM...",
  "[0.72s] [SQLITE] Ingesting crime.db schema (CrimeStatistics, CyberCrimes, MoneyMules)...",
  "[1.10s] [RAG] Indexing 51 SOP documents & IT Act legal vector store (rag_vectors.npy)...",
  "[1.48s] [AGENT_1] Initializing Analytics Supervisor Agent (Text-to-SQL)...",
  "[1.85s] [AGENT_2] Binding Document SOP RAG Agent with Bracketed Citations...",
  "[2.20s] [AGENT_3] Arming Tactical Interrogation Pattern Agent & Decision Trees...",
  "[2.55s] [AGENT_4] Activating Intelligence Money Mule UPI Tracker...",
  "[2.90s] [SEC65B] Generating SHA-256 Cryptographic Stamp (Sec 63 BSA 2023)...",
  "[3.20s] [SYSTEM] Command Portal Synchronized. Access Granted."
];

function KSPLoadingScreen({ onComplete }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const logoImgRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const ring3Ref = useRef(null);
  const titleRef = useRef(null);
  const logBoxRef = useRef(null);
  const laserRef = useRef(null);
  
  // HUD Corner refs
  const cornerTLRef = useRef(null);
  const cornerTRRef = useRef(null);
  const cornerBLRef = useRef(null);
  const cornerBRRef = useRef(null);

  // Agent Node Refs
  const agent1Ref = useRef(null);
  const agent2Ref = useRef(null);
  const agent3Ref = useRef(null);
  const agent4Ref = useRef(null);

  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState(BOOT_LOGS[0]);
  const [logHistory, setLogHistory] = useState([]);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);

  // 1. Canvas Background Particle Grid & Laser Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create particles
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2
    }));

    let laserY = 0;
    let laserSpeed = 2.5;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Particles & Connections
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(2, 132, 199, ${p.alpha})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(2, 132, 199, ${0.15 * (1 - dist / 110)})`;
            ctx.stroke();
          }
        }
      }

      // Laser Scanner Sweep
      laserY += laserSpeed;
      if (laserY > height || laserY < 0) laserSpeed *= -1;

      const grad = ctx.createLinearGradient(0, laserY - 15, 0, laserY + 15);
      grad.addColorStop(0, 'rgba(2, 132, 199, 0)');
      grad.addColorStop(0.5, 'rgba(2, 132, 199, 0.2)');
      grad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, laserY - 15, width, 30);

      ctx.beginPath();
      ctx.moveTo(0, laserY);
      ctx.lineTo(width, laserY);
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Master GSAP Complex Animation Timelines
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Setup initial transforms
      gsap.set(cornerTLRef.current, { x: -60, y: -60, opacity: 0 });
      gsap.set(cornerTRRef.current, { x: 60, y: -60, opacity: 0 });
      gsap.set(cornerBLRef.current, { x: -60, y: 60, opacity: 0 });
      gsap.set(cornerBRRef.current, { x: 60, y: 60, opacity: 0 });

      gsap.set(logoWrapperRef.current, { scale: 0, opacity: 0, rotationX: 45, perspective: 1000 });
      gsap.set(logoImgRef.current, { scale: 0.5, opacity: 0 });
      gsap.set(titleRef.current, { y: 30, opacity: 0, letterSpacing: '0px' });
      gsap.set(logBoxRef.current, { y: 40, opacity: 0 });

      const agentRefs = [agent1Ref.current, agent2Ref.current, agent3Ref.current, agent4Ref.current];
      agentRefs.forEach(ref => {
        if (ref) gsap.set(ref, { scale: 0, opacity: 0 });
      });

      // Master Intro Timeline
      const masterTL = gsap.timeline();

      masterTL
        // 1. HUD Corners slide in
        .to([cornerTLRef.current, cornerTRRef.current, cornerBLRef.current, cornerBRRef.current], {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out'
        })
        // 2. 3D Emblem Hologram assemble
        .to(logoWrapperRef.current, {
          scale: 1,
          opacity: 1,
          rotationX: 0,
          duration: 1.2,
          ease: 'back.out(1.5)'
        }, '-=0.4')
        .to(logoImgRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)'
        }, '-=0.8')
        // 3. Title & Subtitle expansion
        .to(titleRef.current, {
          y: 0,
          opacity: 1,
          letterSpacing: '8px',
          duration: 1,
          ease: 'power4.out'
        }, '-=0.5')
        .to(logBoxRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out'
        }, '-=0.6');

      // Continuous HUD Rings Rotation
      gsap.to(ring1Ref.current, { rotation: 360, duration: 15, repeat: -1, ease: 'none' });
      gsap.to(ring2Ref.current, { rotation: -360, duration: 25, repeat: -1, ease: 'none' });
      gsap.to(ring3Ref.current, { rotation: 180, duration: 10, repeat: -1, ease: 'sine.easeInOut', yoyo: true });

      // 3D Mouse Parallax effect on Logo
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (clientX - centerX) / 35;
        const moveY = (clientY - centerY) / 35;

        gsap.to(logoWrapperRef.current, {
          rotationY: moveX,
          rotationX: -moveY,
          duration: 0.8,
          ease: 'power1.out'
        });
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Progress Tweener (0 to 100%)
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 100,
        duration: 3.8,
        ease: 'power1.inOut',
        onUpdate: () => {
          const val = Math.floor(counter.val);
          setProgress(val);

          // Update Log History & Active Agents based on Progress
          const logIdx = Math.min(BOOT_LOGS.length - 1, Math.floor((val / 100) * BOOT_LOGS.length));
          setCurrentLog(BOOT_LOGS[logIdx]);
          setLogHistory(BOOT_LOGS.slice(0, logIdx + 1));

          // Animate 4 Agent Nodes sequentially
          if (val >= 25 && activeAgentIndex < 0) {
            setActiveAgentIndex(0);
            if (agent1Ref.current) gsap.to(agent1Ref.current, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
          }
          if (val >= 50 && activeAgentIndex < 1) {
            setActiveAgentIndex(1);
            if (agent2Ref.current) gsap.to(agent2Ref.current, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
          }
          if (val >= 75 && activeAgentIndex < 2) {
            setActiveAgentIndex(2);
            if (agent3Ref.current) gsap.to(agent3Ref.current, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
          }
          if (val >= 90 && activeAgentIndex < 3) {
            setActiveAgentIndex(3);
            if (agent4Ref.current) gsap.to(agent4Ref.current, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
          }
        },
        onComplete: () => {
          // Outro Transition Timeline
          gsap.timeline({
            onComplete: () => {
              if (onComplete) onComplete();
            }
          })
          .to(containerRef.current, {
            opacity: 0,
            scale: 1.08,
            filter: 'blur(10px)',
            duration: 0.7,
            ease: 'power3.inOut'
          });
        }
      });

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {/* Interactive Particles & Laser Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* TOP STREAM TICKER BAR */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 32,
        background: '#f8fafc',
        borderBottom: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '0.65rem',
        color: '#0284c7',
        fontWeight: 800,
        letterSpacing: '1px',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', boxShadow: '0 0 8px #059669' }}></span>
          <span>SEC 65B CERTIFIED ENCRYPTED LINK</span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span>SHA256: 8F9B7C1A3D4E5F6A9012</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span>ZOHO CATALYST QUICKML 4.7B</span>
          <span style={{ color: '#059669' }}>SYSTEM ONLINE ●</span>
        </div>
      </div>

      {/* HUD CORNER BRACKETS */}
      <div ref={cornerTLRef} style={{ position: 'absolute', top: 45, left: 45, width: 40, height: 40, borderTop: '3px solid #0284c7', borderLeft: '3px solid #0284c7', pointerEvents: 'none' }} />
      <div ref={cornerTRRef} style={{ position: 'absolute', top: 45, right: 45, width: 40, height: 40, borderTop: '3px solid #0284c7', borderRight: '3px solid #0284c7', pointerEvents: 'none' }} />
      <div ref={cornerBLRef} style={{ position: 'absolute', bottom: 45, left: 45, width: 40, height: 40, borderBottom: '3px solid #0284c7', borderLeft: '3px solid #0284c7', pointerEvents: 'none' }} />
      <div ref={cornerBRRef} style={{ position: 'absolute', bottom: 45, right: 45, width: 40, height: 40, borderBottom: '3px solid #0284c7', borderRight: '3px solid #0284c7', pointerEvents: 'none' }} />

      {/* CENTRAL 3D HOLOGRAPHIC EMBLEM ASSEMBLY */}
      <div
        ref={logoWrapperRef}
        style={{
          position: 'relative',
          width: 320,
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Outer Ring 1 */}
        <div
          ref={ring1Ref}
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: '2px dashed rgba(2, 132, 199, 0.25)',
            boxShadow: '0 0 30px rgba(2, 132, 199, 0.1)'
          }}
        />

        {/* Outer Ring 2 (Radar Scale) */}
        <div
          ref={ring2Ref}
          style={{
            position: 'absolute',
            width: 250,
            height: 250,
            borderRadius: '50%',
            border: '2px solid rgba(2, 132, 199, 0.4)',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent'
          }}
        />

        {/* Inner Pulsing Ring 3 */}
        <div
          ref={ring3Ref}
          style={{
            position: 'absolute',
            width: 190,
            height: 190,
            borderRadius: '50%',
            border: '1.5px solid rgba(2, 132, 199, 0.7)',
            boxShadow: '0 0 30px rgba(2, 132, 199, 0.2)'
          }}
        />

        {/* Center KSP Crest Emblem Logo */}
        <div
          ref={logoImgRef}
          style={{
            position: 'relative',
            zIndex: 10,
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: '#ffffff',
            padding: 14,
            border: '2px solid #e0f2fe',
            boxShadow: '0 10px 40px rgba(2, 132, 199, 0.2), 0 0 15px rgba(2, 132, 199, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/ksp_police_logo.png"
            alt="KSP Crest"
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}
          />
        </div>

        {/* 4 ORBITING MULTI-AGENT SUBSYSTEM NODES */}
        
        {/* Node 1: Analytics Agent */}
        <div
          ref={agent1Ref}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            border: '1.5px solid #2563eb',
            borderRadius: 10,
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
            zIndex: 12
          }}
        >
          <Cpu size={12} style={{ color: '#2563eb' }} /> Analytics Agent
        </div>

        {/* Node 2: Document RAG Agent */}
        <div
          ref={agent2Ref}
          style={{
            position: 'absolute',
            right: -25,
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#ffffff',
            border: '1.5px solid #059669',
            borderRadius: 10,
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(5,150,105,0.15)',
            zIndex: 12
          }}
        >
          <Database size={12} style={{ color: '#059669' }} /> Document RAG Agent
        </div>

        {/* Node 3: Pattern AI Agent */}
        <div
          ref={agent3Ref}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            border: '1.5px solid #d97706',
            borderRadius: 10,
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(217,119,6,0.15)',
            zIndex: 12
          }}
        >
          <Search size={12} style={{ color: '#d97706' }} /> Pattern AI Agent
        </div>

        {/* Node 4: Intelligence Mule Agent */}
        <div
          ref={agent4Ref}
          style={{
            position: 'absolute',
            left: -25,
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#ffffff',
            border: '1.5px solid #7c3aed',
            borderRadius: 10,
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#6d28d9',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(124,58,237,0.15)',
            zIndex: 12
          }}
        >
          <Share2 size={12} style={{ color: '#7c3aed' }} /> Intel Mule Tracker
        </div>

      </div>

      {/* TITLE & PLATFORM BADGES */}
      <div style={{ textAlign: 'center', zIndex: 10, maxWidth: 650, padding: '0 20px' }}>
        <h1
          ref={titleRef}
          style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e40af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase'
          }}
        >
          KARNATAKA STATE POLICE
        </h1>

        <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: 6, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          State Crime Records Bureau (SCRB) • Multi-Agent Command Console
        </p>
      </div>

      {/* LIVE TERMINAL CONSOLE LOG BOX */}
      <div
        ref={logBoxRef}
        style={{
          marginTop: 20,
          width: '90%',
          maxWidth: 580,
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: 12,
          padding: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={14} /> KSP DRISHTI Boot Console Log
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>
            {progress}% LOADED
          </span>
        </div>

        {/* Terminal Line Output */}
        <div style={{ height: 42, overflow: 'hidden', fontSize: '0.7rem', fontFamily: 'monospace', color: '#475569', textAlign: 'left', lineHeight: 1.5 }}>
          {logHistory.slice(-2).map((log, i) => (
            <div key={i} style={{ opacity: i === logHistory.slice(-2).length - 1 ? 1 : 0.6, color: i === logHistory.slice(-2).length - 1 ? '#0284c7' : '#64748b', fontWeight: i === logHistory.slice(-2).length - 1 ? 700 : 500 }}>
              {log}
            </div>
          ))}
        </div>

        {/* Progress Bar Fill */}
        <div style={{ marginTop: 10, width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 50%, #059669 100%)',
              boxShadow: '0 0 10px rgba(2, 132, 199, 0.3)',
              transition: 'width 0.1s linear'
            }}
          />
        </div>
      </div>

    </div>
  );
}

export default KSPLoadingScreen;
