import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Scene3D from './Scene3D'

/**
 * DataFlow3D — Streaming particle flow in warm ember tones
 */

function ParticleStream({ count = 200, color = '#FF8C42', speed = 1 }) {
  const pointsRef = useRef()

  const { positions, velocities, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    const off = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const path = Math.floor(Math.random() * 4)
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = (path - 1.5) * 0.6 + (Math.random() - 0.5) * 0.15
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3
      vel[i] = (Math.random() * 0.5 + 0.5) * speed
      off[i] = Math.random() * Math.PI * 2
    }
    return { positions: pos, velocities: vel, offsets: off }
  }, [count, speed])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    const arr = pointsRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i] * 0.02
      if (arr[i * 3] > 4) arr[i * 3] = -4
      arr[i * 3 + 1] += Math.sin(t * 2 + offsets[i]) * 0.0005
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.025} transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function PipelineLines() {
  const positions = useMemo(() => {
    const pos = []
    for (let path = 0; path < 4; path++) {
      const y = (path - 1.5) * 0.6
      pos.push(-4, y, 0, 4, y, 0)
    }
    return new Float32Array(pos)
  }, [])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="#FF8C42" transparent opacity={0.06} />
    </lineSegments>
  )
}

function StatusNodes() {
  const groupRef = useRef()
  const nodes = useMemo(() => [
    { pos: [-3, -0.9, 0], color: '#4ADE80' },
    { pos: [-1, -0.9, 0], color: '#FF8C42' },
    { pos: [1, -0.9, 0], color: '#FFB366' },
    { pos: [3, -0.9, 0], color: '#4ADE80' },
  ], [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.type === 'Mesh') child.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2 + i) * 0.15)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <group key={i}>
          <mesh position={n.pos}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={n.color} />
          </mesh>
          <mesh position={n.pos}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={n.color} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function DataFlow3D({ style = {} }) {
  return (
    <Scene3D className="scene-inline" style={{ height: '200px', ...style }} camera={{ position: [0, 0, 5], fov: 40 }}>
      <ambientLight intensity={0.2} />
      <PipelineLines />
      <ParticleStream count={150} color="#FF8C42" speed={1} />
      <ParticleStream count={80} color="#FFB366" speed={0.7} />
      <StatusNodes />
    </Scene3D>
  )
}
