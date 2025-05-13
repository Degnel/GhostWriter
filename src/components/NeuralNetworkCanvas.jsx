"use client";
import { useEffect, useRef, useState } from 'react';
import styles from '../styles/NeuralNetwork.module.css';
import ParticleNode from '../utils/ParticleNode';
import { Conversation } from './conversation';

export default function NeuralNetworkCanvas() {
  const canvasRef = useRef(null);
  const [showConversation, setShowConversation] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- Constants (copied from index.html) ---
    const blackScreenDuration = 1000;
    const fadeDuration = 2000;
    const layers = 5;
    const neuronsPerLayer = 5;
    const networkWidth = canvas.width * 0.3;
    const networkHeight = canvas.height * 0.4;
    const layerSpacing = networkWidth / (layers - 1);
    const neuronSpacing = networkHeight / (neuronsPerLayer - 1);
    const radius = 8;
    let interp = 0;
    const animationStart = 0.5;
    const offsetX = (canvas.width - networkWidth) / 2;
    const offsetY = (canvas.height - networkHeight) / 2;
    const introDuration = 6000;

    // --- Nodes ---
    const nodes = [];
    for (let l = 0; l < layers; l++) {
      const layer = [];
      for (let n = 0; n < neuronsPerLayer; n++) {
        const x = offsetX + l * layerSpacing;
        const y = offsetY + n * neuronSpacing;
        layer.push(new ParticleNode(x, y, canvas, radius));
      }
      nodes.push(layer);
    }

    function distance(a, b) {
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    function getLayerActivation(layerIdx, time) {
      const speed = 0.0012;
      const phase = time * speed - layerIdx * 0.7;
      return 0.5 + 0.5 * Math.sin(phase);
    }

    function drawNetwork(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time < blackScreenDuration) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        return;
      }

      const animTime = time - blackScreenDuration;
      let t = Math.min(animTime / introDuration, 1);

      const flatNodes = nodes.flat();
      for (let node of flatNodes) {
        node.update();
        node.intensity = 0.5 + 0.5 * Math.abs(Math.sin((animTime * 0.001) * 1.2 + node.intensityPhase));
      }

      let introConnections = [];
      for (let i = 0; i < flatNodes.length; i++) {
        for (let j = i + 1; j < flatNodes.length; j++) {
          const a = flatNodes[i], b = flatNodes[j];
          if (distance(a, b) < 120) {
            introConnections.push([a, b]);
          }
        }
      }

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

      if (t > animationStart) {
        interp = (t - animationStart) / animationStart;
        const layerActivations = [];
        for (let l = 0; l < nodes.length; l++) {
          layerActivations[l] = getLayerActivation(l, animTime);
        }
        for (let l = 0; l < nodes.length; l++) {
          for (let n = 0; n < nodes[l].length; n++) {
            nodes[l][n].moveToFinal(Math.min(interp, 1), animTime);
          }
        }
        for (let l = 0; l < nodes.length - 1; l++) {
          const sourceActivation = layerActivations[l];
          const targetActivation = layerActivations[l + 1];
          for (let i = 0; i < nodes[l].length; i++) {
            const sourceNeuron = nodes[l][i];
            for (let j = 0; j < nodes[l + 1].length; j++) {
              const targetNeuron = nodes[l + 1][j];
              const connDist = distance(sourceNeuron, targetNeuron);
              let connIntensity = sourceActivation * targetActivation * 1.5 * Math.tanh(interp) / Math.pow(connDist / 100, 1.5);
              connIntensity = Math.min(1, connIntensity);
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

      for (let l = 0; l < nodes.length; l++) {
        const layerActivation = t > animationStart ? getLayerActivation(l, animTime) : 0;
        for (let n = 0; n < nodes[l].length; n++) {
          const node = nodes[l][n];
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          let intensity = (0.6 * layerActivation + 0.4 * node.intensity) * (0 + 1 * layerActivation) * Math.tanh(interp);
          const gray = 0.7 * 255;
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

      if (animTime < fadeDuration) {
        ctx.save();
        ctx.globalAlpha = 1 - (animTime / fadeDuration);
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Afficher la conversation à la fin de l'animation
      if (!showConversation && t >= 1) {
        setShowConversation(true);
      }
    }

    function animate(time) {
      drawNetwork(time);
      requestAnimationFrame(animate);
    }

    animate(0);

    // Optional: handle resize
    // ...existing code...
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} className={styles.canvas} />
      {showConversation && <Conversation />}
    </div>
  );
}
