import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

// Glowing node on the globe - brighter and more visible
const GlobeNode = ({ position, size = 0.035, delay = 0 }: { position: [number, number, number]; size?: number; delay?: number }) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime + delay;
    if (glowRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.5;
      glowRef.current.scale.setScalar(scale);
    }
    if (outerRef.current) {
      const scale = 1 + Math.sin(time * 1.5) * 0.3;
      outerRef.current.scale.setScalar(scale);
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(time * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Outer pulse ring */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[size * 6, 16, 16]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.2} />
      </mesh>
      {/* Middle glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 3, 16, 16]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial color="#d8b4fe" transparent opacity={0.8} />
      </mesh>
      {/* Bright core */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

// Connection line between nodes with glow effect
const ConnectionLine = ({ start, end }: { start: [number, number, number]; end: [number, number, number] }) => {
  return (
    <>
      {/* Outer glow line */}
      <Line
        points={[start, end]}
        color="#a855f7"
        lineWidth={2}
        transparent
        opacity={0.3}
      />
      {/* Core line */}
      <Line
        points={[start, end]}
        color="#c084fc"
        lineWidth={1}
        transparent
        opacity={0.7}
      />
    </>
  );
};

// Main Globe component
const GlobeScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  // Slow rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
    // Subtle atmosphere pulse
    if (atmosphereRef.current) {
      const scale = 1.12 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      atmosphereRef.current.scale.setScalar(scale);
    }
  });

  // Node positions - clustered on right side like in reference
  const nodePositions: [number, number, number][] = useMemo(() => {
    const radius = 1.02;
    const nodes: [number, number, number][] = [];
    
    // Nodes positioned to match reference image - clustered on right/bottom side
    const nodeData = [
      // Main cluster (right side)
      { x: 0.6, y: -0.1, z: 0.78 },   // center right
      { x: 0.7, y: 0.15, z: 0.68 },   // upper right
      { x: 0.75, y: -0.25, z: 0.6 },  // lower right
      { x: 0.5, y: -0.35, z: 0.78 },  // bottom center-right
      { x: 0.65, y: -0.45, z: 0.6 },  // bottom right
      { x: 0.45, y: 0.1, z: 0.88 },   // center
      { x: 0.55, y: 0.35, z: 0.75 },  // upper center
      { x: 0.8, y: 0.0, z: 0.55 },    // far right
      { x: 0.4, y: -0.2, z: 0.88 },   // left of center
      { x: 0.7, y: -0.35, z: 0.6 },   // lower far right
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

  // Connection pairs forming a network
  const connections: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 5],
    [1, 6], [1, 7],
    [2, 4], [2, 7],
    [3, 4], [3, 8],
    [4, 9],
    [5, 6], [5, 8],
    [6, 7],
    [8, 0],
  ];

  // Create earth-like texture with continents
  const earthMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Deep space purple base
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#2d1b4e');
    gradient.addColorStop(0.5, '#1a0f2e');
    gradient.addColorStop(1, '#0d0619');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Add continent-like shapes with subtle purple tint
    ctx.fillStyle = 'rgba(88, 28, 135, 0.4)';
    
    // North America-ish
    ctx.beginPath();
    ctx.ellipse(100, 80, 50, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America-ish
    ctx.beginPath();
    ctx.ellipse(130, 160, 25, 45, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa-ish
    ctx.beginPath();
    ctx.ellipse(270, 100, 30, 60, 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia-ish
    ctx.beginPath();
    ctx.ellipse(380, 80, 60, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia-ish
    ctx.beginPath();
    ctx.ellipse(420, 180, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  }, []);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.3} />
      
      {/* Main light from top-left - creates the bright rim highlight */}
      <directionalLight position={[-3, 3, 4]} intensity={2} color="#e9d5ff" />
      <directionalLight position={[-2, 2, 2]} intensity={1.5} color="#c084fc" />
      
      {/* Fill light */}
      <directionalLight position={[2, -1, 3]} intensity={0.5} color="#7c3aed" />
      
      {/* Rim light for edge glow */}
      <pointLight position={[-2, 2, -1]} intensity={1} color="#a855f7" />
      
      {/* Globe group */}
      <group ref={groupRef}>
        {/* Main earth sphere */}
        <Sphere args={[1, 64, 64]}>
          <meshPhongMaterial
            map={earthMaterial}
            color="#4c1d95"
            emissive="#581c87"
            emissiveIntensity={0.2}
            shininess={15}
            transparent
            opacity={0.95}
          />
        </Sphere>
        
        {/* Atmosphere rim glow - inner */}
        <Sphere args={[1.02, 64, 64]}>
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.08}
            side={THREE.FrontSide}
          />
        </Sphere>

        {/* Nodes */}
        {nodePositions.map((pos, i) => (
          <GlobeNode 
            key={i} 
            position={pos} 
            size={0.03 + (i % 3) * 0.008}
            delay={i * 0.5}
          />
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

      {/* Outer atmosphere glow - creates the purple rim effect */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.12, 64, 64]} />
        <meshBasicMaterial
          color="#9333ea"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Larger outer glow */}
      <mesh>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
};

const Globe3D = () => {
  return (
    <div className="relative w-full max-w-[320px] aspect-square mx-auto">
      {/* Ambient purple glow behind globe */}
      <div 
        className="absolute inset-[-30%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(147, 51, 234, 0.4) 0%, rgba(124, 58, 237, 0.2) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Secondary glow for depth */}
      <div 
        className="absolute inset-[-10%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(192, 132, 252, 0.25) 0%, transparent 50%)',
          filter: 'blur(20px)',
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 2.6], fov: 45 }}
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