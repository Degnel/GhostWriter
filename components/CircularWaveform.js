'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CircularWaveform.module.css';

const CircularWaveform = () => {
  const waveCanvasRef = useRef(null);
  const topHalfCanvasRef = useRef(null);
  const bottomHalfCanvasRef = useRef(null);
  const blurCanvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentColorSet, setCurrentColorSet] = useState(0);
  
  // Références pour les contextes de canvas
  const ctxRef = useRef(null);
  const topCtxRef = useRef(null);
  const bottomCtxRef = useRef(null);
  const blurCtxRef = useRef(null);
  
  // Animation frame reference
  const requestRef = useRef(null);
  
  // Animation state
  const timeRef = useRef(0);
  
  // Colors and configuration
  const colorSets = [
    ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF'],
    ['#FF0055', '#00FFAA', '#AAFF00', '#FF0055'],
    ['#5500FF', '#00FFFF', '#FF00AA', '#5500FF'],
    ['#FF0000', '#00FF00', '#0000FF', '#FF0000'],
  ];
  
  const waveCount = 5;
  const paramsRef = useRef({
    radius: 0,
    frequency: 0.5,
    amplitude: 60,
    speed: 0.02
  });

  useEffect(() => {
    // Initialiser les canvas et les contextes
    const waveCanvas = waveCanvasRef.current;
    const topHalfCanvas = topHalfCanvasRef.current;
    const bottomHalfCanvas = bottomHalfCanvasRef.current;
    const blurCanvas = blurCanvasRef.current;
    
    ctxRef.current = waveCanvas.getContext('2d');
    topCtxRef.current = topHalfCanvas.getContext('2d');
    bottomCtxRef.current = bottomHalfCanvas.getContext('2d');
    blurCtxRef.current = blurCanvas.getContext('2d');
    
    // Configurer les dimensions
    const setDimensions = () => {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
      
      waveCanvas.width = size;
      waveCanvas.height = size;
      
      topHalfCanvas.width = size;
      topHalfCanvas.height = size / 2;
      
      bottomHalfCanvas.width = size;
      bottomHalfCanvas.height = size / 2;
      
      blurCanvas.width = size;
      blurCanvas.height = size;
      
      // Mettre à jour le rayon
      paramsRef.current.radius = size * 0.45;
    };
    
    // Initialiser les dimensions
    setDimensions();
    
    // Gestionnaire de redimensionnement
    window.addEventListener('resize', setDimensions);
    
    // Lancer l'animation
    requestRef.current = requestAnimationFrame(animate);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', setDimensions);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Generate points for the circular wave
  const getWavePoints = (time, waveIndex) => {
    const points = [];
    const steps = 200;
    const phaseOffset = (waveIndex / waveCount) * Math.PI * 2;
    const params = paramsRef.current;
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const distortionFactor = Math.sin(angle * params.frequency * (waveIndex + 1) + time + phaseOffset);
      const radiusOffset = distortionFactor * params.amplitude * (1 - waveIndex * 0.15);
      
      const radius = params.radius + radiusOffset;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      points.push({ x, y });
    }
    
    return points;
  };

  // Draw wave
  const drawWave = (context, points, colorIndex, alpha) => {
    const params = paramsRef.current;
    const gradient = context.createLinearGradient(
      -params.radius, -params.radius, 
      params.radius, params.radius
    );
    
    const colors = colorSets[currentColorSet];
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.33, colors[1]);
    gradient.addColorStop(0.66, colors[2]);
    gradient.addColorStop(1, colors[3]);
    
    context.save();
    context.translate(context.canvas.width / 2, context.canvas.height / 2);
    
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const { x, y } = points[i];
      context.lineTo(x, y);
    }
    
    context.closePath();
    context.strokeStyle = gradient;
    context.lineWidth = 3;
    context.globalAlpha = alpha;
    context.stroke();
    
    // Add glow effect
    context.shadowColor = colors[colorIndex % colors.length];
    context.shadowBlur = 15;
    context.stroke();
    context.restore();
  };

  // Fonction pour dessiner une moitié de vague (supérieure ou inférieure)
  const drawHalfWave = (context, points, colorIndex, alpha, half) => {
    const params = paramsRef.current;
    const gradient = context.createLinearGradient(
      -params.radius, half === 'top' ? -params.radius : 0, 
      params.radius, half === 'top' ? 0 : params.radius
    );
    
    const colors = colorSets[currentColorSet];
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.33, colors[1]);
    gradient.addColorStop(0.66, colors[2]);
    gradient.addColorStop(1, colors[3]);
    
    context.save();
    context.translate(context.canvas.width / 2, half === 'top' ? context.canvas.height : 0);
    
    context.beginPath();
    
    // Pour la moitié supérieure
    if (half === 'top') {
      // Commencer par le point le plus à gauche de l'horizontale
      let leftmostPoint = { x: -params.radius, y: 0 };
      
      // Trouver le point réel le plus à gauche près de l'horizontale
      for (let i = 0; i < points.length; i++) {
        if (points[i].y <= 0 && points[i].x < 0) {
          if (points[i].x < leftmostPoint.x || (Math.abs(points[i].y) < Math.abs(leftmostPoint.y))) {
            leftmostPoint = points[i];
          }
        }
      }
      
      context.moveTo(leftmostPoint.x, leftmostPoint.y);
      
      // Dessiner la partie supérieure
      for (let i = 0; i < points.length; i++) {
        if (points[i].y <= 0) {
          context.lineTo(points[i].x, points[i].y);
        }
      }
      
      // Terminer par le point le plus à droite de l'horizontale
      let rightmostPoint = { x: params.radius, y: 0 };
      
      for (let i = 0; i < points.length; i++) {
        if (points[i].y <= 0 && points[i].x > 0) {
          if (points[i].x > rightmostPoint.x || (Math.abs(points[i].y) < Math.abs(rightmostPoint.y))) {
            rightmostPoint = points[i];
          }
        }
      }
      
      context.lineTo(rightmostPoint.x, rightmostPoint.y);
    } 
    // Pour la moitié inférieure
    else {
      // Commencer par le point le plus à droite de l'horizontale
      let rightmostPoint = { x: params.radius, y: 0 };
      
      // Trouver le point réel le plus à droite près de l'horizontale
      for (let i = 0; i < points.length; i++) {
        if (points[i].y >= 0 && points[i].x > 0) {
          if (points[i].x > rightmostPoint.x || (Math.abs(points[i].y) < Math.abs(rightmostPoint.y))) {
            rightmostPoint = points[i];
          }
        }
      }
      
      context.moveTo(rightmostPoint.x, rightmostPoint.y);
      
      // Dessiner la partie inférieure
      for (let i = points.length - 1; i >= 0; i--) {
        if (points[i].y >= 0) {
          context.lineTo(points[i].x, points[i].y);
        }
      }
      
      // Terminer par le point le plus à gauche de l'horizontale
      let leftmostPoint = { x: -params.radius, y: 0 };
      
      for (let i = 0; i < points.length; i++) {
        if (points[i].y >= 0 && points[i].x < 0) {
          if (points[i].x < leftmostPoint.x || (Math.abs(points[i].y) < Math.abs(leftmostPoint.y))) {
            leftmostPoint = points[i];
          }
        }
      }
      
      context.lineTo(leftmostPoint.x, leftmostPoint.y);
    }
    
    context.closePath();
    context.strokeStyle = gradient;
    context.lineWidth = 3;
    context.globalAlpha = alpha;
    context.stroke();
    
    // Ajouter l'effet de glow
    context.shadowColor = colors[colorIndex % colors.length];
    context.shadowBlur = 15;
    context.stroke();
    context.restore();
  };

  // Function to draw blurred outer waves
  const drawBlurredOuterWaves = () => {
    const blurCtx = blurCtxRef.current;
    const params = paramsRef.current;
    
    blurCtx.save();
    blurCtx.translate(blurCtx.canvas.width / 2, blurCtx.canvas.height / 2);
    
    // Draw outer waves with blur effect
    const outerPoints = getWavePoints(timeRef.current * 0.7, 0);
    const colors = colorSets[currentColorSet];
    
    // Create gradient
    const gradient = blurCtx.createRadialGradient(0, 0, params.radius * 0.8, 0, 0, params.radius * 1.5);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, colors[0] + '33'); // Semi-transparent
    gradient.addColorStop(0.8, colors[1] + '55');
    gradient.addColorStop(0.9, colors[2] + '33');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    // Draw distorted outer circle
    blurCtx.beginPath();
    blurCtx.moveTo(outerPoints[0].x * 1.3, outerPoints[0].y * 1.3);
    
    for (let i = 1; i < outerPoints.length; i++) {
      const { x, y } = outerPoints[i];
      blurCtx.lineTo(x * 1.3, y * 1.3);
    }
    
    blurCtx.closePath();
    blurCtx.fillStyle = gradient;
    blurCtx.fill();
    
    blurCtx.restore();
  };

  // Main animation loop
  const animate = () => {
    if (!isAnimating) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    
    const ctx = ctxRef.current;
    const topCtx = topCtxRef.current;
    const bottomCtx = bottomCtxRef.current;
    const blurCtx = blurCtxRef.current;
    
    // Effacer tous les canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    topCtx.clearRect(0, 0, topCtx.canvas.width, topCtx.canvas.height);
    bottomCtx.clearRect(0, 0, bottomCtx.canvas.width, bottomCtx.canvas.height);
    blurCtx.clearRect(0, 0, blurCtx.canvas.width, blurCtx.canvas.height);
    
    // Dessiner les vagues principales (invisible mais utilisé comme référence)
    for (let i = 0; i < waveCount; i++) {
      const alpha = 1 - (i / waveCount) * 0.6;
      const points = getWavePoints(timeRef.current, i);
      drawWave(ctx, points, i, alpha);
      
      // Dessiner la moitié haute sans flou
      drawHalfWave(topCtx, points, i, alpha, 'top');
      
      // Dessiner la moitié basse avec flou
      drawHalfWave(bottomCtx, points, i, alpha, 'bottom');
    }
    
    // Dessiner l'effet extérieur flouté
    drawBlurredOuterWaves();
    
    timeRef.current += paramsRef.current.speed;
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleChangeColor = () => {
    setCurrentColorSet((prev) => (prev + 1) % colorSets.length);
  };

  const handleToggleAnimation = () => {
    setIsAnimating((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glow}></div>
      <canvas ref={waveCanvasRef} className={styles.mainCanvas}></canvas>
      <canvas ref={topHalfCanvasRef} className={styles.topHalfCanvas}></canvas>
      <canvas ref={bottomHalfCanvasRef} className={styles.bottomHalfCanvas}></canvas>
      <canvas ref={blurCanvasRef} className={styles.blurCanvas}></canvas>
      <h1 className={styles.title}>Circular Waveform</h1>
      <div className={styles.controls}>
        <button onClick={handleChangeColor}>Changer les couleurs</button>
        <button onClick={handleToggleAnimation}>
          {isAnimating ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
};

export default CircularWaveform;