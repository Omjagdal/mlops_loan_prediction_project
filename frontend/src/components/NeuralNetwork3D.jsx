import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Scene3D from './Scene3D'

/**
 * NeuralNetwork3D — Animated 3D neural network in warm ember tones
 */

function NetworkNodes() {
  const groupRef = useRef()

  const { nodes, linePositions } = useMemo(() => {
    const layers = [4, 6, 8, 6, 3]
    const nodeList = []
    const connPositions = []
    const layerSpacing = 1.2

    layers.forEach((count, layerIdx) => {
      const x = (layerIdx - (layers.length - 1) / 2) * layerSpacing
      for (let i = 0; i < count; i++) {
        const y = (i - (count - 1) / 2) * 0.5
        const z = (Math.random() - 0.5) * 0.3
        nodeList.push({ position: new THREE.Vector3(x, y, z), layer: layerIdx })
      }
    })

    let prevStart = 0, prevCount = layers[0]
    for (let l = 1; l < layers.length; l++) {
      const currStart = prevStart + prevCount
      const currCount = layers[l]
      for (let i = 0; i < prevCount; i++) {
        for (let j = 0; j < currCount; j++) {
          if (Math.random() > 0.4) {
            const from = nodeList[prevStart + i].position
            const to = nodeList[currStart + j].position
            connPositions.push(from.x, from.y, from.z, to.x, to.y, to.z)
          }
        }
      }
      prevStart = currStart
      prevCount = currCount
    }

    return { nodes: nodeList, linePositions: new Float32Array(connPositions) }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.15
      groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={linePositions.length / 3} array={linePositions} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#FF8C42" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={node.layer === 0 || node.layer === 4 ? '#FFB366' : '#FF8C42'} transparent opacity={0.7} />
        </mesh>
      ))}
      {nodes.filter(n => n.layer === 0 || n.layer === 4).map((node, i) => (
        <mesh key={`glow-${i}`} position={node.position}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#FF8C42" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function NeuralNetwork3D({ style = {}, className = '' }) {
  return (
    <Scene3D className={className || "scene-inline"} style={{ height: '250px', ...style }} camera={{ position: [0, 0, 5], fov: 40 }}>
      <ambientLight intensity={0.2} />
      <NetworkNodes />
    </Scene3D>
  )
}
