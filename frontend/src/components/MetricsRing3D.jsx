import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Scene3D from './Scene3D'

/**
 * MetricsRing3D — Animated 3D progress ring in warm ember colors
 */

function ProgressRing({ progress = 0.94, color = '#FF8C42' }) {
  const ringRef = useRef()
  const glowRef = useRef()

  const curve = useMemo(() => {
    const points = []
    const segments = 100
    const target = progress * Math.PI * 2
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * target - Math.PI / 2
      points.push(new THREE.Vector3(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [progress])

  const bgCurve = useMemo(() => {
    const points = []
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 2 - Math.PI / 2
      points.push(new THREE.Vector3(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ringRef.current) ringRef.current.rotation.z = Math.sin(t * 0.5) * 0.02
    if (glowRef.current) glowRef.current.material.opacity = 0.15 + Math.sin(t * 2) * 0.05
  })

  return (
    <group ref={ringRef}>
      <mesh>
        <tubeGeometry args={[bgCurve, 100, 0.06, 8, false]} />
        <meshBasicMaterial color="#2a2318" transparent opacity={0.5} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 100, 0.07, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh ref={glowRef}>
        <tubeGeometry args={[curve, 100, 0.15, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[Math.cos(progress * Math.PI * 2 - Math.PI / 2) * 1.5, Math.sin(progress * Math.PI * 2 - Math.PI / 2) * 1.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

function FloatingParticles({ count = 25, color = '#FF8C42' }) {
  const pointsRef = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 1.2 + Math.random() * 1.2
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = Math.sin(angle) * r
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    return pos
  }, [count])

  useFrame(({ clock }) => { if (pointsRef.current) pointsRef.current.rotation.z = clock.getElapsedTime() * 0.1 })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.02} transparent opacity={0.5} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

export default function MetricsRing3D({ progress = 0.94, color = '#FF8C42', style = {} }) {
  return (
    <Scene3D className="scene-inline" style={{ height: '220px', ...style }} camera={{ position: [0, 0, 4.5], fov: 40 }}>
      <ambientLight intensity={0.3} />
      <ProgressRing progress={progress} color={color} />
      <FloatingParticles color={color} />
    </Scene3D>
  )
}
