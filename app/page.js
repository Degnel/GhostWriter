'use client';

import dynamic from 'next/dynamic';

// Import dynamique avec désactivation du SSR
const CircularWaveform = dynamic(() => import('../components/CircularWaveform'), {
  ssr: false
});

export default function Home() {
  return (
    <main>
      <CircularWaveform />
    </main>
  );
}