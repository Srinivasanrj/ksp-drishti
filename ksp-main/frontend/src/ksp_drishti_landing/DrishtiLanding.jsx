import React, { useEffect, useRef, useState } from 'react';
import { DrishtiAnimationEngine } from './drishtiAnimationEngine';
import { 
  ArrowRight, 
  Users, 
  Crosshair, 
  Cpu, 
  Database, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';
import './DrishtiLanding.css';

export default function DrishtiLanding({ onComplete }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new DrishtiAnimationEngine(canvas, () => {
      // Callback if needed
    });
    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  const handleEnter = () => {
    setIsEntering(true);
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 450);
  };

  return (
    <div className={`drishti-landing-container ${isEntering ? 'drishti-dark-transition' : ''}`}>
      {/* Pure HTML5 Canvas 2D Rendering — No DOM Graphics */}
      <canvas ref={canvasRef} className="drishti-canvas" />

      {/* High-Tech HUD Overlay */}
      <div className="drishti-hud-overlay">
        {/* Top Header Information HUD */}
        <div className="drishti-top-bar">
          {/* Top-Left: Karnataka State Police & KSP Drishti Intelligence Node */}
          <div className="drishti-top-left-badge">
            <div className="drishti-shield-icon-box">
              <svg 
                width="36" 
                height="42" 
                viewBox="0 0 24 28" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="drishti-shield-star-svg"
              >
                <path 
                  d="M12 2L3 6V13C3 19.5 7.5 24.5 12 26C16.5 24.5 21 19.5 21 13V6L12 2Z" 
                  stroke="#1B2E24" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="rgba(245, 241, 232, 0.45)"
                />
                <path 
                  d="M12 7.5L13.5 11H17L14.2 13.2L15.3 16.5L12 14.5L8.7 16.5L9.8 13.2L7 11H10.5L12 7.5Z" 
                  stroke="#1B2E24" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="#1B2E24"
                />
              </svg>
            </div>
            <div className="drishti-top-left-content">
              <div className="drishti-header-sys">SYS // KARNATAKA STATE POLICE</div>
              <div className="drishti-header-node">
                <span className="drishti-amber-brand">KSP DRISHTI</span>
                <span className="drishti-node-text"> • INTELLIGENCE COMMAND NODE</span>
              </div>
            </div>
          </div>

          {/* Top-Right: Coverage Areas */}
          <div className="drishti-top-right-badge">
            <div className="drishti-coverage-icon-box">
              <Users size={26} className="drishti-coverage-icon" strokeWidth={2.4} />
            </div>
            <div className="drishti-coverage-content">
              <span className="drishti-coverage-title">COVERAGE:</span>
              <span className="drishti-coverage-list"> BENGALURU • MYSURU • BELAGAVI • KALABURAGI</span>
            </div>
          </div>
        </div>

        {/* Center-Bottom Hero Content */}
        <div className="drishti-hero-content">
          {/* Main Title: KSP DRISHTI */}
          <h1 className="drishti-main-title">
            <span className="drishti-title-ksp">KSP </span>
            <span className="drishti-title-drishti">DRISHTI</span>
          </h1>

          {/* Decorated Subtitle Line */}
          <div className="drishti-decorated-subtitle">
            <span className="drishti-dec-line left" />
            <span className="drishti-dec-dot" />
            <span className="drishti-dec-text">AI-POWERED POLICE INTELLIGENCE COMMAND</span>
            <span className="drishti-dec-dot" />
            <span className="drishti-dec-line right" />
          </div>

          {/* Feature Highlights Tags Row */}
          <div className="drishti-features-row">
            <span className="drishti-feat-item">CRIME INTELLIGENCE</span>
            <span className="drishti-feat-dot">•</span>
            <span className="drishti-feat-item">DOCUMENT RAG</span>
            <span className="drishti-feat-dot">•</span>
            <span className="drishti-feat-item">CASE ANALYSIS</span>
            <span className="drishti-feat-dot">•</span>
            <span className="drishti-feat-item">MULTI-AGENT AI ASSISTANCE</span>
          </div>

          {/* Dark-Themed Enter Button */}
          <div className="drishti-cta-wrapper">
            <button 
              type="button" 
              className="drishti-enter-btn dark-theme"
              onClick={handleEnter}
            >
              <div className="drishti-target-icon-box">
                <Crosshair size={20} className="drishti-icon-target" />
              </div>
              <span className="drishti-btn-text">ENTER INTELLIGENCE CONSOLE</span>
              <ArrowRight size={20} className="drishti-icon-arrow" />
            </button>
          </div>

          {/* Powered by Zoho Catalyst Cloud Footer Pill */}
          <div className="drishti-zoho-footer">
            <div className="drishti-zoho-title">POWERED BY ZOHO CATALYST CLOUD</div>
            <div className="drishti-zoho-pill">
              <div className="drishti-zoho-item">
                <Cpu size={16} className="drishti-zoho-icon" />
                <span>LLM SERVING</span>
              </div>
              <div className="drishti-zoho-divider" />
              <div className="drishti-zoho-item">
                <Database size={16} className="drishti-zoho-icon" />
                <span>DATA STORE</span>
              </div>
              <div className="drishti-zoho-divider" />
              <div className="drishti-zoho-item">
                <BookOpen size={16} className="drishti-zoho-icon" />
                <span>RAG ENGINE</span>
              </div>
              <div className="drishti-zoho-divider" />
              <div className="drishti-zoho-item">
                <ShieldCheck size={16} className="drishti-zoho-icon" />
                <span>SECURE FUNCTIONS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
