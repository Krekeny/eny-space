'use client';
import dynamic from 'next/dynamic';

// client-only: the engine + OAuth libs touch window/localStorage at import time
const Game = dynamic(() => import('./Game'), { ssr: false });

export default function Page() {
  return <Game />;
}
