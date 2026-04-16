import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'

/**
 * Scene3D — Reusable 3D canvas wrapper
 * Handles camera, lighting, Suspense, and performance settings
 */
export default function Scene3D({
  children,
  camera = { position: [0, 0, 5], fov: 45 },
  className = '',
  style = {},
  dpr = [1, 1.5],
  gl = { antialias: true, alpha: true },
}) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        camera={camera}
        dpr={dpr}
        gl={gl}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {children}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}
