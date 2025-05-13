"use client"
import { useEffect, useRef, useState } from 'react';
import NeuralNetworkCanvas from '../components/NeuralNetworkCanvas';
import styles from '../styles/NeuralNetwork.module.css';

// Ajout d'une classe CSS pour le fade
const fadeStyles = `
.fade-btn {
  opacity: 0;
  transition: opacity 1s cubic-bezier(.4,0,.2,1), transform 0.3s cubic-bezier(.4,0,.2,1), background-color 0.3s cubic-bezier(.4,0,.2,1);
}
.fade-btn.visible {
  opacity: 1;
}
.fade-btn.hide {
  opacity: 0;
}
.fade-title {
  opacity: 0;
  transition: opacity 3s cubic-bezier(.4,0,.2,1);
}
.fade-title.visible {
  opacity: 1;
}
`;

export default function HomePage() {
  const musicFiles = [
    "/assets/Fractals.mp3",
    "/assets/Heartbeat.mp3",
    "/assets/One, Two, Zeta.mp3",
    "/assets/Quaternions.mp3",
    "/assets/Reflections.mp3",
    "/assets/Sixes.mp3",
    "/assets/Zeta.mp3",
    "/assets/Stepwise.mp3",
    "/assets/Euler's Clock.mp3"
  ];
  const [currentMusic, setCurrentMusic] = useState(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(false); // Ajout pour fade in
  const [showTitle, setShowTitle] = useState(false);
  const [fadeInTitle, setFadeInTitle] = useState(false);
  const [canvasStartTime, setCanvasStartTime] = useState(null); // Ajout pour le timestamp de démarrage
  const audioRef = useRef(null);

  useEffect(() => {
    if (musicFiles.length > 0) {
      const randomMusic = musicFiles[Math.floor(Math.random() * musicFiles.length)];
      setCurrentMusic(randomMusic);
    }
  }, []);

  useEffect(() => {
    if (currentMusic && audioRef.current) {
      audioRef.current.load();
    }
  }, [currentMusic]);

  useEffect(() => {
    // Lance le fade in après 1s (au lieu de 50ms)
    const timer = setTimeout(() => setFadeIn(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePlay = () => {
    // Passe en plein écran d'abord
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE11
      elem.msRequestFullscreen();
    }
    // Attend 1s après le plein écran avant de lancer le fade out du bouton
    setTimeout(() => {
      setFadeOut(true); // applique la classe .hide (début du fade out)
      setTimeout(() => {
        setShowButton(false); // retire le bouton APRÈS la durée du fade out
        setShowCanvas(true);
        setCanvasStartTime(performance.now()); // Ajout ici pour le timestamp de démarrage
        setShowTitle(true); // Affiche le titre après le fade out du bouton
        setTimeout(() => setFadeInTitle(true), 50); // Lance le fade in du titre
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            setAudioError(false);
            setAudioStarted(true);
          }).catch(() => {
            setAudioError(true);
            setAudioStarted(false);
          });
        }
      }, 2000); // attendre 40s pour retirer le bouton après le début du fade out
    }, 1000); // Délai de 1s après le plein écran avant le fade out
  };

  useEffect(() => {
    if (currentMusic && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioStarted(true);
            setAudioError(false);
          })
          .catch(() => {
            setAudioError(true);
            setAudioStarted(false);
          });
      }

      const resumeAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            setAudioError(false);
            setAudioStarted(true);
          }).catch(() => {
            setAudioError(true);
            setAudioStarted(false);
          });
        }
      };
      window.addEventListener('click', resumeAudio);
      window.addEventListener('pointerdown', resumeAudio);
      window.addEventListener('keydown', resumeAudio);

      return () => {
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('pointerdown', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
      };
    }
  }, [currentMusic]);

  const handleMusicEnd = () => {
    if (musicFiles.length > 0) {
      const randomMusic = musicFiles[Math.floor(Math.random() * musicFiles.length)];
      setCurrentMusic(randomMusic);
      setAudioError(false);
    }
  };

  return (
    <div
      className={styles.container}
      style={{
        background: 'rgba(10,10,20,0.92)', // <-- Ajouté ici pour être toujours présent
        position: showCanvas
          ? 'fixed'
          : undefined,
        top: showCanvas ? 0 : undefined,
        left: showCanvas ? 0 : undefined,
        right: showCanvas ? 0 : undefined,
        bottom: showCanvas ? 0 : undefined,
        width: showCanvas ? '100vw' : undefined,
        height: showCanvas ? '100vh' : undefined,
        zIndex: showCanvas ? 1 : undefined
      }}
    >
      <style>{fadeStyles}</style>
      {/* Affiche le titre seulement après le fade out du bouton */}
      {showTitle && (
        <h1 className={`fade-title${fadeInTitle ? ' visible' : ''} ${styles.title}`}>Alan Tuning</h1>
      )}
      {/* Cache le titre initial */}
      {!showTitle && null}
      {!showCanvas && showButton && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <button
            onClick={handlePlay}
            className={`fade-btn ${fadeIn && !fadeOut ? 'visible' : ''} ${fadeOut ? 'hide' : ''}`}
            style={{
              padding: '1.5rem 3rem',
              fontSize: '1.8rem',
              borderRadius: '100px',
              backgroundColor: '#ffffff10',
              backdropFilter: 'blur(8px)',
              border: '1px solid #ffffff30',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff30';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff10';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Launch Experience
          </button>
        </div>
      )}
      {showCanvas && <NeuralNetworkCanvas start={canvasStartTime} />}
      {currentMusic && (
        <audio
          ref={audioRef}
          src={currentMusic}
          autoPlay={false}
          onEnded={handleMusicEnd}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}