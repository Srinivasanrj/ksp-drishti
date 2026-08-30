/**
 * DRISHTI // Crime Intelligence Network
 * High-Tech Minimalist Radar / HUD & Biometric Iris Canvas Animation Engine
 * 
 * 60-20-10-5-5 Color Palette:
 * • 60% #EAE5D9 (Warm Sandstone Canvas)
 * • 20% #F5F1E8 (Light Wheat Surface)
 * • 10% #1B2E24 (Dark Cypress Slate)
 * • 5%  #F59E0B (Vibrant Neon Amber)
 * • 5%  #10B981 (Vivid Emerald)
 * 
 * Karnataka State Police — State Crime Records Bureau (SCRB)
 */

import emblemImgSrc from './image.png';

// Palette Tokens
const COLOR = {
  CANVAS_BG: '#EAE5D9',        // 60% Warm Sandstone
  CANVAS_BG_LIGHT: '#F1ECE2',
  SURFACE_WHEAT: '#F5F1E8',    // 20% Light Wheat Surface
  DARK_CYPRESS: '#1B2E24',     // 10% Dark Cypress Slate
  NEON_AMBER: '#F59E0B',       // 5% Vibrant Neon Amber
  VIVID_EMERALD: '#10B981',    // 5% Vivid Emerald
};

// Karnataka Geo Boundary Points (Normalized 0..1 bounding box)
const KARNATAKA_MAP_POLYGON = [
  { x: 0.65, y: 0.05 }, // Bidar
  { x: 0.75, y: 0.12 }, // Aurad
  { x: 0.70, y: 0.22 }, // Kalaburagi
  { x: 0.82, y: 0.32 }, // Yadgir
  { x: 0.78, y: 0.42 }, // Raichur
  { x: 0.72, y: 0.50 }, // Ballari
  { x: 0.80, y: 0.68 }, // Chikkaballapura
  { x: 0.85, y: 0.75 }, // Kolar
  { x: 0.78, y: 0.82 }, // Bengaluru Urban
  { x: 0.70, y: 0.95 }, // Chamarajanagar (South tip)
  { x: 0.55, y: 0.90 }, // Mysuru
  { x: 0.42, y: 0.85 }, // Kodagu
  { x: 0.32, y: 0.75 }, // Dakshina Kannada (Mangaluru)
  { x: 0.28, y: 0.62 }, // Udupi
  { x: 0.22, y: 0.48 }, // Uttara Kannada (Karwar)
  { x: 0.25, y: 0.32 }, // Belagavi (West)
  { x: 0.38, y: 0.20 }, // Bagalkote
  { x: 0.50, y: 0.12 }, // Vijayapura
  { x: 0.65, y: 0.05 }  // Back to Bidar
];

// Key District Nodes
const DISTRICT_NODES = [
  { name: 'BENGALURU', x: 0.75, y: 0.80, code: 'KA-01', threat: 'HIGH', cases: '24,500' },
  { name: 'MYSURU', x: 0.58, y: 0.88, code: 'KA-09', threat: 'MED', cases: '12,400' },
  { name: 'BELAGAVI', x: 0.32, y: 0.28, code: 'KA-22', threat: 'MED', cases: '14,800' },
  { name: 'KALABURAGI', x: 0.68, y: 0.22, code: 'KA-32', threat: 'CRIT', cases: '18,200' },
  { name: 'MANGALURU', x: 0.33, y: 0.73, code: 'KA-19', threat: 'HIGH', cases: '11,900' },
  { name: 'HUBBALLI-DHARWAD', x: 0.38, y: 0.38, code: 'KA-25', threat: 'MED', cases: '9,800' },
  { name: 'BALLARI', x: 0.68, y: 0.48, code: 'KA-34', threat: 'MED', cases: '8,400' },
  { name: 'SHIVAMOGGA', x: 0.44, y: 0.58, code: 'KA-14', threat: 'LOW', cases: '5,200' },
  { name: 'TUMAKURU', x: 0.64, y: 0.72, code: 'KA-06', threat: 'MED', cases: '7,100' },
  { name: 'DAVANAGERE', x: 0.50, y: 0.48, code: 'KA-17', threat: 'LOW', cases: '6,300' },
  { name: 'BIDAR', x: 0.67, y: 0.08, code: 'KA-38', threat: 'MED', cases: '4,900' },
  { name: 'KOLAR (KGF)', x: 0.83, y: 0.77, code: 'KA-08', threat: 'HIGH', cases: '9,300' }
];

export class DrishtiAnimationEngine {
  constructor(canvas, onReady) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onReady = onReady;

    // Load Karnataka State Police Emblem
    this.emblemImage = new Image();
    this.emblemLoaded = false;
    this.emblemImage.src = emblemImgSrc;
    this.emblemImage.onload = () => {
      this.emblemLoaded = true;
    };

    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;

    // Timing & Phase Management
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.rafId = null;
    this.isDestroyed = false;

    // Stage definition:
    // 0: RADAR SWEEP & SCATTERED NODES (0 to 3.2s)
    // 1: FOCUS & IRIS APERTURE CONVERGENCE (3.2s to 5.6s)
    // 2: EMBLEM REVEAL & GANDABERUNDA (5.6s to 8.2s)
    // 3: FULL HUD OPERATIONAL STEADY STATE (8.2s+)
    this.stage = 0;

    // Radar & Iris Parameters
    this.radarAngle = 0;
    this.radarSpeed = 0.022;
    this.radarPulseRadius = 0;
    this.irisRadius = 240;
    this.irisRotation = 0;
    this.apertureBlades = 8;
    this.apertureOpenRatio = 0;

    // Typewriter Text Elements (Exact Wording Layout)
    this.kannadaText = "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್";
    this.kspText = "KSP ";
    this.drishtiText = "DRISHTI";
    this.subText = "COMMAND CENTER • Multi-Agent Crime Intelligence & Strategic RAG";

    this.displayedKannada = "";
    this.displayedKsp = "";
    this.displayedDrishti = "";
    this.displayedSub = "";

    // Particle Swarm for Data Nodes & Convergence
    this.particles = [];
    this.initParticles(110);

    // Grid coordinates
    this.karnatakaMapScale = 1;
    this.centerX = 0;
    this.centerY = 0;

    this.resize();
    this.bindEvents();
    this.start();
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 450;
      this.particles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 2.5 + 1.2,
        alpha: Math.random() * 0.6 + 0.25,
        baseAlpha: Math.random() * 0.6 + 0.25,
        color: i % 4 === 0 ? COLOR.NEON_AMBER : (i % 2 === 0 ? COLOR.VIVID_EMERALD : COLOR.DARK_CYPRESS),
        angle: angle,
        dist: dist
      });
    }
  }

  resize() {
    const parent = this.canvas.parentElement || document.body;
    this.width = parent.clientWidth || window.innerWidth;
    this.height = parent.clientHeight || window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    this.centerX = this.width / 2;
    this.centerY = this.height * 0.36;

    const minDim = Math.min(this.width, this.height);
    this.karnatakaMapScale = Math.min(minDim * 0.70, 560);
    this.baseIrisRadius = Math.min(minDim * 0.20, 155);
  }

  bindEvents() {
    this.handleResize = () => this.resize();
    window.addEventListener('resize', this.handleResize);

    this.handlePointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
  }

  start() {
    const loop = (timestamp) => {
      if (this.isDestroyed) return;
      this.elapsedTime = (timestamp - this.startTime) / 1000;
      this.update();
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  update() {
    const t = this.elapsedTime;

    // Stage Sequencing
    if (t < 3.2) {
      this.stage = 0; // Stage 1: Radar Sweep & Scattered Nodes
    } else if (t < 5.6) {
      this.stage = 1; // Stage 2: Iris Convergence & Focus Lens
    } else if (t < 8.2) {
      this.stage = 2; // Stage 3: Emblem Reveal & Typewriter Scan
    } else {
      this.stage = 3; // Stage 4: Steady Tactical HUD
    }

    // 1. Radar Sweep
    this.radarAngle += this.radarSpeed;
    if (this.radarAngle >= Math.PI * 2) {
      this.radarAngle -= Math.PI * 2;
    }
    this.radarPulseRadius = ((t * 110) % (this.karnatakaMapScale * 0.68));

    // 2. Iris Aperture Transition
    if (this.stage === 0) {
      this.apertureOpenRatio = 0.05 + Math.sin(t * 3) * 0.03;
      this.irisRotation += 0.015;
    } else if (this.stage === 1) {
      const progress = (t - 3.2) / 2.4;
      this.irisRotation += 0.04 * (1 - progress) + 0.018;
      this.apertureOpenRatio = 0.08 + Math.sin(progress * Math.PI * 6) * 0.1 * (1 - progress) + (progress * 0.35);
    } else if (this.stage === 2) {
      const progress = Math.min(1, (t - 5.6) / 0.95);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.apertureOpenRatio = 0.35 + ease * 0.65;
      this.irisRotation += 0.008;
    } else {
      this.apertureOpenRatio = 1.0;
      this.irisRotation += 0.004;
    }

    // 3. Particles Dynamics
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (this.stage === 0) {
        p.x += p.vx;
        p.y += p.vy;

        const pAngle = Math.atan2(p.y, p.x);
        let normalizedAngle = pAngle < 0 ? pAngle + Math.PI * 2 : pAngle;
        let angleDiff = Math.abs(normalizedAngle - this.radarAngle);
        if (angleDiff < 0.25 || angleDiff > Math.PI * 2 - 0.25) {
          p.alpha = Math.min(1.0, p.alpha + 0.45);
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.04;
        }

      } else if (this.stage === 1) {
        const progress = (t - 3.2) / 2.4;
        const targetRadius = this.baseIrisRadius * (0.8 + 0.4 * (1 - progress));
        const currentRadius = Math.sqrt(p.x * p.x + p.y * p.y);
        const pullFactor = 0.06 + progress * 0.08;

        const targetX = (p.x / (currentRadius || 1)) * targetRadius;
        const targetY = (p.y / (currentRadius || 1)) * targetRadius;

        p.x += (targetX - p.x) * pullFactor;
        p.y += (targetY - p.y) * pullFactor;
        p.alpha = 0.6 + 0.4 * Math.sin(t * 8 + i);

      } else {
        p.angle += 0.005 * (i % 2 === 0 ? 1 : -1);
        const radius = this.baseIrisRadius * (1.15 + (i % 5) * 0.12);
        p.x = Math.cos(p.angle) * radius;
        p.y = Math.sin(p.angle) * radius;
        p.alpha = 0.4 + 0.3 * Math.sin(t * 2 + i);
      }
    }

    // 4. Typewriter text scanning (Exact Sequence)
    if (this.stage >= 2) {
      const textElapsed = t - 5.6;
      if (textElapsed > 0) {
        // Line 1: Kannada Subtitle
        const kChars = Math.min(this.kannadaText.length, Math.floor(textElapsed * 24));
        this.displayedKannada = this.kannadaText.substring(0, kChars);

        // Line 2: KSP DRISHTI (Large Main Title)
        if (textElapsed > 0.5) {
          const fullMain = this.kspText + this.drishtiText;
          const mChars = Math.min(fullMain.length, Math.floor((textElapsed - 0.5) * 28));
          const displayedMain = fullMain.substring(0, mChars);
          if (displayedMain.length <= this.kspText.length) {
            this.displayedKsp = displayedMain;
            this.displayedDrishti = "";
          } else {
            this.displayedKsp = this.kspText;
            this.displayedDrishti = displayedMain.substring(this.kspText.length);
          }
        }

        // Line 3: Bottom Subtitle
        if (textElapsed > 1.5) {
          const subChars = Math.min(this.subText.length, Math.floor((textElapsed - 1.5) * 36));
          this.displayedSub = this.subText.substring(0, subChars);
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = this.centerX;
    const cy = this.centerY;

    // ── 1. 60% #EAE5D9 (WARM SANDSTONE CANVAS BACKGROUND) ──
    ctx.clearRect(0, 0, w, h);

    const bgGradient = ctx.createRadialGradient(cx, cy, 60, cx, cy, Math.max(w, h) * 0.85);
    bgGradient.addColorStop(0, COLOR.CANVAS_BG_LIGHT); // Soft Khaki Center
    bgGradient.addColorStop(0.65, COLOR.CANVAS_BG);     // 60% Warm Sandstone
    bgGradient.addColorStop(1, '#DFD9CC');             // Tactical perimeter shade
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // ── 2. TACTICAL HUD MATRIX GRID (10% Dark Cypress Slate lines) ──
    this.drawTacticalGrid(ctx, w, h, cx, cy);

    // ── 3. 20% #F5F1E8 LIGHT WHEAT KARNATAKA STATE MAP ──
    this.drawKarnatakaStateMap(ctx, cx, cy);

    // ── 4. RADAR SWEEP BEAM & RANGE RINGS (Emerald & Dark Cypress) ──
    this.drawRadarSweepAndRings(ctx, cx, cy);

    // ── 5. 5% #10B981 VIVID EMERALD & #F59E0B DATA NODES ──
    this.drawDataNodesAndTriangulation(ctx, cx, cy);

    // ── 6. 8 OFFICIAL POLICE INTELLIGENCE ORBITAL MODULES ──
    this.drawPoliceIntelligenceOrbitalNodes(ctx, cx, cy);

    // ── 7. KARNATAKA STATE EMBLEM REVEAL (5% Neon Amber Halo) ──
    if (this.stage >= 2) {
      this.drawKarnatakaEmblem(ctx, cx, cy);
    }

    // ── 8. 10% #1B2E24 DARK CYPRESS SLATE HUD TELEMETRY & BRACKETS ──
    this.drawHUDTelemetryAndBrackets(ctx, w, h, cx, cy);

    // ── 9. SUBTLE WARM SCANLINES ──
    this.drawScanlines(ctx, w, h);
  }

  drawTacticalGrid(ctx, w, h, cx, cy) {
    ctx.save();
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.06)'; // 10% Dark Cypress Slate faint grid
    ctx.lineWidth = 1;

    const gridSize = 45;
    const startX = cx % gridSize;
    const startY = cy % gridSize;

    for (let x = startX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = startY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Subtle Concentric polar circles
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.05)';
    for (let r = 80; r < Math.max(w, h); r += 90) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawKarnatakaStateMap(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const scale = this.karnatakaMapScale;
    const offsetX = -scale * 0.52;
    const offsetY = -scale * 0.48;

    // 20% #F5F1E8 (Light Wheat Surface) Map Fill
    ctx.beginPath();
    for (let i = 0; i < KARNATAKA_MAP_POLYGON.length; i++) {
      const pt = KARNATAKA_MAP_POLYGON[i];
      const px = offsetX + pt.x * scale;
      const py = offsetY + pt.y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = 'rgba(245, 241, 232, 0.85)'; // 20% Light Wheat Surface
    ctx.fill();

    // 10% #1B2E24 (Dark Cypress Slate) Map Border
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Internal district division lines
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < DISTRICT_NODES.length; i++) {
      for (let j = i + 1; j < DISTRICT_NODES.length; j++) {
        const d1 = DISTRICT_NODES[i];
        const d2 = DISTRICT_NODES[j];
        const dist = Math.hypot(d1.x - d2.x, d1.y - d2.y);
        if (dist < 0.28) {
          ctx.beginPath();
          ctx.moveTo(offsetX + d1.x * scale, offsetY + d1.y * scale);
          ctx.lineTo(offsetX + d2.x * scale, offsetY + d2.y * scale);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawRadarSweepAndRings(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const maxRadius = this.karnatakaMapScale * 0.62;

    // 1. Subtle, Soft Government Intelligence Radar Sweep
    const sweepAngle = 0.45;
    ctx.save();
    ctx.rotate(this.radarAngle);

    const sweepGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
    sweepGradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    sweepGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)');
    sweepGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxRadius, -sweepAngle, 0);
    ctx.closePath();
    ctx.fillStyle = sweepGradient;
    ctx.fill();

    // Soft leading sweep line
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.40)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(maxRadius, 0);
    ctx.stroke();
    ctx.restore();

    // 2. Official Government GIS Range Rings
    const ringDistances = [
      { r: maxRadius * 0.38, label: 'DISTRICT BEAT RANGE' },
      { r: maxRadius * 0.68, label: 'DIVISION COMMAND PERIMETER' },
      { r: maxRadius * 0.96, label: 'STATE CRIME RECORDS BUREAU (SCRB)' }
    ];

    ctx.font = '600 9px "Outfit", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(27, 46, 36, 0.45)';
    ctx.textAlign = 'left';

    ringDistances.forEach((ring) => {
      ctx.strokeStyle = 'rgba(27, 46, 36, 0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillText(ring.label, ring.r + 6, -4);
    });

    ctx.restore();
  }

  drawDataNodesAndTriangulation(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const scale = this.karnatakaMapScale;
    const offsetX = -scale * 0.52;
    const offsetY = -scale * 0.48;

    // 1. Draw Network Constellation Triangulation Lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, this.particles.length); j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < 90 && p1.alpha > 0.3 && p2.alpha > 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // 2. Draw Subtle Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * 0.75;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Draw Sub-Division & District City Tags
    DISTRICT_NODES.forEach((d) => {
      const dx = offsetX + d.x * scale;
      const dy = offsetY + d.y * scale;

      ctx.save();
      ctx.globalAlpha = 0.85;

      // Ping ring
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(dx, dy, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = COLOR.VIVID_EMERALD;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // District label badge
      const labelText = `${d.name}`;
      ctx.font = '600 9.5px "Outfit", "Segoe UI", sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      const pillX = dx + 7;
      const pillY = dy - 7;
      const pillW = textWidth + 8;
      const pillH = 14;

      ctx.fillStyle = 'rgba(245, 241, 232, 0.88)';
      ctx.strokeStyle = 'rgba(27, 46, 36, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLOR.DARK_CYPRESS;
      ctx.fillText(labelText, pillX + 4, pillY + 10.5);

      ctx.restore();
    });

    ctx.restore();
  }

  drawPoliceIntelligenceOrbitalNodes(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const baseR = this.baseIrisRadius;
    const orbitRadius = baseR * 1.58;
    const t = this.elapsedTime;

    // 1. Luminous Pure White Central Emblem Base Plate (Enhanced visibility during rotation process)
    const hubRadius = baseR * 0.95;

    // Soft elevation drop shadow for the white circular space
    ctx.save();
    ctx.shadowColor = 'rgba(27, 46, 36, 0.16)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp, official outer border rim around the white round space
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.stroke();

    // ── KARNATAKA GEO BOUNDARY POINTS & MESH (Prominent inside the round space during rotation) ──
    const emblemProgress = this.stage >= 2 ? Math.min(1, (t - 5.6) / 0.95) : 0;
    const geoAlpha = Math.max(0, 1 - emblemProgress * 1.35);

    if (geoAlpha > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, hubRadius - 1.5, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = geoAlpha;

      const scale = this.karnatakaMapScale;
      const offsetX = -scale * 0.52;
      const offsetY = -scale * 0.48;

      // 1. Soft Wheat Map Silhouette fill inside the central round space
      ctx.beginPath();
      for (let i = 0; i < KARNATAKA_MAP_POLYGON.length; i++) {
        const pt = KARNATAKA_MAP_POLYGON[i];
        const px = offsetX + pt.x * scale;
        const py = offsetY + pt.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 241, 232, 0.92)';
      ctx.fill();

      // 2. High-Visibility Boundary Stroke with tactical dashed line
      ctx.strokeStyle = 'rgba(27, 46, 36, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 3. District Division Internal Mesh Lines
      ctx.strokeStyle = 'rgba(27, 46, 36, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < DISTRICT_NODES.length; i++) {
        for (let j = i + 1; j < DISTRICT_NODES.length; j++) {
          const d1 = DISTRICT_NODES[i];
          const d2 = DISTRICT_NODES[j];
          const dist = Math.hypot(d1.x - d2.x, d1.y - d2.y);
          if (dist < 0.28) {
            ctx.beginPath();
            ctx.moveTo(offsetX + d1.x * scale, offsetY + d1.y * scale);
            ctx.lineTo(offsetX + d2.x * scale, offsetY + d2.y * scale);
            ctx.stroke();
          }
        }
      }

      // 4. Prominently Highlighted Karnataka Geo Boundary Points
      for (let i = 0; i < KARNATAKA_MAP_POLYGON.length; i++) {
        const pt = KARNATAKA_MAP_POLYGON[i];
        const px = offsetX + pt.x * scale;
        const py = offsetY + pt.y * scale;

        // Outer beacon ping on boundary point
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Solid Geo point dot
        ctx.fillStyle = i % 3 === 0 ? COLOR.NEON_AMBER : COLOR.DARK_CYPRESS;
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Active Key District Nodes within the circular space
      DISTRICT_NODES.forEach((d) => {
        const dx = offsetX + d.x * scale;
        const dy = offsetY + d.y * scale;

        // Emerald Core Ping
        ctx.fillStyle = COLOR.VIVID_EMERALD;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Beacon Wave
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, 6.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 6. Subtle Rotating Calibration Ticks inside round space (Stage 0 & 1)
      ctx.save();
      ctx.rotate(this.irisRotation * 0.6);
      ctx.strokeStyle = 'rgba(27, 46, 36, 0.35)';
      ctx.lineWidth = 1.4;
      const tickLen = 7;
      for (let i = 0; i < 4; i++) {
        const tickAngle = (i * Math.PI) / 2;
        const tx1 = Math.cos(tickAngle) * (hubRadius - 3);
        const ty1 = Math.sin(tickAngle) * (hubRadius - 3);
        const tx2 = Math.cos(tickAngle) * (hubRadius - tickLen - 3);
        const ty2 = Math.sin(tickAngle) * (hubRadius - tickLen - 3);
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
      }
      ctx.restore();

      // 7. Subtle GIS Coordinates Watermark
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.fillStyle = 'rgba(27, 46, 36, 0.70)';
      ctx.textAlign = 'center';
      ctx.fillText('KARNATAKA GIS // 12.97°N 77.59°E', 0, hubRadius - 12);

      ctx.restore();
    }

    // 2. Official Security Intermediate Ring (Wheat/Sandstone track)
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 1.30, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Orbital Dashed Track linking the 8 Intelligence Modules
    ctx.strokeStyle = 'rgba(27, 46, 36, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Flowing Data Pulse: KSP Data → Catalyst Cloud → AI/RAG → Verified Intelligence
    const flowAngle = (t * 0.35) % (Math.PI * 2);
    const flowX = Math.cos(flowAngle) * orbitRadius;
    const flowY = Math.sin(flowAngle) * orbitRadius;
    ctx.fillStyle = COLOR.NEON_AMBER;
    ctx.shadowColor = COLOR.NEON_AMBER;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(flowX, flowY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. 8 Official Intelligence Modules
    const modules = [
      { id: 'security', label: 'KSP SECURITY', symbol: 'shield' },
      { id: 'analytics', label: 'CRIME ANALYTICS', symbol: 'chart' },
      { id: 'gis', label: 'GIS MAPPING', symbol: 'pin' },
      { id: 'fir_rag', label: 'FIR / RAG', symbol: 'doc' },
      { id: 'ai', label: 'AI ASSISTANT', symbol: 'ai' },
      { id: 'investigation', label: 'INVESTIGATION', symbol: 'search' },
      { id: 'catalyst', label: 'ZOHO CATALYST', symbol: 'cloud' },
      { id: 'protection', label: 'DATA PROTECTION', symbol: 'lock' },
    ];

    const count = modules.length;
    for (let i = 0; i < count; i++) {
      const mod = modules[i];
      const angle = (i * Math.PI * 2) / count - Math.PI / 2 + (this.irisRotation * 0.08);
      const nx = Math.cos(angle) * orbitRadius;
      const ny = Math.sin(angle) * orbitRadius;

      // Radar Sweep Collision Detection (subtle illumination)
      let angleDiff = Math.abs(angle - this.radarAngle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
      const isSwept = angleDiff < 0.42;

      const nodeRadius = 15;

      // Node Outer Halo on active radar sweep
      if (isSwept) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.20)';
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius + 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node Circle Background
      ctx.fillStyle = isSwept ? '#FFFFFF' : 'rgba(245, 241, 232, 0.96)';
      ctx.strokeStyle = isSwept ? COLOR.NEON_AMBER : 'rgba(27, 46, 36, 0.30)';
      ctx.lineWidth = isSwept ? 2 : 1.4;
      if (isSwept) {
        ctx.shadowColor = COLOR.NEON_AMBER;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Vector Icon Symbol
      const iconColor = isSwept ? COLOR.NEON_AMBER : COLOR.DARK_CYPRESS;
      this.drawModuleIcon(ctx, nx, ny, mod.symbol, iconColor);

      // Node Label Text Badge
      ctx.font = 'bold 8.8px "Outfit", "Segoe UI", sans-serif';
      const textW = ctx.measureText(mod.label).width;
      const badgeW = textW + 10;
      const badgeH = 15;
      
      const labelDist = orbitRadius + (ny >= 0 ? 22 : -22);
      const labelX = Math.cos(angle) * labelDist;
      const labelY = Math.sin(angle) * labelDist;

      // Label background pill
      ctx.fillStyle = 'rgba(245, 241, 232, 0.94)';
      ctx.strokeStyle = isSwept ? 'rgba(245, 158, 11, 0.6)' : 'rgba(27, 46, 36, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(labelX - badgeW / 2, labelY - badgeH / 2, badgeW, badgeH, 3.5);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.fillStyle = isSwept ? '#92400E' : COLOR.DARK_CYPRESS;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mod.label, labelX, labelY);
      ctx.textBaseline = 'alphabetic';
    }

    ctx.restore();
  }

  drawModuleIcon(ctx, x, y, type, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (type) {
      case 'shield': // 🛡️ KSP Security
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 5, y - 3);
        ctx.lineTo(x + 5, y + 2);
        ctx.quadraticCurveTo(x, y + 7, x, y + 7);
        ctx.quadraticCurveTo(x, y + 7, x - 5, y + 2);
        ctx.lineTo(x - 5, y - 3);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'chart': // 📊 Crime Analytics
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 5);
        ctx.lineTo(x - 5, y + 1);
        ctx.moveTo(x - 1, y + 5);
        ctx.lineTo(x - 1, y - 2);
        ctx.moveTo(x + 3, y + 5);
        ctx.lineTo(x + 3, y - 5);
        ctx.stroke();
        break;

      case 'pin': // 📍 GIS Mapping
        ctx.beginPath();
        ctx.arc(x, y - 2, 3.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + 1.2);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
        break;

      case 'doc': // 📄 FIR / RAG
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 6);
        ctx.lineTo(x + 2, y - 6);
        ctx.lineTo(x + 5, y - 3);
        ctx.lineTo(x + 5, y + 6);
        ctx.lineTo(x - 4, y + 6);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x + 2, y);
        ctx.moveTo(x - 2, y + 3);
        ctx.lineTo(x + 2, y + 3);
        ctx.stroke();
        break;

      case 'ai': // 🤖 AI Assistant (Microchip core)
        ctx.beginPath();
        ctx.rect(x - 4, y - 4, 8, 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 1); ctx.lineTo(x - 6, y - 1);
        ctx.moveTo(x - 4, y + 1); ctx.lineTo(x - 6, y + 1);
        ctx.moveTo(x + 4, y - 1); ctx.lineTo(x + 6, y - 1);
        ctx.moveTo(x + 4, y + 1); ctx.lineTo(x + 6, y + 1);
        ctx.stroke();
        break;

      case 'search': // 🔎 Investigation
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, 3.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 6, y + 6);
        ctx.stroke();
        break;

      case 'cloud': // ☁️ Zoho Catalyst
        ctx.beginPath();
        ctx.arc(x - 2, y + 1, 3, 0, Math.PI * 2);
        ctx.arc(x + 2, y, 3.5, 0, Math.PI * 2);
        ctx.arc(x + 4, y + 2, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'lock': // 🔐 Data Protection
        ctx.beginPath();
        ctx.arc(x, y - 2, 3, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(x - 4, y - 2, 8, 7);
        ctx.stroke();
        break;

      default:
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  drawKarnatakaEmblem(ctx, cx, cy) {
    if (!this.emblemLoaded) return;

    ctx.save();
    ctx.translate(cx, cy);

    const t = this.elapsedTime;
    const rawProgress = Math.min(1, Math.max(0, (t - 5.6) / 0.95));
    const ease = 1 - Math.pow(1 - rawProgress, 3); // snappy cubic ease-out

    const scale = Math.min(1, 0.72 + ease * 0.28);
    const alpha = Math.min(1, ease * 1.35);
    ctx.globalAlpha = alpha;

    const emblemSize = this.baseIrisRadius * 1.42 * scale;

    // 1. 5% #F59E0B Vibrant Neon Amber Radiant Glow & 5% Emerald Halo
    const glowGradient = ctx.createRadialGradient(0, 0, emblemSize * 0.2, 0, 0, emblemSize * 0.95);
    glowGradient.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
    glowGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.18)');
    glowGradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, emblemSize * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // 2. Circular 20% #F5F1E8 Light Wheat Base Plate
    ctx.fillStyle = COLOR.SURFACE_WHEAT;
    ctx.beginPath();
    ctx.arc(0, 0, emblemSize * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // 3. Circular Clip Mask for the Emblem
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, emblemSize * 0.62, 0, Math.PI * 2);
    ctx.clip();

    // Draw Karnataka State Police Emblem (Gandaberunda / Sharabha / Lions)
    ctx.drawImage(
      this.emblemImage,
      -emblemSize * 0.65,
      -emblemSize * 0.65,
      emblemSize * 1.3,
      emblemSize * 1.3
    );

    // Subtle holographic scan sweep across emblem
    const sweepY = -emblemSize * 0.65 + ((t * 110) % (emblemSize * 1.3));
    const sweepGrad = ctx.createLinearGradient(0, sweepY - 14, 0, sweepY + 14);
    sweepGrad.addColorStop(0, 'rgba(245, 158, 11, 0.0)');
    sweepGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
    sweepGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(-emblemSize * 0.65, sweepY - 14, emblemSize * 1.3, 28);

    ctx.restore();

    // 4. 5% #F59E0B Vibrant Neon Amber Outer Security Rim
    ctx.strokeStyle = COLOR.NEON_AMBER;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = COLOR.NEON_AMBER;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, emblemSize * 0.63, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawHUDTelemetryAndBrackets(ctx, w, h, cx, cy) {
    ctx.save();

    // Corner HUD Brackets (10% #1B2E24 Dark Cypress Slate)
    const pad = 26;
    const bLen = 30;

    ctx.strokeStyle = COLOR.DARK_CYPRESS;
    ctx.lineWidth = 2;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(pad, pad + bLen);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + bLen, pad);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(w - pad - bLen, pad);
    ctx.lineTo(w - pad, pad);
    ctx.lineTo(w - pad, pad + bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(pad, h - pad - bLen);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(pad + bLen, h - pad);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(w - pad - bLen, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(w - pad, h - pad - bLen);
    ctx.stroke();

    ctx.restore();
  }

  drawTitleText(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const emblemBottom = this.baseIrisRadius * 1.15;

    // 1. Line 1: Kannada Subtitle "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್" (Increased font size: 22px bold)
    if (this.displayedKannada) {
      ctx.font = 'bold 22px "Noto Sans Kannada", "Segoe UI", "Tunga", "Arial", sans-serif';
      ctx.fillStyle = COLOR.NEON_AMBER; // 5% Neon Amber
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillText(this.displayedKannada, 0, emblemBottom + 44);
    }

    // 2. Line 2: Large Prominent Main Title "KSP DRISHTI" (Increased font size: 48px 900 heavy weight)
    if (this.displayedKsp || this.displayedDrishti) {
      const mainFont = '900 48px "Outfit", "Segoe UI", sans-serif';
      ctx.font = mainFont;

      // Calculate exact text widths for centering
      const kspWidth = ctx.measureText("KSP ").width;
      const drishtiWidth = ctx.measureText("DRISHTI").width;
      const totalWidth = kspWidth + drishtiWidth;
      const startX = -totalWidth / 2;

      const cursor = Math.floor(this.elapsedTime * 4) % 2 === 0 ? '█' : '';
      const isTyping = (this.displayedKsp + this.displayedDrishti).length < (this.kspText + this.drishtiText).length;

      // Draw "KSP " in Dark Cypress Slate #1B2E24
      ctx.textAlign = 'left';
      ctx.fillStyle = COLOR.DARK_CYPRESS;
      ctx.shadowBlur = 0;
      ctx.fillText(this.displayedKsp, startX, emblemBottom + 92);

      // Draw "DRISHTI" in Vibrant Neon Amber #F59E0B with enhanced radiant glow
      if (this.displayedDrishti) {
        ctx.fillStyle = COLOR.NEON_AMBER;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.55)';
        ctx.shadowBlur = 14;
        ctx.fillText(this.displayedDrishti + (isTyping ? cursor : ''), startX + kspWidth, emblemBottom + 92);
      } else if (isTyping) {
        ctx.fillStyle = COLOR.DARK_CYPRESS;
        ctx.fillText(cursor, startX + ctx.measureText(this.displayedKsp).width, emblemBottom + 92);
      }
    }

    // 3. Line 3: "COMMAND CENTER • Multi-Agent Crime Intelligence & Strategic RAG" (13.5px bold)
    if (this.displayedSub) {
      ctx.font = 'bold 13.5px "Courier New", "Segoe UI Mono", monospace';
      ctx.fillStyle = COLOR.DARK_CYPRESS;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(this.displayedSub, 0, emblemBottom + 124);
    }

    ctx.restore();
  }

  drawScanlines(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(27, 46, 36, 0.025)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }

  destroy() {
    this.isDestroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
  }
}
