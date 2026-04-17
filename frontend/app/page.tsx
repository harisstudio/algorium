"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import Magnetic from "@/components/Magnetic";

// ── Warp-Speed Starfield (scroll-reactive) ──
const Contact3DAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = 600;
    let h = canvas.height = 600;
    
    // Group 1: Planet Points
    const planetPoints: { x: number, y: number, z: number, color: string }[] = [];
    const planetCount = 400;
    const planetRadius = 110;
    for (let i = 0; i < planetCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / planetCount);
        const theta = Math.sqrt(planetCount * Math.PI) * phi;
        planetPoints.push({
            x: planetRadius * Math.cos(theta) * Math.sin(phi),
            y: planetRadius * Math.sin(theta) * Math.sin(phi),
            z: planetRadius * Math.cos(phi),
            color: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`
        });
    }

    // Group 2: Saturn Rings
    const ringPoints: { x: number, y: number, z: number }[] = [];
    const ringCount = 350;
    for (let i = 0; i < ringCount; i++) {
        const r = 160 + Math.random() * 70;
        const angle = Math.random() * Math.PI * 2;
        ringPoints.push({
            x: Math.cos(angle) * r,
            y: (Math.random() - 0.5) * 6, // Thin ring depth
            z: Math.sin(angle) * r
        });
    }

    // Group 3: Spacecrafts
    const ships = [
        { angle: 0, r: 260, speed: 0.015, offsetZ: 30 },
        { angle: Math.PI, r: 300, speed: 0.01, offsetZ: -40 },
        { angle: Math.PI / 2, r: 220, speed: 0.02, offsetZ: 0 }
    ];

    let rotX = 0.5; // Tilted view
    let rotY = 0;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      rotY += 0.005;

      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Draw All items with depth sorting
      const all: any[] = [];

      planetPoints.forEach(p => {
        let x = p.x; let y = p.y; let z = p.z;
        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
        all.push({ x: x1, y: y2, z: z2, type: 'planet', color: p.color });
      });

      ringPoints.forEach(p => {
        let x = p.x; let y = p.y; let z = p.z;
        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
        all.push({ x: x1, y: y2, z: z2, type: 'ring' });
      });

      ships.forEach(s => {
        s.angle += s.speed;
        let x = Math.cos(s.angle) * s.r;
        let y = s.offsetZ;
        let z = Math.sin(s.angle) * s.r;

        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
        all.push({ x: x1, y: y2, z: z2, type: 'ship' });
      });

      all.sort((a, b) => b.z - a.z);

      all.forEach(p => {
        const perspective = 600 / (600 + p.z);
        const px = p.x * perspective;
        const py = p.y * perspective;
        const alpha = (p.z + 200) / 400;

        ctx.beginPath();
        if (p.type === 'ship') {
            ctx.arc(px, py, 4 * perspective, 0, Math.PI * 2);
            ctx.fillStyle = '#FE532D';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FE532D';
        } else if (p.type === 'ring') {
            ctx.arc(px, py, 1 * perspective, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + alpha * 0.25})`;
            ctx.shadowBlur = 0;
        } else {
            ctx.arc(px, py, 1.5 * perspective, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '600px' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          aspectRatio: '1',
          maskImage: 'radial-gradient(circle, black 50%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 80%)'
        }} 
      />
    </div>
  );
};

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollYRef = useRef(0);
  const prevScrollRef = useRef(0);
  const starsRef = useRef<{x: number, y: number, z: number, size: number, opacity: number}[]>([]);
  const frameRef = useRef<number>(0);
  const warpRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + 'px';
      canvas.style.height = parent.clientHeight + 'px';
      ctx.scale(dpr, dpr);

      // Init stars
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      starsRef.current = Array.from({ length: 180 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 3 + 0.5,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.5 + 0.15,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const draw = () => {
      const parent = canvas.parentElement;
      if (!ctx || !parent) { frameRef.current = requestAnimationFrame(draw); return; }
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Calculate scroll delta & smooth warp
      const delta = scrollYRef.current - prevScrollRef.current;
      prevScrollRef.current = scrollYRef.current;
      const targetWarp = Math.min(Math.abs(delta), 80) / 5;
      warpRef.current += (targetWarp - warpRef.current) * 0.12;
      const warp = warpRef.current;

      starsRef.current.forEach(star => {
        // Drift stars based on scroll
        star.y -= delta * star.z * 0.2;
        if (star.y < -30) star.y = h + 30;
        if (star.y > h + 30) star.y = -30;

        // Streak length
        const streak = Math.max(0, warp * star.z * 4);

        // Draw streak line
        if (streak > 1) {
          const grad = ctx.createLinearGradient(star.x, star.y, star.x, star.y - streak);
          grad.addColorStop(0, `rgba(255,255,255,${star.opacity * (0.6 + warp * 0.03)})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = star.size * 0.9;
          ctx.lineCap = 'round';
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x, star.y - streak);
          ctx.stroke();
        }

        // Draw star dot
        const dotOpacity = star.opacity * (0.5 + warp * 0.04);
        const dotSize = star.size * (1 + warp * 0.02);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${Math.min(dotOpacity, 0.9)})`;
        ctx.arc(star.x, star.y, dotSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow on fast scroll
        if (warp > 3) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${dotOpacity * 0.15})`;
          ctx.arc(star.x, star.y, dotSize * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

const ImageSwitcher = () => {
  const images = [
    '/assets/images/porsche_final.png',
    '/assets/images/macintosh_final.png',
    '/assets/images/camera_final.png'
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div style={{ 
      width: '650px', 
      height: '400px', 
      position: 'relative',
      userSelect: 'none',
      pointerEvents: 'none'
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8, y: 30, rotate: -5 }}
          animate={{ 
            opacity: 1, 
            scale: index === 0 ? 1.15 : 1, 
            y: index === 0 ? 20 : 0, 
            rotate: 0 
          }}
          exit={{ opacity: 0, scale: 1.1, y: -30, rotate: 5 }}
          transition={{ 
            duration: 1.5, 
            ease: [0.23, 1, 0.32, 1] 
          }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        >
          <Image 
            src={images[index]} 
            alt="Algorium Collection" 
            fill 
            style={{ objectFit: 'contain' }} 
            priority
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AnalogClock = ({ city, timeZone }: { city: string, timeZone: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(time);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');

  const secondsDeg = (second / 60) * 360;
  const minutesDeg = (minute / 60) * 360 + (second / 60) * 6;
  const hoursDeg = (hour % 12 / 12) * 360 + (minute / 60) * 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        borderRadius: '50%', 
        border: '1.5px solid var(--card-border)', 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--card-bg)',
        boxShadow: '0 2px 12px var(--card-shadow), inset 0 0 0 1px var(--card-border)',
        transition: 'background 0.4s ease'
      }}>
        {/* Hour Indices */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? '1.5px' : '0.8px',
            height: i % 3 === 0 ? '5px' : '3px',
            background: i % 3 === 0 ? 'var(--text-color)' : 'var(--card-border)',
            transform: `rotate(${i * 30}deg) translateY(-26px)`,
            borderRadius: '1px'
          }} />
        ))}
        {/* Hour Hand — thick, short, tapered */}
        <div style={{ 
          position: 'absolute',
          width: '2.5px',
          height: '15px',
          background: 'var(--text-color)',
          bottom: '50%',
          transformOrigin: 'bottom center',
          transform: `rotate(${hoursDeg}deg)`,
          borderRadius: '2px 2px 0 0',
          zIndex: 2
        }} />
        {/* Minute Hand — thinner, longer */}
        <div style={{ 
          position: 'absolute',
          width: '1.5px',
          height: '22px',
          background: 'var(--text-color)',
          bottom: '50%',
          transformOrigin: 'bottom center',
          transform: `rotate(${minutesDeg}deg)`,
          borderRadius: '1.5px 1.5px 0 0',
          zIndex: 2
        }} />
        {/* Second Hand — signature red, with counterweight */}
        <div style={{ 
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `rotate(${secondsDeg}deg)`,
          zIndex: 3
        }}>
          {/* Main needle */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '50%',
            width: '0.8px',
            height: '24px',
            background: '#FE532D',
            transform: 'translateX(-50%)',
          }} />
          {/* Counterweight tail */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '1.5px',
            height: '7px',
            background: '#FE532D',
            transform: 'translateX(-50%)',
            borderRadius: '0 0 1px 1px'
          }} />
        </div>
        {/* Center Pivot — layered like a real watch */}
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FE532D', zIndex: 4, boxShadow: '0 0 0 1px #fff' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.35, margin: 0, fontWeight: 700 }}>{city}</p>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, margin: 0, opacity: 0.7, fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>
          {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </p>
      </div>
    </div>
  );
};


const SpotlightCard = ({ title, desc, tag, col }: any) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const icons: Record<string, React.ReactNode> = {
    s1: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="24" height="28" rx="3" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="14" cy="18" r="5" stroke="#FE532D" strokeWidth="2"/>
        <path d="M2 28L10 22L16 26L24 18" stroke="#FE532D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="30" y="2" width="8" height="8" rx="2" fill="#FE532D"/>
        <rect x="30" y="14" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.2"/>
        <rect x="30" y="20" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.2"/>
        <rect x="30" y="26" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.2"/>
      </svg>
    ),
    s2: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8L20 4L36 8V18C36 28 28 36 20 38C12 36 4 28 4 18V8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M12 20L18 26L28 14" stroke="#FE532D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    s4: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="6" fill="#FE532D"/>
        <path d="M20 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 31V37" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M3 20H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M31 20H37" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 8L12 12" stroke="#FE532D" strokeWidth="2" strokeLinecap="round"/>
        <path d="M28 28L32 32" stroke="#FE532D" strokeWidth="2" strokeLinecap="round"/>
        <path d="M32 8L28 12" stroke="#FE532D" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 28L8 32" stroke="#FE532D" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };

  return (
    <motion.div 
      style={{ 
        gridColumn: col, 
        position: 'relative', 
        overflow: 'hidden', 
        padding: '64px', 
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--card-border)',
        boxShadow: `0 4px 24px var(--card-shadow)`,
        cursor: 'default',
        color: 'var(--text-color)',
        transition: 'background 0.4s ease, border-color 0.4s ease'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, rgba(254,83,45,0.08), transparent 50%)`,
          opacity,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
        {/* Large Icon */}
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'var(--subtle-bg)', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '2.5rem', 
          border: '1px solid var(--card-border)',
        }}>
          {icons[tag] || icons['s1']}
        </div>
        {/* Title */}
        <h3 style={{ 
          fontSize: '1.75rem', 
          fontFamily: 'var(--font-outfit)',
          fontWeight: 700, 
          marginBottom: '1.2rem', 
          lineHeight: 1.15,
          color: 'var(--text-color)',
          letterSpacing: '-0.01em'
        }} dangerouslySetInnerHTML={{ __html: title }} />
        {/* Description */}
        <p style={{ 
          opacity: 0.55, 
          lineHeight: 1.7, 
          fontSize: '1rem',
          fontFamily: 'var(--font-inter)',
          fontWeight: 400
        }}>{desc}</p>
      </div>
    </motion.div>
  );
};


const projects = [
  { id: 'aura', name: 'Aura Luxury', category: 'Brand Identity', year: '2024', color: '#f5f5f7', image: '/projects/aura.png', desc: 'A full-spectrum rebrand for a luxury hospitality group, establishing visual language across 40+ touchpoints.' },
  { id: 'skyline', name: 'Skyline Real Estate', category: 'Creative Direction', year: '2024', color: '#eef2f3', image: '/projects/skyline.png', desc: 'End-to-end creative direction for London\'s fastest growing property platform.' },
  { id: 'neural', name: 'Neural Nexus', category: 'AI Architecture', year: '2023', color: '#f0f4f8', image: '/projects/neural.png', desc: 'Engineering an AI-powered decision engine processing 2M+ data points daily.' },
  { id: 'vertex', name: 'Vertex Capital', category: 'Fintech UX', year: '2023', color: '#f8f9fa', image: '/projects/vertex.png', desc: 'Redesigning the trading experience for 50,000+ active institutional investors.' },
];

const ProjectRow = ({ project, index }: { project: typeof projects[0], index: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%',
        borderBottom: '1px solid var(--divider)',
        position: 'relative',
        cursor: 'pointer',
        padding: '3rem 0',
        zIndex: hovered ? 10 : 1
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3rem' }}>
          <span style={{ 
            fontSize: '1rem', 
            opacity: 0.3, 
            fontFamily: 'var(--font-outfit)',
            fontWeight: 700 
          }}>
            0{index + 1}
          </span>
          <motion.h3
            animate={{ 
              x: hovered ? 30 : 0,
              color: hovered ? '#FE532D' : 'var(--text-color)'
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 6rem)', 
              fontWeight: 800, 
              lineHeight: 1, 
              letterSpacing: '-0.04em', 
              margin: 0, 
              textTransform: 'none' 
            }}
          >
            {project.name}
          </motion.h3>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', textAlign: 'right' }}>
          <span style={{ 
            fontSize: '0.85rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            opacity: 0.4, 
            fontWeight: 600,
            display: 'block' 
          }}>
            {project.category}
          </span>
          <span style={{ 
            fontSize: '0.85rem', 
            opacity: 0.2, 
            fontWeight: 600,
            minWidth: '40px' 
          }}>
            {project.year}
          </span>
        </div>
      </div>

      {/* Floating Reveal Image */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 3 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '300px',
              pointerEvents: 'none',
              zIndex: 0,
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Image 
              src={project.image} 
              alt={project.name} 
              fill 
              style={{ objectFit: 'cover' }} 
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AppleCard = ({ category, title, image }: { category: string, title: string, image: string }) => {
  return (
    <motion.div
      whileHover={{ 
        y: 12, 
        boxShadow: '0 40px 80px rgba(0, 0, 0, 0.1)',
        borderColor: '#FE532D'
      }}
      style={{
        flex: '0 0 320px',
        height: '460px',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s ease'
      }}
    >
      <div style={{ padding: '2.5rem 2rem 1.5rem', zIndex: 2 }}>
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '0.8rem', color: 'var(--text-color)' }}>{category}</p>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-color)', lineHeight: 1.2, maxWidth: '80%' }} dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <div style={{ flex: 1, width: '100%', position: 'relative', padding: '0 1.5rem 1.5rem' }}>
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden', 
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image src={image} alt={title} fill style={{ objectFit: 'cover' }} />
        </div>
      </div>
    </motion.div>
  );
};

const TeamCard = ({ name, role, index }: { name: string, role: string, index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        y: -12,
        backgroundColor: 'var(--subtle-bg)',
        borderColor: '#FE532D'
      }}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        cursor: 'default',
        minHeight: '180px'
      }}
    >
      <p style={{ 
        fontSize: '0.7rem', 
        textTransform: 'uppercase', 
        letterSpacing: '0.25em', 
        opacity: 0.5, 
        color: '#FE532D',
        fontWeight: 700
      }}>
        {role}
      </p>
      <h4 style={{ 
        fontSize: '1.4rem', 
        fontWeight: 800, 
        color: 'var(--text-color)',
        lineHeight: 1.2,
        fontFamily: 'var(--font-outfit)'
      }}>
        {name}
      </h4>
      <div style={{ 
        width: '24px', 
        height: '2px', 
        background: '#FE532D', 
        marginTop: '1rem',
        opacity: 0.3 
      }} />
    </motion.div>
  );
};

const LogoMarquee = () => {
  const logos = [
    { name: 'Apple', icon: '' },
    { name: 'Microsoft', icon: 'MSoft' },
    { name: 'WPP', icon: 'WPP' },
    { name: 'Amazon', icon: 'AZN' },
    { name: 'Nike', icon: 'NIKE' },
    { name: 'Tesla', icon: 'TSLA' },
  ];

  const marqueeLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div style={{ marginTop: '10rem', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '6rem 0', overflow: 'hidden', position: 'relative' }}>
      <p style={{ 
        position: 'absolute', 
        top: '1.5rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        fontSize: '0.75rem', 
        textTransform: 'uppercase', 
        letterSpacing: '0.5em', 
        opacity: 0.3,
        fontWeight: 600
      }}>
        Selected Partners
      </p>
      <div style={{ display: 'flex', width: 'max-content' }}>
        <motion.div
          animate={{ x: [0, -1500] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 35,
              ease: "linear",
            },
          }}
          style={{ display: 'flex', gap: '12rem', alignItems: 'center' }}
        >
          {marqueeLogos.map((logo, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '4.5rem',
                fontWeight: 800,
                color: 'var(--text-color)',
                opacity: 1,
                fontFamily: 'var(--font-inter)',
                letterSpacing: '-0.05em',
                userSelect: 'none'
              }}
            >
              {logo.icon}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const AppleStyleCarousel = () => {
  const cards = [
    { category: 'Brand Strategy', title: 'Brand Management <br /> & Consultancy', image: '/projects/silver_ai_logo.png' },
    { category: 'Product Design', title: 'UI & UX Web <br /> and System Design', image: '/projects/circular_ui.png' },
    { category: 'Artificial Intelligence', title: 'AI Solutions <br /> (Visual & Software)', image: '/projects/code_sphere_orange.png' },
    { category: '3D & Industrial', title: '3D Visual & <br /> Industrial Design', image: '/projects/abstract_3d.png' },
  ];

  return (
    <div style={{ marginTop: '5rem', marginLeft: '-6vw', marginRight: '-6vw', paddingLeft: '6vw' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem' }}>Get to know Algorium.</h2>
      <div className="no-scrollbar" style={{ 
        display: 'flex', 
        gap: '2rem', 
        overflowX: 'auto', 
        paddingRight: '6vw',
        paddingBottom: '2rem',
        scrollSnapType: 'x mandatory'
      }}>
        {cards.map((card, i) => (
          <AppleCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" } as any
  };

  const slogans = [
    "Digital Elite",
    "Creativity",
    "Software",
    "Graphic Design",
    "Social Media",
    "E-commerce"
  ];

  const [index, setIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    interests: [] as string[],
    message: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showGame, setShowGame] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestChange = (item: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(item) 
        ? prev.interests.filter(i => i !== item)
        : [...prev.interests, item]
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', company: '', interests: [], message: '' });
      }
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -150]);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 20);
      cursorY.set(e.clientY - 20);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slogans.length);
    }, 2500);

    return () => {
      clearInterval(timer);
    };
  }, [slogans.length]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('EN'); // EN, TR, DE

  const languages = ['EN', 'TR', 'DE'];

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastScrollY.current && currentY > 100) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`container${darkMode ? ' dark' : ''}`} style={{ position: 'relative', background: 'var(--bg-color)', transition: 'background 0.4s ease' }}>

      <div className="grid-background" />
      <motion.div 
        className="custom-cursor" 
        style={{ 
          x: cursorXSpring, 
          y: cursorYSpring 
        }} 
      />
      {/* Navigation — Fixed White Header */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 6vw',
        background: darkMode ? '#111' : '#fff',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: '0 1px 12px rgba(0,0,0,0.03)',
        transition: 'background 0.4s ease, border-color 0.4s ease'
      }}>
        <div style={{ width: '180px' }}>
          <Image 
            src="/new-logo.png" 
            alt="Algorium Logo" 
            width={160} 
            height={55} 
            style={{ objectFit: 'contain', filter: darkMode ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.4s ease' }}
            priority
          />
        </div>

        {/* Search Bar — Centered */}
        <div style={{ 
          flex: 1, 
          maxWidth: '400px', 
          margin: '0 2rem', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input 
            type="text"
            placeholder="Search expertise, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 20px 10px 45px',
              borderRadius: '30px',
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              color: 'var(--text-color)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontFamily: 'var(--font-inter)'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#FE532D')}
            onBlur={(e) => (e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}
          />
          <svg 
            style={{ position: 'absolute', left: '18px', opacity: darkMode ? 0.8 : 0.4, transition: 'color 0.4s ease' }} 
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#FE532D' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          {/* Quick Action Button — GAME */}
          <motion.button
            onClick={() => setShowGame(true)}
            whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute',
              right: '6px',
              background: '#FE532D',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(254, 83, 45, 0.3)',
              userSelect: 'none'
            }}
          >
            GAME
          </motion.button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Language Selector */}
          <div style={{ display: 'flex', gap: '0.4rem', marginRight: '0.5rem' }}>
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: lang === l ? '#FE532D' : 'var(--text-color)',
                  opacity: lang === l ? 1 : 0.4,
                  padding: '4px',
                  transition: 'all 0.3s ease'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--divider)', marginRight: '0.5rem' }} />

          {/* iOS Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              background: darkMode ? '#FE532D' : 'rgba(0,0,0,0.12)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
              padding: 0,
              boxShadow: darkMode ? '0 0 12px rgba(254,83,45,0.4)' : 'none',
            }}
          >
            <motion.div
              animate={{ x: darkMode ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '2px',
                left: '2px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            />
          </button>

          {/* Hamburger — Orange Lines */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }} style={{ display: 'block', width: '24px', height: '2px', background: '#FE532D', borderRadius: '2px' }} />
            <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} style={{ display: 'block', width: '24px', height: '2px', background: '#FE532D', borderRadius: '2px' }} />
            <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }} style={{ display: 'block', width: '24px', height: '2px', background: '#FE532D', borderRadius: '2px' }} />
          </button>
        </div>
      </nav>

      {/* Slide-from-Right Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 98,
                backdropFilter: 'blur(6px)',
              }}
            />
            {/* Panel — from Right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '380px',
                maxWidth: '85vw',
                background: darkMode ? '#111' : '#fff',
                zIndex: 99,
                padding: '8rem 3rem 3rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.1)',
                borderLeft: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                transition: 'background 0.4s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Expertise', href: '#expertise' },
                  { label: 'Portfolio', href: '#work' },
                  { label: 'Team', href: '#team' },
                  { label: 'Process', href: '#process' },
                  { label: 'Contact', href: '#contact' },
                ].map((item, i) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ 
                      fontSize: '2rem', 
                      fontFamily: 'var(--font-outfit)',
                      fontWeight: 700,
                      textDecoration: 'none', 
                      color: darkMode ? '#fff' : '#111',
                      padding: '0.8rem 0',
                      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      transition: 'color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FE532D')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = darkMode ? '#fff' : '#111')}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <a href="mailto:hello@algorium.co.uk" style={{ color: '#FE532D', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>hello@algorium.co.uk</a>
                <p style={{ fontSize: '0.8rem', opacity: 0.4, lineHeight: 1.5, color: darkMode ? '#fff' : '#111' }}>
                  71-75 Shelton Street, Covent Garden<br />London, WC2H 9JQ
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  {['Instagram', 'LinkedIn', 'Behance'].map(s => (
                    <a key={s} href="#" style={{ color: darkMode ? '#fff' : '#111', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>{s}</a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Hero Section */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        paddingTop: '120px', 
        paddingBottom: '60px'
      }}>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "circOut" }}
          style={{ 
            fontSize: 'clamp(3.5rem, 12vw, 8rem)', 
            lineHeight: 0.9, 
            letterSpacing: '-0.04em',
            marginBottom: '1rem'
          }}
        >
          Engineering For <br /> 
          The <span style={{ position: 'relative', display: 'inline-block', verticalAlign: 'baseline' }}>
            {/* Hidden spacer to maintain stable width based on the longest slogan */}
            <span className="serif italic" style={{ opacity: 0, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Graphic Design<span className="accent-dot"></span>
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={slogans[index]}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="serif italic"
                style={{ 
                  color: '#FE532D', 
                  display: 'inline-block',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {slogans[index]}
                <span className="accent-dot"></span>
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '1400px', marginTop: '0.5rem' }}>
          <motion.div {...fadeInUp} style={{ maxWidth: '700px' }}>
            <p style={{ fontSize: '1.85rem', fontWeight: 500, lineHeight: 1.3, marginBottom: '3rem' }}>
              We design and build bespoke digital ecosystems for brands that refuse to settle for the ordinary.
            </p>
            
            {/* Clocks strictly below the description */}
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              <AnalogClock city="Tokyo" timeZone="Asia/Tokyo" />
              <AnalogClock city="Hong Kong" timeZone="Asia/Hong_Kong" />
              <AnalogClock city="Delhi" timeZone="Asia/Kolkata" />
              <AnalogClock city="Istanbul" timeZone="Europe/Istanbul" />
              <AnalogClock city="London" timeZone="Europe/London" />
              <AnalogClock city="New York" timeZone="America/New_York" />
            </div>
          </motion.div>

          {/* Objects Showcase: Floating on the far right */}
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            right: '-4vw', 
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            <ImageSwitcher />
          </div>
        </div>


        <AppleStyleCarousel />
        <LogoMarquee />

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          style={{ 
            position: 'absolute', 
            bottom: '4rem', 
            left: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem' 
          }}
        >
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, writingMode: 'vertical-rl' }}>Explore</span>
          <div className="scroll-indicator-line" />
        </motion.div>
      </section>

      {/* Expertise Section */}
      <section id="services" style={{ padding: '128px 0' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>What We Do</p>
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Expertise</h2>
        </motion.div>
        <div className="line-detail" style={{ opacity: 0.2, marginBottom: '128px' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4rem' }}>
          <SpotlightCard title="Brand & <br />Product Design" desc="Visual identities and user interfaces that command attention and respect." tag="s1" col="1 / 5" />
          <SpotlightCard title="High-End <br />Engineering" desc="Scalable web and mobile applications built with precision and edge-ready speed." tag="s2" col="5 / 9" />
          <SpotlightCard title="AI & <br />Intelligence" desc="Leveraging predictive models and generative AI to create smart, results-driven experiences." tag="s4" col="9 / 13" />
        </div>
      </section>

      {/* Portfolio / Work Section */}
      <section id="work" style={{ padding: '128px 0' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>Our Work</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Selected <span className="serif italic">Works</span></h2>
            <Magnetic><a href="#" className="kota-link" style={{ padding: '8px', display: 'inline-block' }}>View All Projects</a></Magnetic>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {projects.map((project, i) => (
            <ProjectRow key={project.name} project={project} index={i} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ 
        padding: '128px 0', 
        background: 'var(--bg-color)',
        borderTop: '1px solid var(--divider)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4rem' }}>
          <div style={{ gridColumn: '1 / 5' }}>
            <h5 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.8, marginBottom: '1.5rem', color: 'var(--text-color)' }}>Metrics</h5>
            <p style={{ fontSize: '1.25rem', lineHeight: 1.5, opacity: 0.7 }}>
              Our engineering philosophy is built on absolute precision and measurable impact.
            </p>
          </div>
          <div style={{ gridColumn: '6 / 13', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { label: 'Successful Launches', value: '140+' },
              { label: 'Global Partners', value: '45' },
              { label: 'Uptime Reliability', value: '99.9%' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '2rem' }}
              >
                <h4 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.5rem' }}>{stat.value}</h4>
                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" style={{ padding: '128px 0' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>The Human Edge</p>
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Our Team</h2>
        </motion.div>
        
        <div className="team-grid">
          {[
            { name: "Alexander Croft", role: "AI Engineering" },
            { name: "Sarah Sterling", role: "Brand Identity" },
            { name: "Marcus Vane", role: "Cloud Architecture" },
            { name: "James Knight", role: "Creative Direction" },
            { name: "Elena Rossi", role: "Digital Strategy" },
            { name: "Rupert Finch", role: "Growth Lead" },
            { name: "David Chen", role: "Product Design" },
            { name: "Chloe Aris", role: "Data Intelligence" },
            { name: "Victor Thorne", role: "Cybersecurity" },
            { name: "Isobel Vance", role: "Frontend Engineering" }
          ].map((m, i) => (
            <TeamCard key={i} name={m.name} role={m.role} index={i} />
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section style={{ padding: '128px 0', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: '80px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>How We Deliver</p>
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Our Process</h2>
        </motion.div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
          {[
            { step: '01', title: 'Consultancy', desc: 'Deep dive into your brand mission and business objectives.' },
            { step: '02', title: 'Strategy', desc: 'Architecting the digital foundation and user journey.' },
            { step: '03', title: 'Engineering', desc: 'Writing clean, scalable code with edge-ready performance.' },
            { step: '04', title: 'Deployment', desc: 'Seamless launch and continuous performance optimization.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: '48px 32px',
                background: 'var(--subtle-bg)',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '1.5rem', 
                fontSize: '4rem', 
                fontWeight: 900, 
                opacity: 0.15,
                fontFamily: 'var(--font-outfit)',
                color: '#FE532D'
              }}>{item.step}</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-color)' }}>{item.title}</h4>
              <p style={{ fontSize: '0.95rem', opacity: 0.6, lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" style={{ 
        background: '#080810', 
        color: '#fff', 
        marginLeft: '-6vw', 
        marginRight: '-6vw', 
        padding: '128px 6vw',
        borderBottom: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <StarField />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '64px', position: 'relative', zIndex: 2 }}>
          {/* Left Side: Info */}
          <div style={{ gridColumn: '1 / 6' }}>
            <motion.h2 
              {...fadeInUp}
              className="serif italic" 
              style={{ textTransform: 'none', fontSize: '3rem', color: '#fff', marginBottom: '32px' }}
            >
              Let&apos;s build something <br /> extraordinary.
            </motion.h2>
            <motion.p {...fadeInUp} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.125rem', marginBottom: '48px', lineHeight: 1.6 }}>
              Share your vision with us. Our team will respond within 24 hours with a tailored strategy.
            </motion.p>
            
            {/* Direct Contact */}
            <motion.div {...fadeInUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="mailto:hello@algorium.co.uk" style={{ color: '#FE532D', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>
                hello@algorium.co.uk
              </a>
              <a href="tel:+442012345678" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '1rem' }}>
                +44 20 1234 5678
              </a>
              
              <Contact3DAnimation />
            </motion.div>
          </div>

          {/* Right Side: Form */}
          <div style={{ gridColumn: '7 / 13' }}>
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '1.5rem',
                  border: '1px solid rgba(254, 83, 45, 0.3)',
                  padding: '4rem',
                  background: 'rgba(254, 83, 45, 0.05)'
                }}
              >
                <div style={{ fontSize: '3rem' }}>✉️</div>
                <h3 className="serif italic" style={{ fontSize: '2.5rem', color: '#FE532D' }}>Enquiry Received</h3>
                <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>Thank you for reaching out. <br />Our specialists will review your application and respond shortly.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid #fff', color: '#fff', cursor: 'pointer', padding: '0.5rem 0', marginTop: '2rem' }}
                >
                  Send another enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="Full Name" 
                    required
                    style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      border: 'none', 
                      borderBottom: '1px solid rgba(255,255,255,0.2)', 
                      padding: '1rem 0',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-inter)'
                    }} 
                  />
                </div>
                <div>
                  <input 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email" 
                    placeholder="Email Address" 
                    required
                    style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      border: 'none', 
                      borderBottom: '1px solid rgba(255,255,255,0.2)', 
                      padding: '1rem 0',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '1.2rem'
                    }} 
                  />
                </div>
                <div>
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    type="tel" 
                    placeholder="Phone Number" 
                    style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      border: 'none', 
                      borderBottom: '1px solid rgba(255,255,255,0.2)', 
                      padding: '1rem 0',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '1.2rem'
                    }} 
                  />
                </div>
                <div>
                  <input 
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="Company Website or LinkedIn" 
                    style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      border: 'none', 
                      borderBottom: '1px solid rgba(255,255,255,0.2)', 
                      padding: '1rem 0',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '1.2rem'
                    }} 
                  />
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Choose your interests</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {['Branding & Identity', 'Website & Product UI', 'Presentation Design', 'Marketing Material', 'Other'].map((item) => (
                      <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', fontSize: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.interests.includes(item)}
                          onChange={() => handleInterestChange(item)}
                          style={{ accentColor: 'var(--accent-color)' }} 
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Add your project details or questions here..."
                    style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      border: 'none', 
                      borderBottom: '1px solid rgba(255,255,255,0.2)', 
                      padding: '1rem 0',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '1.2rem',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  ></textarea>
                </div>

                <motion.button 
                  type="submit" 
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { 
                    boxShadow: '0 0 40px rgba(254, 83, 45, 0.5)', 
                    scale: 1.05, 
                    filter: 'brightness(1.2)' 
                  } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  style={{ 
                    alignSelf: 'flex-start', 
                    color: '#fff', 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    padding: '1.2rem 4rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '0px',
                    pointerEvents: 'auto',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'SENDING...' : 'SUBMIT ENQUIRY'}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Infinite Marquee */}
      <div style={{ padding: '6rem 0', background: 'var(--bg-color)', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid var(--divider)', marginLeft: '-6vw', marginRight: '-6vw' }}>
        <motion.div
          animate={{ x: [0, -2000] }}
          transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
          style={{ display: 'inline-block', fontSize: '8vw', textTransform: 'uppercase', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', opacity: darkMode ? 0.08 : 0.05, fontWeight: 800, whiteSpace: 'nowrap', color: 'var(--text-color)' }}
        >
          HONG KONG • TOKYO • NEW YORK • ISTANBUL • LONDON • DIGITAL ELITE • POSH ENGINEERING • HONG KONG • TOKYO • NEW YORK • ISTANBUL • LONDON • DIGITAL ELITE • POSH ENGINEERING
        </motion.div>
      </div>

      {/* Footer */}
      <footer style={{ 
        background: '#080810',
        color: '#fff',
        marginLeft: '-6vw',
        marginRight: '-6vw',
        padding: '0',
        position: 'relative',
        zIndex: 5,
        overflow: 'hidden'
      }}>
        <StarField />

        {/* Footer CTA */}
        <div style={{ padding: '8rem 6vw 6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 2 }}>
          <motion.h2 
            {...fadeInUp}
            className="serif italic"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: '#fff', textTransform: 'none', marginBottom: '2rem' }}
          >
            Ready to elevate <br />your digital presence?
          </motion.h2>
          <motion.a 
            href="#contact" 
            whileHover={{ 
              boxShadow: '0 0 40px rgba(254, 83, 45, 0.5)', 
              scale: 1.05, 
              filter: 'brightness(1.2)' 
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            style={{
              display: 'inline-block',
              padding: '1.2rem 3rem',
              background: 'linear-gradient(135deg, #FE532D 0%, #D43E23 100%)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              borderRadius: '0px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Start a Project
          </motion.a>
        </div>

        {/* Footer Grid */}
        <div style={{ padding: '4rem 6vw', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3rem', position: 'relative', zIndex: 2 }}>
          
          {/* Col 1: Contact */}
          <div>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem', fontWeight: 700 }}>Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <a href="mailto:hello@algorium.co.uk" style={{ color: '#FE532D', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>hello@algorium.co.uk</a>
              <a href="tel:+442012345678" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem' }}>+44 20 1234 5678</a>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
                71-75 Shelton Street<br />
                Covent Garden<br />
                London, WC2H 9JQ
              </p>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem', fontWeight: 700 }}>Navigation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { label: 'Expertise', href: '#expertise' },
                { label: 'Portfolio', href: '#work' },
                { label: 'Team', href: '#team' },
                { label: 'Contact', href: '#contact' }
              ].map(link => (
                <a key={link.label} href={link.href} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem' }}>{link.label}</a>
              ))}
            </div>
          </div>

          {/* Col 3: Services */}
          <div>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem', fontWeight: 700 }}>Services</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {['Brand Identity', 'Web Development', 'Mobile Apps', 'AI Solutions', 'E-Commerce'].map(s => (
                <span key={s} style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Col 4: Careers & Internships */}
          <div>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem', fontWeight: 700 }}>Careers</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Join our team of world-class engineers and designers.
              </p>
              <a href="mailto:careers@algorium.co.uk" style={{ color: '#FE532D', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>careers@algorium.co.uk</a>
              <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem', fontWeight: 700 }}>Internships</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Placements for students in engineering, design &amp; marketing.
                </p>
                <a href="mailto:internships@algorium.co.uk" style={{ color: '#FE532D', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', display: 'inline-block' }}>internships@algorium.co.uk</a>
              </div>
            </div>
          </div>

          {/* Col 5: Social */}
          <div>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem', fontWeight: 700 }}>Follow</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { name: 'Instagram', url: '#' },
                { name: 'LinkedIn', url: '#' },
                { name: 'Behance', url: '#' },
                { name: 'Twitter / X', url: '#' }
              ].map(s => (
                <a key={s.name} href={s.url} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem' }}>{s.name}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div style={{ 
          padding: '2rem 6vw',
          borderTop: '1px solid rgba(255,255,255,0.06)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Image src="/new-logo.png" alt="Algorium" width={100} height={34} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.5 }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
              &copy; {new Date().getFullYear()} Algorium UK. Registered in England &amp; Wales.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Terms</a>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.6rem 1.2rem', borderRadius: '20px' }}
            >
              Back to Top ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Breakout Mini Game Popup */}
      <AnimatePresence>
        {showGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                background: '#080810',
                padding: '2rem',
                borderRadius: '24px',
                border: '1px solid rgba(254, 83, 45, 0.3)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
              }}
            >
              <button 
                onClick={() => setShowGame(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  opacity: 0.5
                }}
              >
                ✕
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <h3 className="serif italic" style={{ fontSize: '1.5rem', color: '#FE532D', margin: 0 }}>Algorium Atari</h3>
                <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Hit all blocks to win</p>
              </div>

              <BreakoutGame />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Algorium Pro Atari (Advanced Arkanoid Clone) ──
const BreakoutGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Constants & Configuration
    const CONFIG = {
      ballSpeed: 4,
      gravity: 0.1,
      paddleSpeed: 0.2,
      maxParticles: 50,
      powerUpChance: 0.2
    };

    const COLORS = {
      bg: '#080810',
      primary: '#FE532D',
      secondary: '#fff',
      bricks: ['#FF1493', '#00BFFF', '#32CD32', '#FFD700', '#FF4500'],
      glow: 'rgba(254, 83, 45, 0.4)'
    };

    // Types
    interface Particle {
      x: number; y: number; dx: number; dy: number; r: number; life: number; color: string;
    }
    interface Ball {
      x: number; y: number; dx: number; dy: number; r: number; trail: {x: number, y: number}[]; active: boolean;
    }
    interface Brick {
      x: number; y: number; w: number; h: number; status: number; color: string;
    }
    interface PowerUp {
      x: number; y: number; type: 'WIDE' | 'MULTI' | 'SLOW'; dy: number; active: boolean;
    }

    // Game State
    let balls: Ball[] = [{ x: canvas.width / 2, y: canvas.height - 50, dx: 4, dy: -4, r: 5, trail: [], active: true }];
    let paddle = { x: canvas.width / 2 - 50, y: canvas.height - 25, w: 100, targetX: canvas.width / 2 - 50, h: 10 };
    let bricks: Brick[] = [];
    let particles: Particle[] = [];
    let powerUps: PowerUp[] = [];
    let score = 0;
    let level = 1;
    let lives = 3;
    let started = false;
    let shake = 0;
    let frame = 0;

    const initLevel = () => {
      bricks = [];
      const cols = 8;
      const rows = 3 + level;
      const pad = 8;
      const w = (canvas.width - (cols + 1) * pad) / cols;
      const h = 18;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: c * (w + pad) + pad,
            y: r * (h + pad) + 60,
            w, h, status: 1,
            color: COLORS.bricks[r % COLORS.bricks.length]
          });
        }
      }
    };

    const spawnPowerUp = (x: number, y: number) => {
      if (Math.random() < CONFIG.powerUpChance) {
        const types: ('WIDE' | 'MULTI' | 'SLOW')[] = ['WIDE', 'MULTI', 'SLOW'];
        powerUps.push({
          x, y, 
          type: types[Math.floor(Math.random() * types.length)],
          dy: 2,
          active: true
        });
      }
    };

    const explode = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x, y,
          dx: (Math.random() - 0.5) * 8,
          dy: (Math.random() - 0.5) * 8,
          r: Math.random() * 3 + 1,
          life: 1,
          color
        });
      }
    };

    const handleInput = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddle.targetX = e.clientX - rect.left - paddle.w / 2;
    };

    canvas.addEventListener('mousemove', handleInput);
    canvas.addEventListener('click', () => { if (!started) started = true; });

    initLevel();

    const loop = () => {
      frame++;
      ctx.save();
      
      // Screen Shake
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.85;
      }

      // Background - Moving Grid
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const scroll = (frame % 40) / 40 * 40;
      for (let i = -40; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i + scroll, 0); ctx.lineTo(i + scroll, canvas.height); ctx.stroke();
      }
      for (let j = -40; j < canvas.height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j + scroll); ctx.lineTo(canvas.width, j + scroll); ctx.stroke();
      }

      if (!started) {
        ctx.fillStyle = COLORS.primary;
        ctx.font = 'bold 24px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.primary;
        ctx.fillText('CLICK TO START', canvas.width / 2, canvas.height / 2 + 50);
        ctx.shadowBlur = 0;
      }

      // Update Paddle
      paddle.x += (paddle.targetX - paddle.x) * CONFIG.paddleSpeed;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
      
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
      ctx.fillStyle = COLORS.secondary;
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.secondary;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update PowerUps
      powerUps.forEach((p, idx) => {
        if (!p.active) return;
        p.y += p.dy;
        
        // Render
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.primary;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(p.type[0], p.x, p.y + 3);

        // Collect
        if (p.y > paddle.y && p.y < paddle.y + paddle.h && p.x > paddle.x && p.x < paddle.x + paddle.w) {
          p.active = false;
          if (p.type === 'WIDE') {
            paddle.w = 160;
            setTimeout(() => paddle.w = 100, 8000);
          } else if (p.type === 'MULTI') {
            const b = balls[0];
            balls.push({ ...b, dx: -b.dx, trail: [] });
          } else if (p.type === 'SLOW') {
            balls.forEach(b => { b.dx *= 0.5; b.dy *= 0.5; });
            setTimeout(() => balls.forEach(b => { b.dx *= 2; b.dy *= 2; }), 5000);
          }
        }
        if (p.y > canvas.height) p.active = false;
      });

      // Update Bricks
      let remaining = 0;
      bricks.forEach(b => {
        if (b.status === 0) return;
        remaining++;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fillStyle = b.color;
        ctx.fill();
      });
      if (remaining === 0) { level++; initLevel(); }

      // Update Balls
      balls.forEach((b, bIdx) => {
        if (!b.active) return;
        if (started) {
          b.x += b.dx;
          b.y += b.dy;
        }

        // Trails
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 10) b.trail.shift();
        b.trail.forEach((t, i) => {
          ctx.globalAlpha = i / 20;
          ctx.beginPath(); ctx.arc(t.x, t.y, b.r * (i/10), 0, Math.PI * 2);
          ctx.fillStyle = COLORS.primary; ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Wall Collisions
        if (b.x + b.r > canvas.width || b.x - b.r < 0) b.dx *= -1;
        if (b.y - b.r < 0) b.dy *= -1;

        // Paddle Collision
        if (b.y + b.r > paddle.y && b.y < paddle.y + paddle.h && b.x > paddle.x && b.x < paddle.x + paddle.w) {
          const hit = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          b.dx = hit * 5;
          b.dy = -Math.abs(b.dy);
          shake = 3;
        }

        // Brick Collision
        bricks.forEach(br => {
          if (br.status === 1 && b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) {
            br.status = 0;
            b.dy *= -1;
            score += 10;
            shake = 5;
            explode(br.x + br.w/2, br.y + br.h/2, br.color);
            spawnPowerUp(br.x + br.w/2, br.y + br.h/2);
          }
        });

        // Ball Lost
        if (b.y > canvas.height) {
          if (balls.length > 1) {
            b.active = false;
          } else {
            lives--;
            started = false;
            b.x = canvas.width / 2; b.y = canvas.height - 50;
            b.dx = 4; b.dy = -4;
            if (lives <= 0) { score = 0; level = 1; lives = 3; started = false; initLevel(); }
          }
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.primary;
        ctx.shadowBlur = 10; ctx.shadowColor = COLORS.primary;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Particles
      particles.forEach((p, idx) => {
        p.x += p.dx; p.y += p.dy; p.life -= 0.02;
        if (p.life <= 0) { particles.splice(idx, 1); return; }
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
      });
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.textAlign = 'right';
      ctx.fillText(`LVL: ${level} | ${"❤️".repeat(lives)}`, canvas.width - 20, 30);

      ctx.restore();
      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => {
      canvas.removeEventListener('mousemove', handleInput);
      cancelAnimationFrame(animId);
    };
  }, [level]);

  return (
    <canvas 
      ref={canvasRef} 
      width="540" 
      height="400" 
      style={{ 
        background: '#080810', 
        borderRadius: '20px',
        cursor: 'none',
        boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 0 30px rgba(254, 83, 45, 0.1)'
      }} 
    />
  );
};
