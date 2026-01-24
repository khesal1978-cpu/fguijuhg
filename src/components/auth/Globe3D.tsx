import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

// Glowing node on the globe
const GlobeNode = ({ position, size = 0.04 }: { position: [number, number, number]; size?: number }) => {
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + position[0] * 5) * 0.4;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      {/* Outer glow - larger and more visible */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 4, 16, 16]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.35} />
      </mesh>
      {/* Middle glow */}
      <mesh>
        <sphereGeometry args={[size * 2, 16, 16]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
      </mesh>
      {/* Core - bright and visible */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color="#e9d5ff" />
      </mesh>
    </group>
  );
};

// Connection line between nodes
const ConnectionLine = ({ start, end }: { start: [number, number, number]; end: [number, number, number] }) => {
  return (
    <Line
      points={[start, end]}
      color="#c084fc"
      lineWidth={1.5}
      transparent
      opacity={0.6}
    />
  );
};

// Main Globe component
const GlobeScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Slow rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0015;
    }
  });

  // Node positions - positioned on the FRONT visible face of the globe (positive Z)
  const nodePositions: [number, number, number][] = useMemo(() => {
    const radius = 1.03;
    const nodes: [number, number, number][] = [];
    
    // Nodes positioned to be visible on front of globe (Z > 0)
    const nodeData = [
      { x: 0.3, y: 0.2, z: 0.9 },    // front-center right
      { x: 0.5, y: 0.4, z: 0.75 },   // upper right
      { x: 0.6, y: 0.1, z: 0.78 },   // center right
      { x: 0.7, y: -0.2, z: 0.65 },  // lower right
      { x: 0.4, y: -0.4, z: 0.8 },   // bottom right
      { x: 0.1, y: 0.5, z: 0.85 },   // upper center
      { x: -0.2, y: 0.3, z: 0.92 },  // upper left
      { x: 0.55, y: 0.55, z: 0.6 },  // far upper right
      { x: 0.3, y: -0.1, z: 0.94 },  // center
      { x: 0.65, y: 0.3, z: 0.68 },  // mid right
      { x: 0.2, y: 0.6, z: 0.75 },   // upper
      { x: 0.45, y: -0.3, z: 0.82 }, // lower center-right
    ];
    
    // Normalize to sphere surface
    nodeData.forEach(({ x, y, z }) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      nodes.push([
        (x / len) * radius,
        (y / len) * radius,
        (z / len) * radius
      ]);
    });
    
    return nodes;
  }, []);

  // Connection pairs
  const connections: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 4],
    [1, 5], [5, 6], [1, 7], [0, 8], [2, 9],
    [5, 10], [8, 11], [4, 11], [9, 7],
  ];

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} />
      
      {/* Main light from top-left - creates the highlight */}
      <directionalLight position={[-4, 4, 6]} intensity={1.8} color="#e9d5ff" />
      <directionalLight position={[3, -1, 4]} intensity={0.6} color="#a855f7" />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#c084fc" />
      
      {/* Globe group */}
      <group ref={groupRef}>
        {/* Main sphere - deep purple */}
        <Sphere args={[1, 64, 64]}>
          <meshPhongMaterial
            color="#3b0764"
            emissive="#581c87"
            emissiveIntensity={0.3}
            shininess={30}
            transparent
            opacity={0.98}
          />
        </Sphere>
        
        {/* Subtle inner glow layer */}
        <Sphere args={[0.99, 64, 64]}>
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.15}
          />
        </Sphere>

        {/* Nodes */}
        {nodePositions.map((pos, i) => (
          <GlobeNode key={i} position={pos} size={0.035 + (i % 3) * 0.012} />
        ))}

        {/* Connections */}
        {connections.map(([startIdx, endIdx], i) => (
          <ConnectionLine
            key={i}
            start={nodePositions[startIdx]}
            end={nodePositions[endIdx]}
          />
        ))}
      </group>

      {/* Atmosphere glow - edge rim */}
      <mesh>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer atmosphere - softer edge */}
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
};

const Globe3D = () => {
  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto">
      {/* Purple glow behind globe */}
      <div 
        className="absolute inset-[-20%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 40%, hsl(262, 83%, 50% / 0.35) 0%, hsl(262, 83%, 35% / 0.2) 40%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <GlobeScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Globe3D;
