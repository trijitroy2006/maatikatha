'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ---- Types ----
export interface CropModelProps {
  waterLevel: number;   // 0–100
  compostLevel: number; // 0–100
  pestDamage: number;   // 0–100
}

// ---- Leaf color based on health ----
function getLeafColor(waterLevel: number, pestDamage: number): string {
  if (pestDamage > 60) return '#8B0000';         // dark red — severe pest
  if (pestDamage > 30) return '#FF6600';         // orange — mild pest
  if (waterLevel < 25) return '#8B6914';         // brown — drought
  if (waterLevel < 45) return '#A8B820';         // pale green — thirsty
  return '#2D7A1F';                              // healthy deep green
}

function getStemColor(waterLevel: number): string {
  if (waterLevel < 25) return '#8B6914';
  return '#5C4A1E';
}

// ---- Potato (tuber) underground ----
function Potato({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={position} scale={[scale, scale * 0.75, scale]}>
      <sphereGeometry args={[0.18, 8, 6]} />
      <meshStandardMaterial color="#C8A26E" roughness={0.95} />
    </mesh>
  );
}

// ---- Single leaf cluster ----
function LeafCluster({
  position,
  rotation,
  color,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main leaf */}
      <mesh rotation={[0, 0, 0.3]}>
        <ellipseGeometry args={[0.15, 0.28, 8]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      {/* Secondary leaf */}
      <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -0.4]}>
        <ellipseGeometry args={[0.12, 0.22, 8]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      {/* Tertiary leaf */}
      <mesh position={[-0.18, 0.08, 0]} rotation={[0, 0, 0.5]}>
        <ellipseGeometry args={[0.10, 0.18, 8]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ---- Pest damage spots ----
function PestSpots({ count }: { count: number }) {
  const spots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.sin(i * 2.3) * 0.6),
        (Math.cos(i * 1.7) * 0.8 + 0.5),
        (Math.sin(i * 3.1) * 0.3),
      ] as [number, number, number],
      scale: 0.04 + Math.random() * 0.04,
    }));
  }, [count]);

  return (
    <>
      {spots.map((s, i) => (
        <mesh key={i} position={s.position} scale={s.scale}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color="#4A0000" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

// ---- Soil ground disk ----
function SoilGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
      <circleGeometry args={[1.6, 24]} />
      <meshStandardMaterial color="#5C3A1E" roughness={1} />
    </mesh>
  );
}

// ---- Main plant group with animation ----
function PotatoPlant({ waterLevel, compostLevel, pestDamage }: CropModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Derived visual properties
  const leafColor   = getLeafColor(waterLevel, pestDamage);
  const stemColor   = getStemColor(waterLevel);
  const plantScale  = 0.7 + (compostLevel / 100) * 0.6; // 0.7x → 1.3x based on compost
  const droop       = waterLevel < 30 ? 0.15 : 0;        // Droop when thirsty
  const pestSpots   = Math.floor((pestDamage / 100) * 12);

  // Gentle sway animation
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03 + droop;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.015;
    }
  });

  return (
    <group ref={groupRef} scale={plantScale}>
      {/* ---- UNDERGROUND ---- */}
      {/* Root potatoes */}
      <Potato position={[0.35,  -0.85, 0.2]}  scale={1.0} />
      <Potato position={[-0.3,  -0.9,  0.1]}  scale={0.8} />
      <Potato position={[0.1,   -1.0,  -0.25]} scale={0.9} />
      <Potato position={[-0.15, -0.75, -0.3]}  scale={0.7} />

      {/* Root tendrils */}
      <mesh position={[0, -0.82, 0]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.008, 0.4, 6]} />
        <meshStandardMaterial color="#8B6914" roughness={1} />
      </mesh>

      {/* ---- ABOVE GROUND ---- */}
      {/* Main stem */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 1.6, 8]} />
        <meshStandardMaterial color={stemColor} roughness={0.85} />
      </mesh>

      {/* Branch stems */}
      <mesh position={[0.22, 0.3, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.025, 0.035, 0.55, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.85} />
      </mesh>
      <mesh position={[-0.2, 0.5, 0.1]} rotation={[0.2, 0, 0.45]}>
        <cylinderGeometry args={[0.022, 0.032, 0.5, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.1, 0.7, -0.15]} rotation={[-0.1, 0, -0.35]}>
        <cylinderGeometry args={[0.018, 0.028, 0.45, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.85} />
      </mesh>

      {/* Leaf clusters at various heights */}
      <LeafCluster position={[0.22, 0.58, 0]}    rotation={[-0.3, 0.5, 0]}  color={leafColor} scale={1.1} />
      <LeafCluster position={[-0.2, 0.75, 0.1]}  rotation={[0.2, -0.4, 0]}  color={leafColor} scale={1.0} />
      <LeafCluster position={[0.1, 0.95, -0.15]} rotation={[-0.1, 0.8, 0]}  color={leafColor} scale={0.9} />
      <LeafCluster position={[0, 1.15, 0]}       rotation={[0, 0, 0]}        color={leafColor} scale={1.2} />
      <LeafCluster position={[-0.08, 0.45, 0.1]} rotation={[0.3, -0.6, 0.2]} color={leafColor} scale={0.85} />
      <LeafCluster position={[0.18, 0.2, -0.1]}  rotation={[-0.2, 0.3, -0.2]} color={leafColor} scale={0.75} />

      {/* Flower buds (only when healthy and watered) */}
      {waterLevel > 60 && pestDamage < 30 && (
        <>
          <mesh position={[0, 1.28, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color="#E8D5FF" roughness={0.4} />
          </mesh>
          <mesh position={[0.22, 1.12, 0]}>
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshStandardMaterial color="#D4B8FF" roughness={0.4} />
          </mesh>
        </>
      )}

      {/* Pest damage spots overlay */}
      {pestSpots > 0 && <PestSpots count={pestSpots} />}

      {/* Soil ground */}
      <SoilGround />
    </group>
  );
}

// ---- Canvas wrapper (exported) ----
export function CropModel({ waterLevel, compostLevel, pestDamage }: CropModelProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 3.5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      shadows
    >
      <color attach="background" args={['#FFFDE7']} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <pointLight position={[0, 4, 0]} intensity={0.4} />

      <PotatoPlant
        waterLevel={waterLevel}
        compostLevel={compostLevel}
        pestDamage={pestDamage}
      />

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.6}
      />
      <Environment preset="forest" />
    </Canvas>
  );
}
