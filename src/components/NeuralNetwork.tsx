// components/NeuralNetwork.tsx
"use client";

import { useEffect, useRef, useState } from 'react';

interface ParticleNode {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  intensityPhase: number;
  intensity: number;
  targetX: number;
  targetY: number;
  oscPhase: number;
  update: () => void;
  moveToFinal: (t: number, time: number) => void;
}

const NeuralNetwork = ({ onAnimationComplete }: { onAnimationComplete?: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Move nodes outside useEffect so it is always defined
  let nodes: ParticleNode[][] = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas!.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNetwork(); // Reinitialize the network when dimensions change
    };

    window.addEventListener('resize', setCanvasDimensions);
    setCanvasDimensions();

    // Animation constants
    const blackScreenDuration = 1000; // 1s black screen at start
    const fadeDuration = 2000; // 2s fade-in after black screen
    const introDuration = 6000; // ms (slower)
    const animationStart = 0.5;
    let interp = 0;
    let hasStartedConversation = false;

    function distance(a: ParticleNode, b: ParticleNode) {
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    function getLayerActivation(layerIdx: number, time: number) {
      // Sinusoidal wave that propagates from layer 0 to the last
      const speed = 0.0012; // propagation speed
      const phase = time * speed - layerIdx * 0.7;
      // Activation between 0 and 1, with sharp peak
      return 0.5 + 0.5 * Math.sin(phase);
    }

    function createParticleNode(baseX: number, baseY: number, radius: number): ParticleNode {
      return {
        baseX,
        baseY,
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius,
        phase: Math.random() * Math.PI * 2,
        intensityPhase: Math.random() * Math.PI * 2,
        intensity: 1,
        targetX: baseX,
        targetY: baseY,
        oscPhase: Math.random() * Math.PI * 2,
        update() {
          this.x += this.vx;
          this.y += this.vy;
          // Bounce on edges
          if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
          if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
        },
        moveToFinal(t, time) {
          // Slower interpolation toward final position (strong ease-in)
          const slowT = Math.pow(t, 4); // Quartic to slow down the start
          let finalX = this.x * (1 - slowT) + this.baseX * slowT;
          let finalY = this.y * (1 - slowT) + this.baseY * slowT;

          // Smooth transition to oscillation
          // oscFade goes from 0 to 1 when t goes from transitionThreshold to 1
          const transitionThreshold = 0.5;
          let oscFade = Math.max(0, Math.min(1, (t - transitionThreshold) / (1 - transitionThreshold)));
          const floatRadius = 10;
          const speed = 0.8;
          const oscX = this.baseX + Math.sin(time * 0.001 * speed + this.oscPhase) * floatRadius;
          const oscY = this.baseY + Math.cos(time * 0.001 * speed + this.oscPhase) * floatRadius;

          this.x = finalX * (1 - oscFade) + oscX * oscFade;
          this.y = finalY * (1 - oscFade) + oscY * oscFade;
        }
      };
    }

    function initNetwork() {
      const layers = 5;
      const neuronsPerLayer = 5;
      const networkWidth = canvas!.width * 0.3;
      const networkHeight = canvas!.height * 0.4;
      const layerSpacing = networkWidth / (layers - 1);
      const neuronSpacing = networkHeight / (neuronsPerLayer - 1);
      const radius = 8;
      
      // Calculate offsets to center the network
      const offsetX = (canvas!.width - networkWidth) / 2;
      const offsetY = (canvas!.height - networkHeight) / 2;

      nodes = [];
      for (let l = 0; l < layers; l++) {
        const layer: ParticleNode[] = [];
        for (let n = 0; n < neuronsPerLayer; n++) {
          const x = offsetX + l * layerSpacing;
          const y = offsetY + n * neuronSpacing;
          layer.push(createParticleNode(x, y, radius));
        }
        nodes.push(layer);
      }
    }

    function drawNetwork(time: number) {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      // Display black screen during blackScreenDuration
      if (time < blackScreenDuration) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas!.width, canvas!.height);
        ctx.restore();
        return;
      }

      // Offset animation time for the rest
      const animTime = time - blackScreenDuration;
      let t = Math.min(animTime / introDuration, 1);

      // Update particle positions
      const flatNodes = nodes.flat();
      for (let node of flatNodes) {
        node.update();
        node.intensity = 0.5 + 0.5 * Math.abs(Math.sin((animTime * 0.001) * 1.2 + node.intensityPhase));
      }

      // Local dynamic connections (spatially close)
      let introConnections: [ParticleNode, ParticleNode][] = [];
      for (let i = 0; i < flatNodes.length; i++) {
        for (let j = i + 1; j < flatNodes.length; j++) {
          const a = flatNodes[i], b = flatNodes[j];
          if (distance(a, b) < 120) {
            introConnections.push([a, b]);
          }
        }
      }

      // Draw connections (local) only during intro
      if (t <= animationStart) {
        for (let [a, b] of introConnections) {
          const d = distance(a, b);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,255,255,${1 - d / 120})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // MLP connections (fully-connected between adjacent layers) in final state
      if (t > animationStart) {
        interp = (t - animationStart) / animationStart;
        // Calculate activation of each layer
        const layerActivations: number[] = [];
        for (let l = 0; l < nodes.length; l++) {
          layerActivations[l] = getLayerActivation(l, animTime);
        }

        for (let l = 0; l < nodes.length; l++) {
          for (let n = 0; n < nodes[l].length; n++) {
            nodes[l][n].moveToFinal(Math.min(interp, 1), animTime);
          }
        }

        // Draw all connections between adjacent layers
        for (let l = 0; l < nodes.length - 1; l++) {
          // Light energy goes from layer l to l+1
          const sourceActivation = layerActivations[l];
          const targetActivation = layerActivations[l + 1];
          for (let i = 0; i < nodes[l].length; i++) {
            const sourceNeuron = nodes[l][i];
            // Energy of each source neuron is modulated by layer activation
            for (let j = 0; j < nodes[l + 1].length; j++) {
              const targetNeuron = nodes[l + 1][j];
              const connDist = distance(sourceNeuron, targetNeuron);
              // Light intensity = source activation * target activation, smoothed by distance
              let connIntensity = sourceActivation * targetActivation * 1.5 * Math.tanh(interp) / Math.pow(connDist / 100, 1.5);
              connIntensity = Math.min(1, connIntensity);

              // Add "flux" effect: color varies with time and position
              const fluxPhase = animTime * 0.003 - l * 0.7 + (i + j) * 0.15;
              const flux = 0.7 + 0.3 * Math.sin(fluxPhase);

              ctx.beginPath();
              ctx.moveTo(sourceNeuron.x, sourceNeuron.y);
              ctx.lineTo(targetNeuron.x, targetNeuron.y);
              ctx.strokeStyle = `rgba(100,255,255,${connIntensity * flux})`;
              ctx.lineWidth = 1.2 * connIntensity + 0.3;
              ctx.shadowColor = "#00ffff";
              ctx.shadowBlur = 2 * connIntensity;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }
        }
      }

      // Draw nodes (modulated by layer activation)
      for (let l = 0; l < nodes.length; l++) {
        const layerActivation = t > animationStart ? getLayerActivation(l, animTime) : 0;
        for (let n = 0; n < nodes[l].length; n++) {
          const node = nodes[l][n];
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          // Intensity = layer activation + neuron's own oscillation
          let intensity = (0.6 * layerActivation + 0.4 * node.intensity) * (0 + 1 * layerActivation) * Math.tanh(interp);

          // Continuous interpolation from gray to cyan
          // intensity ∈ [0,1]
          // Gray: R=G=B=val, Cyan: R=0, G=B=255
          const gray = 0.7 * 255; // same value as before for base gray
          const r = Math.round(gray * (1 - intensity) + 180 * intensity);
          const g = Math.round(gray * (1 - intensity) + 255 * intensity);
          const b = Math.round(gray * (1 - intensity) + 255 * intensity);

          ctx.fillStyle = `rgba(${r},${g},${b},255)`;
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10 * intensity;
          ctx.fill();
          ctx.restore();
        }
      }

      // Fade-in effect after black screen
      if (animTime < fadeDuration) {
        ctx.save();
        ctx.globalAlpha = 1 - (animTime / fadeDuration);
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas!.width, canvas!.height);
        ctx.restore();
      }
    }

    // Animation loop
    let startTime: number | null = null;
    let animationFrameId: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      
      drawNetwork(elapsedTime);

      // Call onAnimationComplete at the end of the transition
      const animTime = Math.max(0, elapsedTime - blackScreenDuration);
      let t = Math.min(animTime / introDuration, 1);
      if (t >= 1 && !hasStartedConversation && onAnimationComplete) {
        hasStartedConversation = true;
        onAnimationComplete();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    // Start animation
    if (!animationStarted) {
      animationFrameId = requestAnimationFrame(animate);
      setAnimationStarted(true);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animationStarted, onAnimationComplete]);

  return (
    <div className="neural-network-container">
      <h1 className="title">Alan Tuning</h1>
      <canvas ref={canvasRef} id="networkCanvas" />
    </div>
  );
};

export default NeuralNetwork;