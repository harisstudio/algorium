"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform, useInView, LayoutGroup } from "framer-motion";
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
  const starsRef = useRef<{ x: number, y: number, z: number, size: number, opacity: number }[]>([]);
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

const ImageSwitcher = ({ isMobile }: { isMobile?: boolean }) => {
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
      width: isMobile ? '100%' : '650px',
      height: isMobile ? '280px' : '400px',
      position: 'relative',
      userSelect: 'none',
      pointerEvents: 'none',
      margin: isMobile ? '2rem 0' : '0'
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

const AnalogClock = ({ city, timeZone, isMobile }: { city: string, timeZone: string, isMobile?: boolean }) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.6rem' }}>
      <div style={{
        width: isMobile ? '50px' : '60px',
        height: isMobile ? '50px' : '60px',
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
            transform: `rotate(${i * 30}deg) translateY(${isMobile ? '-21px' : '-26px'})`,
            borderRadius: '1px'
          }} />
        ))}
        {/* Hour Hand — thick, short, tapered */}
        <div style={{
          position: 'absolute',
          width: '2.5px',
          height: isMobile ? '12px' : '15px',
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
          height: isMobile ? '18px' : '22px',
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
            height: isMobile ? '20px' : '24px',
            background: '#FE532D',
            transform: 'translateX(-50%)',
          }} />
          {/* Counterweight tail */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '1.5px',
            height: isMobile ? '5px' : '7px',
            background: '#FE532D',
            transform: 'translateX(-50%)',
            borderRadius: '0 0 1px 1px'
          }} />
        </div>
        {/* Center Pivot — layered like a real watch */}
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FE532D', zIndex: 4, boxShadow: '0 0 0 1px #fff' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: isMobile ? '0.5rem' : '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.35, margin: 0, fontWeight: 700 }}>{city}</p>
        <p style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 600, margin: 0, opacity: 0.7, fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>
          {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </p>
      </div>
    </div>
  );
};


const SpotlightCard = ({ title, desc, tag, col, isMobile }: any) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const icons: Record<string, React.ReactNode> = {
    s1: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="24" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="14" cy="18" r="5" stroke="#FE532D" strokeWidth="2" />
        <path d="M2 28L10 22L16 26L24 18" stroke="#FE532D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="30" y="2" width="8" height="8" rx="2" fill="#FE532D" />
        <rect x="30" y="14" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
        <rect x="30" y="20" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
        <rect x="30" y="26" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
      </svg>
    ),
    s2: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8L20 4L36 8V18C36 28 28 36 20 38C12 36 4 28 4 18V8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M12 20L18 26L28 14" stroke="#FE532D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    s4: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="6" fill="#FE532D" />
        <path d="M20 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 31V37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 20H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M31 20H37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 8L12 12" stroke="#FE532D" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 28L32 32" stroke="#FE532D" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 8L28 12" stroke="#FE532D" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 28L8 32" stroke="#FE532D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <motion.div
      style={{
        gridColumn: isMobile ? 'span 12' : col,
        position: 'relative',
        overflow: 'hidden',
        padding: isMobile ? '32px' : '64px',
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

const ProjectRow = ({ project, index, isMobile }: { project: typeof projects[0], index: number, isMobile?: boolean }) => {
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
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative',
        zIndex: 2,
        gap: isMobile ? '1.5rem' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '1.5rem' : '3rem' }}>
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

        <div style={{
          display: 'flex',
          gap: isMobile ? '1.5rem' : '3rem',
          alignItems: 'center',
          textAlign: isMobile ? 'left' : 'right'
        }}>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: 0.4,
            fontWeight: 600,
            display: 'block'
          }}>
            {project.category}
          </span>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            opacity: 0.2,
            fontWeight: 600,
            minWidth: '40px'
          }}>
            {project.year}
          </span>
        </div>
      </div>

      {/* Mobile Project Image - Visible on mobile below title */}
      {isMobile && (
        <div style={{
          marginTop: '2rem',
          width: '100%',
          aspectRatio: '4/3',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--card-border)'
        }}>
          <Image
            src={project.image}
            alt={project.name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      )}

      {/* Floating Reveal Image - Desktop Only */}
      <AnimatePresence>
        {!isMobile && hovered && (
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
  const [showPortal, setShowPortal] = useState(false);
  const [portalStage, setPortalStage] = useState<'login' | 'dashboard'>('login');
  const [clientData, setClientData] = useState({ company: '', password: '' });
  const [activeTab, setActiveTab] = useState<'Overview' | 'Drive Space' | 'Invoices' | 'Notes' | 'Admin'>('Overview');
  const [activeProject, setActiveProject] = useState<any>(null);

  // Portal Roles & Data
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [adminClients, setAdminClients] = useState<any[]>([]);

  // Google Drive Style States
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState(['My Files']);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | null }>({ message: '', type: null });

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  // Real System Login
  const handlePortalLogin = async () => {
    console.log("🔐 Attempting login for:", clientData.company);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.algorium.uk';
      const res = await fetch(`${apiUrl}/api/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: clientData.company, password: clientData.password }),
        mode: 'cors'
      });

      const data = await res.json();
      console.log("📡 API Response:", data);

      if (data.success) {
        setUserRole(data.role);
        setPortalStage('dashboard');

        if (data.role === 'admin') {
          setActiveTab('Admin');
          fetchAdminData();
        } else {
          setActiveProject(data.client);
          setDriveFiles(data.client.files);
        }
        return;
      }
    } catch (err) {
      console.warn("⚠️ API Unavailable, falling back to local simulation.", err);
    }

    // FALLBACK LOGIC - If API fails or backend is down
    if (clientData.company === 'admin@algorium.uk' && clientData.password === 'admin') {
      setUserRole('admin');
      setPortalStage('dashboard');
      setActiveTab('Admin');
      // Set some demo data for admin
      setAdminClients([
        {
          id: 'algorium_uk',
          company: 'Algorium UK',
          projectInfo: { name: 'Brand Identity', progress: 75 },
          files: [{ name: 'logo.png', size: '2MB', type: 'Image' }],
          invoices: [{ id: 'INV-101', amount: '£2500', status: 'Paid', date: '2026-04-10' }]
        }
      ]);
      return;
    }

    if (clientData.company.toLowerCase() === 'algorium uk' && clientData.password === 'pass') {
      const demoClient = {
        id: 'algorium_uk',
        company: 'Algorium UK',
        projectInfo: { name: 'Brand Identity', progress: 75, deadline: '24 Jul 2026', roadmap: [] },
        files: [
          { name: 'Official Logo v2.png', size: '2.4 MB', type: 'Image' },
          { name: 'Brand Guidelines.pdf', size: '12 MB', type: 'PDF' }
        ],
        invoices: [{ id: 'INV-001', amount: '£2,500', status: 'Paid', date: 'Jul 10, 2026' }]
      };
      setUserRole('client');
      setActiveProject(demoClient);
      setDriveFiles(demoClient.files);
      setPortalStage('dashboard');
      setActiveTab('Overview');
      return;
    }

    alert("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.\n(Admin: admin@algorium.uk / admin)\n(Müşteri: Algorium UK / pass)");
  };

  const fetchAdminData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.algorium.uk';
      const res = await fetch(`${apiUrl}/api/portal/data?role=admin`);
      const data = await res.json();
      setAdminClients(data.clients);
    } catch (err) {
      console.warn("⚠️ Using local client data for Admin view.");
      setAdminClients([
        {
          id: 'algorium_uk',
          company: 'Algorium UK',
          projectInfo: { name: 'Brand Identity', progress: 75, deadline: '24 Jul 2026', roadmap: [] },
          files: [
            { name: 'logo.png', size: '2MB', type: 'Image' },
            { name: 'guidelines.pdf', size: '12MB', type: 'PDF' }
          ],
          invoices: [{ id: 'INV-101', amount: '£2500', status: 'Paid', date: '2026-04-10' }]
        }
      ]);
    }
  };

  const performAdminAction = async (clientId: string, type: string, actionData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.algorium.uk';
      const res = await fetch(`${apiUrl}/api/portal/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, type, data: actionData })
      });
      const data = await res.json();
      console.log("📡 Action Success:", data);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully.`);
      fetchAdminData(); // Refresh
    } catch (err) {
      console.error("Action Error - No Backend:", err);
      // Local simulation for Admin
      showToast(`Simulated: ${type} added (Local Mode)`, 'success');
      if (type === 'invoice') {
        const updatedClients = adminClients.map(c =>
          c.id === clientId ? { ...c, invoices: [...c.invoices, actionData] } : c
        );
        setAdminClients(updatedClients);
      }
    }
  };

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.algorium.uk';
      const response = await fetch(`${apiUrl}/api/contact`, {
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
  const [isMobile, setIsMobile] = useState(false);
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

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
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

        {/* Search Bar — Hidden on Mobile */}
        {!isMobile && (
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
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.toLowerCase() === 'file') {
                  setShowPortal(true);
                  setSearchQuery(''); // Clear it so it feels like a command
                }
              }}
              style={{
                width: '100%',
                padding: '10px 170px 10px 45px',
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

            <div style={{ position: 'absolute', right: '6px', display: 'flex', gap: '6px' }}>
              <motion.button
                onClick={() => setShowGame(true)}
                whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: '#FE532D',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(254, 83, 45, 0.3)',
                  fontFamily: 'var(--font-inter)'
                }}
              >
                GAME
              </motion.button>

              <motion.button
                onClick={() => setShowPortal(true)}
                whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)'
                }}
              >
                CUSTOMER
              </motion.button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem' }}>
          {/* Language Selector — Hidden on Mobile */}
          {!isMobile && (
            <>
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
            </>
          )}

          {/* iOS Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            style={{
              width: isMobile ? '38px' : '44px',
              height: isMobile ? '20px' : '24px',
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
              animate={{ x: darkMode ? (isMobile ? 18 : 20) : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: isMobile ? '16px' : '20px',
                height: isMobile ? '16px' : '20px',
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
                {/* Mobile Specific Buttons */}
                {isMobile && (
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <motion.button
                      onClick={() => { setShowGame(true); setMenuOpen(false); }}
                      style={{ flex: 1, background: '#FE532D', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em' }}
                    >
                      GAME
                    </motion.button>
                    <motion.button
                      onClick={() => { setShowPortal(true); setMenuOpen(false); }}
                      style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.1)' : '#111', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em' }}
                    >
                      CUSTOMER
                    </motion.button>
                  </div>
                )}

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
                      fontSize: isMobile ? '1.5rem' : '2rem',
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
                {isMobile && (
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    {languages.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        style={{
                          background: lang === l ? '#FE532D' : 'rgba(0,0,0,0.05)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: lang === l ? '#fff' : 'var(--text-color)',
                          padding: '6px 12px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
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
            <p style={{ fontSize: isMobile ? '1.2rem' : '1.85rem', fontWeight: 500, lineHeight: 1.3, marginBottom: isMobile ? '2rem' : '3rem' }}>
              We design and build bespoke digital ecosystems for brands that refuse to settle for the ordinary.
            </p>

            {/* Clocks strictly below the description */}
            <div style={{ display: 'flex', gap: isMobile ? '1.5rem' : '2.5rem', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <AnalogClock city="Tokyo" timeZone="Asia/Tokyo" isMobile={isMobile} />
              <AnalogClock city="Hong Kong" timeZone="Asia/Hong_Kong" isMobile={isMobile} />
              <AnalogClock city="Delhi" timeZone="Asia/Kolkata" isMobile={isMobile} />
              <AnalogClock city="Istanbul" timeZone="Europe/Istanbul" isMobile={isMobile} />
              <AnalogClock city="London" timeZone="Europe/London" isMobile={isMobile} />
              <AnalogClock city="New York" timeZone="America/New_York" isMobile={isMobile} />
            </div>
          </motion.div>

          {/* Objects Showcase: Floating on the far right on desktop, below on mobile */}
          <div style={{
            position: isMobile ? 'relative' : 'absolute',
            top: isMobile ? '0' : '50%',
            right: isMobile ? '0' : '-4vw',
            transform: isMobile ? 'none' : 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <ImageSwitcher isMobile={isMobile} />
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
      <section id="services" style={{ padding: isMobile ? '64px 0' : '128px 0' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>What We Do</p>
          <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Expertise</h2>
        </motion.div>
        <div className="line-detail" style={{ opacity: 0.2, marginBottom: isMobile ? '64px' : '128px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: isMobile ? '2rem' : '4rem' }}>
          <SpotlightCard title="Brand & <br />Product Design" desc="Visual identities and user interfaces that command attention and respect." tag="s1" col="1 / 5" isMobile={isMobile} />
          <SpotlightCard title="High-End <br />Engineering" desc="Scalable web and mobile applications built with precision and edge-ready speed." tag="s2" col="5 / 9" isMobile={isMobile} />
          <SpotlightCard title="AI & <br />Intelligence" desc="Leveraging predictive models and generative AI to create smart, results-driven experiences." tag="s4" col="9 / 13" isMobile={isMobile} />
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
            <ProjectRow key={project.name} project={project} index={i} isMobile={isMobile} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: isMobile ? '64px 0' : '128px 0',
        background: 'var(--bg-color)',
        borderTop: '1px solid var(--divider)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: isMobile ? '2rem' : '4rem' }}>
          <div style={{ gridColumn: isMobile ? 'span 12' : '1 / 5' }}>
            <h5 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.8, marginBottom: '1.5rem', color: 'var(--text-color)' }}>Metrics</h5>
            <p style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', lineHeight: 1.5, opacity: 0.7 }}>
              Our engineering philosophy is built on absolute precision and measurable impact.
            </p>
          </div>
          <div style={{
            gridColumn: isMobile ? 'span 12' : '6 / 13',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
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
                <h4 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.5rem' }}>{stat.value}</h4>
                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" style={{ padding: isMobile ? '64px 0' : '128px 0' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>The Human Edge</p>
          <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Our Team</h2>
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
      <section style={{ padding: isMobile ? '64px 0' : '128px 0', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
        <motion.div {...fadeInUp} style={{ marginBottom: isMobile ? '40px' : '80px' }}>
          <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '32px' }}>How We Deliver</p>
          <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>Our Process</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '2rem' }}>
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
                padding: isMobile ? '32px 24px' : '48px 32px',
                background: 'var(--subtle-bg)',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{
                position: 'absolute',
                top: isMobile ? '0.5rem' : '1rem',
                right: isMobile ? '1rem' : '1.5rem',
                fontSize: isMobile ? '3rem' : '4rem',
                fontWeight: 900,
                opacity: 0.15,
                fontFamily: 'var(--font-outfit)',
                color: '#FE532D'
              }}>{item.step}</span>
              <h4 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-color)' }}>{item.title}</h4>
              <p style={{ fontSize: '0.95rem', opacity: 0.6, lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" style={{
        background: '#080810',
        color: '#fff',
        marginLeft: isMobile ? '-5vw' : '-6vw',
        marginRight: isMobile ? '-5vw' : '-6vw',
        padding: isMobile ? '64px 5vw' : '128px 6vw',
        borderBottom: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <StarField />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: isMobile ? '48px' : '64px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Left Side: Info */}
          <div style={{ gridColumn: isMobile ? 'span 12' : '1 / 6' }}>
            <motion.h2
              {...fadeInUp}
              className="serif italic"
              style={{ textTransform: 'none', fontSize: isMobile ? '2.25rem' : '3rem', color: '#fff', marginBottom: '32px' }}
            >
              Let&apos;s build something <br /> extraordinary.
            </motion.h2>
            <motion.p {...fadeInUp} style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '1rem' : '1.125rem', marginBottom: '48px', lineHeight: 1.6 }}>
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
          <div style={{ gridColumn: isMobile ? 'span 12' : '7 / 13' }}>
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
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '1rem'
                  }}>
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
                    alignSelf: isMobile ? 'stretch' : 'flex-start',
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    padding: isMobile ? '1.2rem 2rem' : '1.2rem 4rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '0px',
                    pointerEvents: 'auto',
                    opacity: isSubmitting ? 0.7 : 1,
                    textAlign: 'center'
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
        <div style={{
          padding: isMobile ? '4rem 5vw' : '4rem 6vw',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
          gap: '3rem',
          position: 'relative',
          zIndex: 2
        }}>

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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingBottom: '0.5rem' }}>
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                `}</style>
                <Image
                  src="/new-logo.png"
                  alt="Algorium Logo"
                  width={140}
                  height={40}
                  style={{
                    objectFit: 'contain',
                    // Filter to convert to #FE532D
                    filter: 'brightness(0) saturate(100%) invert(48%) sepia(87%) saturate(3015%) hue-rotate(344deg) brightness(101%) contrast(101%)'
                  }}
                />
                <span style={{
                  fontFamily: '"Press Start 2P", system-ui',
                  fontSize: '0.8rem',
                  color: '#FE532D',
                  paddingTop: '4px'
                }}>
                  ATARI
                </span>
              </div>

              <BreakoutGame />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Algorium Client Portal (File System) */}
      <AnimatePresence>
        {showPortal && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: darkMode ? '#080810' : '#ffffff',
              zIndex: 3500,
              display: 'flex',
              overflow: 'hidden',
              color: darkMode ? '#fff' : '#000'
            }}
          >
            {/* Sidebar / Navigation */}
            <div
              data-lenis-prevent
              style={{
                width: '280px',
                height: '100%',
                background: darkMode ? '#05050a' : '#f8f8fa',
                borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                overflowY: 'auto'
              }}
            >
              <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '0.5rem' }}>
                <Image
                  src="/new-logo.png"
                  alt="Logo"
                  width={220}
                  height={70}
                  style={{
                    width: '140px',
                    height: 'auto',
                    filter: darkMode ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
              </div>

              {/* Google Drive style "NEW" button */}
              <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                <button
                  onClick={() => setShowNewMenu(!showNewMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 24px',
                    background: darkMode ? '#fff' : '#000',
                    color: darkMode ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    width: 'fit-content'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                  NEW
                </button>

                <AnimatePresence>
                  {showNewMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '10px',
                        background: darkMode ? '#151520' : '#fff',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        zIndex: 4000,
                        width: '200px',
                        padding: '8px'
                      }}
                    >
                      {[
                        { label: 'File Upload', icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' },
                        { label: 'New Folder', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
                        { label: 'New Invoice', icon: 'M7 15h0M2 9.5h20', adminOnly: true }
                      ].filter(item => !item.adminOnly || userRole === 'admin').map((item, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setShowNewMenu(false);
                            if (item.label === 'File Upload') {
                              const newFile = {
                                name: prompt('Enter file name', 'New Presentation.pdf') || 'New File.pdf',
                                size: '1.2 MB',
                                type: 'Document'
                              };
                              setDriveFiles([newFile, ...driveFiles]);
                            } else if (item.label === 'New Folder') {
                              alert('Feature: Sub-folder creation initialized.');
                            } else if (item.label === 'New Invoice') {
                              if (activeProject) {
                                performAdminAction(activeProject.id, 'invoice', {
                                  id: `INV-${Math.floor(Math.random() * 900) + 100}`,
                                  amount: '£1,500',
                                  status: 'Pending',
                                  date: new Date().toLocaleDateString()
                                });
                              }
                            }
                          }}
                          style={{
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                          className="new-menu-item"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2"><path d={item.icon} /></svg>
                          {item.label}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { name: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
                    { name: 'Drive Space', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg> },
                    { name: 'Invoices', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 9.5h20" /></svg> },
                    { name: 'Notes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
                    ...(userRole === 'admin' ? [{ name: 'Admin', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg> }] : [])
                  ].map(item => (
                    <motion.div
                      key={item.name}
                      whileHover={{ x: 5, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                      onClick={() => setActiveTab(item.name as any)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: activeTab === item.name ? 'rgba(253, 53, 29, 0.1)' : 'transparent',
                        color: activeTab === item.name ? '#FE532D' : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                        fontWeight: activeTab === item.name ? 600 : 400,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.icon}
                      {item.name}
                    </motion.div>
                  ))}
                </nav>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ padding: '20px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '20px', marginBottom: '1.5rem', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}` }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.8rem', fontWeight: 600 }}>Storage Breakdown</div>
                  <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ width: '45%', background: '#FE532D' }} />
                    <div style={{ width: '25%', background: '#32d74b' }} />
                    <div style={{ width: '15%', background: 'rgba(255,255,255,0.2)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', opacity: 0.4 }}>
                    <span>● Design</span>
                    <span>● Assets</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>3.5GB of 5GB used</div>
              </div>

              <button
                onClick={() => { setShowPortal(false); setPortalStage('login'); setActiveProject(null); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: '10px',
                  color: darkMode ? '#fff' : '#000',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                SIGN OUT
              </button>
            </div>

            {/* Main Content Area */}
            <div style={{
              flex: 1,
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              background: darkMode ? '#080810' : '#ffffff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {portalStage === 'login' ? (
                <div
                  data-lenis-prevent
                  style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: darkMode ? '#fff' : '#000' }}>Access Portal</h2>
                    <p style={{ opacity: 0.5, marginBottom: '3rem', color: darkMode ? '#fff' : '#000' }}>Please enter your synchronization credentials.</p>

                    <input
                      type="text"
                      placeholder="Company Name"
                      onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                      style={{ width: '100%', padding: '18px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f5f5f7', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '15px', color: darkMode ? '#fff' : '#000', marginBottom: '1.2rem', outline: 'none' }}
                    />
                    <input
                      type="password"
                      placeholder="Access Code"
                      onChange={(e) => setClientData({ ...clientData, password: e.target.value })}
                      style={{ width: '100%', padding: '18px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f5f5f7', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '15px', color: darkMode ? '#fff' : '#000', marginBottom: '2.5rem', outline: 'none' }}
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePortalLogin}
                      style={{ width: '100%', padding: '20px', background: '#FE532D', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      LOGIN TO SYSTEM
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div
                  data-lenis-prevent
                  style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
                >
                  <div style={{ padding: '4rem 6rem' }}>
                    {/* Header with Active Project Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5rem', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingBottom: '3rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#FE532D', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{activeTab.replace(' Space', '')}</div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', margin: 0 }}>{activeProject?.company}</h1>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ opacity: 0.5, fontSize: '0.85rem', color: darkMode ? '#fff' : '#000' }}>System Status</div>
                        <div style={{ color: '#32d74b', fontWeight: 700, fontSize: '1.1rem' }}>● SYNCHRONIZED</div>
                      </div>
                    </div>

                    {/* Conditional Tab Rendering */}
                    {activeTab === 'Drive Space' && (
                      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                            <h3 style={{ fontSize: '1.5rem', color: darkMode ? '#fff' : '#000', whiteSpace: 'nowrap' }}>Shared Documents</h3>
                            <div style={{ position: 'relative', width: '300px' }}>
                              <input
                                type="text"
                                placeholder="Search assets..."
                                onChange={(e) => setDriveSearch(e.target.value)}
                                style={{ width: '100%', padding: '10px 15px 10px 40px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8f8f8', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '10px', color: darkMode ? '#fff' : '#000', fontSize: '0.85rem' }}
                              />
                              <svg style={{ position: 'absolute', left: '12px', top: '10px', opacity: 0.3 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                          </div>
                          <button style={{ padding: '12px 28px', background: darkMode ? '#fff' : '#000', color: darkMode ? '#000' : '#fff', borderRadius: '30px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>+ UPLOAD ASSETS</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                          {driveFiles.filter(f => f.name.toLowerCase().includes(driveSearch.toLowerCase())).map((file: any, i: number) => (
                            <motion.div
                              key={i}
                              whileHover={{ y: -5, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
                              style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px', cursor: 'pointer' }}
                            >
                              <div style={{ width: '45px', height: '45px', background: 'rgba(254, 83, 45, 0.1)', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px', color: darkMode ? '#fff' : '#000' }}>{file.name}</div>
                              <div style={{ opacity: 0.4, fontSize: '0.85rem', color: darkMode ? '#fff' : '#000' }}>{file.size} • {file.type}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'Overview' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ marginBottom: '4rem' }}>
                          <h4 style={{ fontSize: '0.9rem', color: '#FE532D', fontWeight: 600, marginBottom: '0.5rem' }}>DASHBOARD OVERVIEW</h4>
                          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: darkMode ? '#fff' : '#000' }}>Welcome back, {activeProject?.company}</h2>
                        </div>

                        {/* Summary Cards Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
                          <div style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px' }}>
                            <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Phase</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FE532D' }}>{activeProject?.status} Build</div>
                            <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', opacity: 0.4 }}>Current focus: Core UI/UX Build</div>
                          </div>
                          <div style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px' }}>
                            <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Progress</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{Math.round((activeProject?.timeline.filter((t: any) => t.completed).length / activeProject?.timeline.length) * 100)}%</div>
                            <div style={{ width: '100%', height: '6px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '3px', marginTop: '1.2rem', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(activeProject?.timeline.filter((t: any) => t.completed).length / activeProject?.timeline.length) * 100}%` }}
                                style={{ height: '100%', background: '#FE532D' }}
                              />
                            </div>
                          </div>
                          <div style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px' }}>
                            <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Delivery</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeProject?.timeline.find((t: any) => !t.completed)?.date || 'Completed'}</div>
                            <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', opacity: 0.4 }}>Mile: {activeProject?.timeline.find((t: any) => !t.completed)?.task || 'All delivered'}</div>
                          </div>
                        </div>

                        {/* Main Grid: Timeline + Activity */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2.5rem', color: darkMode ? '#fff' : '#000' }}>Recent Activity</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {activeProject?.activityLog && activeProject.activityLog.length > 0 ? activeProject.activityLog.map((log: any) => (
                                <div key={log.id} style={{ padding: '1.5rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, borderRadius: '20px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(254,83,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: darkMode ? '#fff' : '#000' }}>{log.action}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.4, color: darkMode ? '#fff' : '#000' }}>{log.date}</div>
                                  </div>
                                </div>
                              )) : <div style={{ opacity: 0.3, color: darkMode ? '#fff' : '#000' }}>No recent activity to show.</div>}
                            </div>
                          </div>

                          {/* Secondary Column: Progress Roadmap */}
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2.5rem', color: darkMode ? '#fff' : '#000' }}>Roadmap status</h3>
                            <div style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.01)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px', backdropFilter: 'blur(10px)' }}>
                              {activeProject?.projectInfo?.roadmap?.map((step: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: step.status === 'completed' ? '#32d74b' : (step.status === 'current' ? '#FE532D' : 'rgba(255,255,255,0.1)') }} />
                                  <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: step.status === 'pending' ? 0.4 : 1 }}>{step.phase}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'Invoices' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                          <h3 style={{ fontSize: '1.5rem', color: darkMode ? '#fff' : '#000' }}>Financial Ledger</h3>
                          <button
                            onClick={() => {
                              if (userRole === 'admin') {
                                performAdminAction(activeProject.id, 'invoice', {
                                  id: `INV-${Math.floor(Math.random() * 900) + 100}`,
                                  amount: '£4,500',
                                  status: 'Pending',
                                  date: new Date().toLocaleDateString()
                                });
                                alert('Invoice pushed to client portal.');
                              } else {
                                alert('Contact your Account Manager for billing enquiries.');
                              }
                            }}
                            style={{ padding: '12px 28px', background: '#FE532D', color: '#fff', borderRadius: '30px', border: 'none', fontWeight: 700, fontSize: '0.85rem' }}>+ NEW INVOICE</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {activeProject?.invoices.map((inv: any, i: number) => (
                            <div key={i} style={{ padding: '1.5rem 2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ fontWeight: 700, color: '#FE532D' }}>{inv.id}</div>
                              <div style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000' }}>{inv.date}</div>
                              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: darkMode ? '#fff' : '#000' }}>{inv.amount}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: inv.status === 'Paid' ? '#32d74b' : '#FE532D' }}>{inv.status.toUpperCase()}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'Notes' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 style={{ fontSize: '1.5rem', color: darkMode ? '#fff' : '#000', marginBottom: '2rem' }}>Brief Documentation</h3>
                        <textarea
                          defaultValue={activeProject?.notes}
                          style={{ width: '100%', height: '400px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px', padding: '2.5rem', color: darkMode ? '#fff' : '#000', fontSize: '1.1rem', lineHeight: '1.8', outline: 'none' }}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'Admin' && userRole === 'admin' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkMode ? '#fff' : '#000' }}>Agency Manager</h3>
                            <p style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000' }}>Overview of all client ecosystems and synchronization status.</p>
                          </div>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ padding: '15px 25px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff', borderRadius: '15px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                              <div style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', color: darkMode ? '#fff' : '#000' }}>Active Clients</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: darkMode ? '#fff' : '#000' }}>{adminClients.length}</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff', borderRadius: '24px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                                <th style={{ padding: '20px', fontSize: '0.8rem', opacity: 0.4, color: darkMode ? '#fff' : '#000' }}>CLIENT</th>
                                <th style={{ padding: '20px', fontSize: '0.8rem', opacity: 0.4, color: darkMode ? '#fff' : '#000' }}>PROJECT PROGRESS</th>
                                <th style={{ padding: '20px', fontSize: '0.8rem', opacity: 0.4, color: darkMode ? '#fff' : '#000' }}>FILES</th>
                                <th style={{ padding: '20px', fontSize: '0.8rem', opacity: 0.4, color: darkMode ? '#fff' : '#000' }}>ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminClients.map(client => (
                                <tr key={client.id} style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}` }}>
                                  <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: 600, color: darkMode ? '#fff' : '#000' }}>{client.company}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, color: darkMode ? '#fff' : '#000' }}>{client.projectInfo.name}</div>
                                  </td>
                                  <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ flex: 1, height: '6px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${client.projectInfo.progress}%`, height: '100%', background: '#FE532D' }} />
                                      </div>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#fff' : '#000' }}>{client.projectInfo.progress}%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '20px' }}>
                                    <span style={{ padding: '4px 10px', background: 'rgba(254, 83, 45, 0.1)', color: '#FE532D', borderRadius: '6px', fontSize: '0.8rem' }}>{client.files.length} Files</span>
                                  </td>
                                  <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                      <button onClick={() => { setActiveProject(client); setPortalStage('dashboard'); setActiveTab('Overview'); }} style={{ padding: '8px 15px', background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', color: darkMode ? '#fff' : '#000' }}>View Client</button>
                                      <button
                                        onClick={() => performAdminAction(client.id, 'invoice', { id: `INV-${Math.floor(Math.random() * 900) + 100}`, amount: '£1,200', status: 'Pending', date: new Date().toLocaleDateString() })}
                                        style={{ padding: '8px 15px', background: '#FE532D', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                      >+ Invoice</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Notification Toast */}
      <AnimatePresence>
        {toast.type && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '16px 32px',
              background: toast.type === 'success' ? '#32d74b' : '#FE532D',
              color: '#fff',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Algorium Boutique Atari (Custom Clean Version) ──
const BreakoutGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const ORANGE = '#FE532D';
    const BG = '#05050a';

    let gameState: 'READY' | 'PLAYING' | 'GAMEOVER' | 'WON' = 'READY';
    let score = 0;
    let lives = 3;
    let level = 1;

    // Objects
    const ball = {
      x: canvas.width / 2,
      y: canvas.height - 40,
      r: 5,
      dx: 4,
      dy: -4,
      baseSpeed: 4.5
    };

    const paddle = {
      w: 100,
      h: 10,
      x: (canvas.width - 100) / 2,
      y: canvas.height - 25,
      targetX: (canvas.width - 100) / 2,
      speed: 0.15
    };

    interface Brick { x: number; y: number; w: number; h: number; active: boolean; opacity: number; }
    let bricks: Brick[] = [];

    const initBricks = () => {
      bricks = [];
      const rows = 4 + level;
      const cols = 8;
      const padding = 6;
      const offsetTop = 50;
      const bWidth = (canvas.width - (cols + 1) * padding) / cols;
      const bHeight = 15;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: c * (bWidth + padding) + padding,
            y: r * (bHeight + padding) + offsetTop,
            w: bWidth,
            h: bHeight,
            active: true,
            // Different opacities for visual depth
            opacity: 1 - (r * 0.15)
          });
        }
      }
    };

    initBricks();

    // Input Handling
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddle.targetX = e.clientX - rect.left - paddle.w / 2;
    };
    const onClick = () => {
      if (gameState === 'READY') gameState = 'PLAYING';
      if (gameState === 'GAMEOVER' || gameState === 'WON') {
        score = 0; lives = 3; level = 1;
        ball.x = canvas.width / 2; ball.y = canvas.height - 40;
        ball.dx = 4; ball.dy = -4;
        initBricks();
        gameState = 'READY';
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    // Collision Helper
    const checkCollision = (circle: any, rect: any) => {
      let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
      let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
      let distanceX = circle.x - closestX;
      let distanceY = circle.y - closestY;
      let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
      return distanceSquared < (circle.r * circle.r);
    };

    // --- Game Loop ---
    const draw = () => {
      // 1. Clear & Background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Bricks
      let activeCount = 0;
      bricks.forEach(b => {
        if (!b.active) return;
        activeCount++;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fillStyle = ORANGE;
        ctx.globalAlpha = b.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      if (activeCount === 0) {
        level++;
        initBricks();
        ball.y = canvas.height - 40;
        ball.dy = -Math.abs(ball.dy);
        gameState = 'READY';
      }

      // 3. Draw Paddle
      paddle.x += (paddle.targetX - paddle.x) * paddle.speed;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
      ctx.fillStyle = ORANGE;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ORANGE;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Draw Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; // White core for neon look
      ctx.shadowBlur = 10;
      ctx.shadowColor = ORANGE;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 5. Update Logic
      if (gameState === 'PLAYING') {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall Bounce
        if (ball.x + ball.r > canvas.width || ball.x - ball.r < 0) ball.dx *= -1;
        if (ball.y - ball.r < 0) ball.dy *= -1;

        // Paddle Collision
        if (checkCollision(ball, paddle)) {
          ball.dy = -Math.abs(ball.dy);
          // Angle based on hit position
          let hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          ball.dx = hitPos * ball.baseSpeed;
        }

        // Brick Collision
        bricks.forEach(b => {
          if (b.active && checkCollision(ball, b)) {
            b.active = false;
            ball.dy *= -1;
            score += 10;
          }
        });

        // Die
        if (ball.y > canvas.height) {
          lives--;
          if (lives <= 0) gameState = 'GAMEOVER';
          else {
            gameState = 'READY';
            ball.x = canvas.width / 2;
            ball.y = canvas.height - 40;
            ball.dx = 4;
            ball.dy = -4;
          }
        }
      }

      // 6. UI
      ctx.fillStyle = ORANGE;
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score}`, 20, 30);

      ctx.textAlign = 'right';
      // Drawing Orange Hearts
      const hearts = '🧡'.repeat(lives);
      ctx.fillText(`LIVES: ${hearts}`, canvas.width - 20, 30);

      // Overlays
      if (gameState === 'READY') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = ORANGE;
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Inter';
        ctx.fillText('CLICK TO LAUNCH', canvas.width / 2, canvas.height / 2);
      } else if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = ORANGE;
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px Inter';
        ctx.fillText('CLICK TO RESTART', canvas.width / 2, canvas.height / 2 + 30);
      }

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width="500"
      height="380"
      style={{
        background: '#05050a',
        borderRadius: '24px',
        cursor: 'none',
        boxShadow: '0 0 50px rgba(254, 83, 45, 0.15)'
      }}
    />
  );
};

// ── Mock Database for Client Portal ──
const PROJECTS_DB = [
  {
    company: "Algorium",
    code: "2026",
    status: "Active",
    timeline: [
      { date: "May 2026", task: "Digitization Strategy", completed: true },
      { date: "June 2026", task: "Core UI/UX Build", completed: true },
      { date: "July 2026", task: "AI Solution Integration", completed: false },
      { date: "August 2026", task: "Final Deployment", completed: false }
    ],
    drive: [
      { name: "Brand_Assets.zip", size: "45MB", type: "Client Data", date: "2026-04-10" },
      { name: "Project_Brief_V2.pdf", size: "1.2MB", type: "Brief", date: "2026-04-12" },
      { name: "Iteration_Screens_01.jpg", size: "8MB", type: "Design", date: "2026-04-15" }
    ],
    invoices: [
      { id: "INV-001", amount: "$12,500", status: "Paid", date: "2026-03-01" },
      { id: "INV-002", amount: "$8,000", status: "Pending", date: "2026-04-15" }
    ],
    notes: "Ensure the transition animations match the Apple standard."
  }
];
