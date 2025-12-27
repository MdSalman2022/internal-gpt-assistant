'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

// Neural Network Node
function NeuralNode({ color = '#8b5cf6' }) {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = clock.getElapsedTime() * 0.3;
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.4;
        }
    });

    const connections = useMemo(() => {
        const lines = [];
        const nodePositions = [
            [0, 0, 0], [0.6, 0.3, 0.2], [-0.5, 0.5, -0.1], [0.4, -0.5, 0.3], [-0.6, -0.3, 0.2]
        ];
        for (let i = 0; i < nodePositions.length; i++) {
            for (let j = i + 1; j < nodePositions.length; j++) {
                if (Math.random() > 0.3) lines.push([nodePositions[i], nodePositions[j]]);
            }
        }
        return lines;
    }, []);

    return (
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
            <group ref={meshRef}>
                <mesh>
                    <icosahedronGeometry args={[0.2, 1]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.7} />
                </mesh>
                {[[0.6, 0.3, 0.2], [-0.5, 0.5, -0.1], [0.4, -0.5, 0.3], [-0.6, -0.3, 0.2]].map((pos, i) => (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshBasicMaterial color={color} transparent opacity={0.6} />
                    </mesh>
                ))}
                {connections.map((conn, i) => (
                    <line key={i}>
                        <bufferGeometry>
                            <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...conn[0], ...conn[1]])} itemSize={3} />
                        </bufferGeometry>
                        <lineBasicMaterial color={color} transparent opacity={0.3} />
                    </line>
                ))}
            </group>
        </Float>
    );
}

// Data Cube
function DataCube({ color = '#6366f1' }) {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.25;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <group ref={meshRef}>
                <mesh>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
                </mesh>
                <mesh>
                    <boxGeometry args={[0.25, 0.25, 0.25]} />
                    <meshBasicMaterial color={color} transparent opacity={0.35} />
                </mesh>
            </group>
        </Float>
    );
}

// Orbit Rings
function OrbitRings({ color = '#a855f7' }) {
    const groupRef = useRef();

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.x = clock.getElapsedTime() * 0.25;
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.4}>
            <group ref={groupRef}>
                <mesh>
                    <torusGeometry args={[0.4, 0.02, 16, 50]} />
                    <meshBasicMaterial color={color} transparent opacity={0.7} />
                </mesh>
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                    <torusGeometry args={[0.32, 0.015, 16, 50]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                </mesh>
                <mesh rotation={[0, Math.PI / 3, Math.PI / 4]}>
                    <torusGeometry args={[0.25, 0.012, 16, 50]} />
                    <meshBasicMaterial color={color} transparent opacity={0.5} />
                </mesh>
                <mesh>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>
            </group>
        </Float>
    );
}

// Shield
function Shield3D({ color = '#10b981' }) {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.4;
            meshRef.current.rotation.x = clock.getElapsedTime() * 0.1;
        }
    });

    return (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
            <group ref={meshRef}>
                <mesh>
                    <octahedronGeometry args={[0.4, 0]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.7} />
                </mesh>
                <mesh>
                    <octahedronGeometry args={[0.25, 0]} />
                    <meshBasicMaterial color={color} transparent opacity={0.35} />
                </mesh>
            </group>
        </Float>
    );
}

// Gear
function Gear({ color = '#f59e0b' }) {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.z = clock.getElapsedTime() * 0.4;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
            <group ref={meshRef}>
                <mesh>
                    <torusGeometry args={[0.35, 0.05, 8, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.7} />
                </mesh>
                <mesh>
                    <torusGeometry args={[0.18, 0.03, 8, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                </mesh>
            </group>
        </Float>
    );
}

// Chat Bubble
function ChatBubble({ color = '#ec4899' }) {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.1;
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <group ref={meshRef}>
                <mesh>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.4} />
                </mesh>
                <mesh position={[0.3, -0.1, 0]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.35} />
                </mesh>
                <mesh position={[0.5, -0.2, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.3} />
                </mesh>
            </group>
        </Float>
    );
}

// Wrapper component for inline 3D scenes
function Scene3DInline({ children, className = '' }) {
    return (
        <div className={`pointer-events-none ${className}`}>
            <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ background: 'transparent' }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.5} />
                {children}
            </Canvas>
        </div>
    );
}

// Export individual scene components for each section
export function HeroScene() {
    return (
        <Scene3DInline className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-60">
            <NeuralNode color="#8b5cf6" />
        </Scene3DInline>
    );
}

export function HowItWorksScene() {
    return (
        <Scene3DInline className="absolute left-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-50">
            <DataCube color="#8b5cf6" />
        </Scene3DInline>
    );
}

export function PlatformScene() {
    return (
        <Scene3DInline className="absolute right-0 top-1/3 w-[350px] h-[350px] opacity-50">
            <OrbitRings color="#6366f1" />
        </Scene3DInline>
    );
}

export function FeaturesScene() {
    return (
        <Scene3DInline className="absolute left-0 top-1/4 w-[280px] h-[280px] opacity-50">
            <NeuralNode color="#a855f7" />
        </Scene3DInline>
    );
}

export function SecurityScene() {
    return (
        <Scene3DInline className="absolute right-0 bottom-1/4 w-[320px] h-[320px] opacity-50">
            <Shield3D color="#10b981" />
        </Scene3DInline>
    );
}

export function UseCasesScene() {
    return (
        <Scene3DInline className="absolute left-0 top-1/3 w-[300px] h-[300px] opacity-50">
            <Gear color="#f59e0b" />
        </Scene3DInline>
    );
}

export function TestimonialsScene() {
    return (
        <Scene3DInline className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px] h-[280px] opacity-50">
            <ChatBubble color="#ec4899" />
        </Scene3DInline>
    );
}

export function PricingScene() {
    return (
        <Scene3DInline className="absolute left-0 bottom-1/4 w-[300px] h-[300px] opacity-50">
            <OrbitRings color="#8b5cf6" />
        </Scene3DInline>
    );
}

export function CTAScene() {
    return (
        <Scene3DInline className="absolute right-10 top-1/2 -translate-y-1/2 w-[250px] h-[250px] opacity-40">
            <NeuralNode color="#a855f7" />
        </Scene3DInline>
    );
}

// Keep default export for backward compatibility but it's empty now
export default function Scene3D() {
    return null;
}
