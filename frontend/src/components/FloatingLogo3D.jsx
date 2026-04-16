import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import Scene3D from './Scene3D'

/**
 * FloatingLogo3D — Cinematic 3D hero element with warm ember glow
 * Rotating wireframe icosahedron + orbiting rings + particles
 */

function IcosahedronCore() {
  const meshRef = useRef()
  const wireRef = useRef()
  const ring2Ref = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.15
      meshRef.current.rotation.y = t * 0.2
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.1
      wireRef.current.rotation.z = t * 0.15
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.12
      ring2Ref.current.rotation.x = Math.sin(t * 0.3) * 0.2
    }
  })

  return (
    <group>
      {/* Inner glowing core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.4, 1]} />
          <MeshDistortMaterial
            color="#FF8C42"
            emissive="#FF8C42"
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.9}
            wireframe
            distort={0.25}
            speed={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      </Float>

      {/* Inner solid core (tiny, bright) */}
      <mesh>
        <icosahedronGeometry args={[0.35, 2]} />
        <meshBasicMaterial color="#FFB366" transparent opacity={0.12} />
      </mesh>

      {/* Outer ring 1 */}
      <mesh ref={wireRef}>
        <torusGeometry args={[2.0, 0.02, 16, 120]} />
        <meshBasicMaterial color="#FFB366" transparent opacity={0.3} />
      </mesh>

      {/* Outer ring 2 (tilted) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[2.2, 0.015, 16, 120]} />
        <meshBasicMaterial color="#FF8C42" transparent opacity={0.15} />
      </mesh>

      {/* Third ring (perpendicular) */}
      <mesh rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <torusGeometry args={[1.7, 0.015, 16, 100]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.1} />
      </mesh>
    </group>
  )
}

function OrbitingParticles({ count = 120 }) {
  const pointsRef = useRef()

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 3.5 + Math.random() * 2.0
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return positions
  }, [count])

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.05
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FF8C42"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function FloatingLogo3D({ className = 'scene-fixed-core' }) {
  return (
    <Scene3D className={className} camera={{ position: [0, 0, 4.5], fov: 60 }}>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} color="#FF8C42" intensity={0.8} />
      <pointLight position={[-5, -5, 3]} color="#FFB366" intensity={0.4} />
      <pointLight position={[0, -3, 5]} color="#FF6B6B" intensity={0.2} />
      <IcosahedronCore />
      <OrbitingParticles />
    </Scene3D>
  )
}
