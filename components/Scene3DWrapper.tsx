'use client';

import dynamic from 'next/dynamic';

const BasePad3DScene = dynamic(() => import('./BasePad3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
});

export default function Scene3DWrapper() {
  return <BasePad3DScene />;
}
