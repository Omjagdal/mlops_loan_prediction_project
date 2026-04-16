import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Scene3D from './Scene3D'

/**
 * Globe3D — Warm-toned interactive wireframe globe with data arcs
 */

function WireGlobe() {
  const globeRef = useRef()
  const pointsRef = useRef()

  const pointPositions = useMemo(() => {
    const pos = new Float32Array(40 * 3)
    for (let i = 0; i < 40; i++) {
      const lat = (Math.random() - 0.5) * Math.PI
      const lng = Math.random() * Math.PI * 2
      const r = 1.52
      pos[i * 3] = r * Math.cos(lat) * Math.cos(lng)
      pos[i * 3 + 1] = r * Math.sin(lat)
      pos[i * 3 + 2] = r * Math.cos(lat) * Math.sin(lng)
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (globeRef.current) globeRef.current.rotation.y = t * 0.08
    if (pointsRef.current) pointsRef.current.rotation.y = t * 0.08
  })

  return (
    <group>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#FF8C42" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh rotation={[Math.PI / 6, 0, 0]}>
        <sphereGeometry args={[1.51, 16, 16]} />
        <meshBasicMaterial color="#FFB366" wireframe transparent opacity={0.04} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={pointPositions.length / 3} array={pointPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#FF8C42" size={0.04} transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.008, 8, 100]} />
        <meshBasicMaterial color="#FF8C42" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

export default function Globe3D({ style = {} }) {
  return (
    <Scene3D className="scene-inline" style={{ height: '280px', ...style }} camera={{ position: [0, 0, 4.5], fov: 40 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} color="#FF8C42" intensity={0.5} />
      <WireGlobe />
    </Scene3D>
  )
}
