import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

function SatelliteModel({ data }) {
    const group = useRef();
    const solarPanelLeft = useRef();
    const solarPanelRight = useRef();

    // Use fuel level to determine glow intensity
    const fuelGlow = useMemo(() => {
        const fuel = parseFloat(data.fuel_remaining_kg) || 0;
        const maxFuel = 1000;
        return Math.min(Math.max(fuel / maxFuel, 0.1), 1.0);
    }, [data.fuel_remaining_kg]);

    // Use inclination to set base tilt
    const inclination = useMemo(() => {
        const inc = parseFloat(data.inclination_deg) || 45;
        return (inc * Math.PI) / 180;
    }, [data.inclination_deg]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            group.current.rotation.y += 0.005;
            group.current.position.y = Math.sin(t * 0.5) * 0.1;
        }
    });

    return (
        <group ref={group} rotation={[inclination, 0, 0]}>
            {/* Main Body - Light Silver finish */}
            <mesh castShadow>
                <cylinderGeometry args={[0.6, 0.8, 1.5, 6]} />
                <meshStandardMaterial
                    color="#f8f9fa"
                    metalness={0.5}
                    roughness={0.3}
                />
            </mesh>

            {/* Core Details / Banding */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.62, 0.62, 0.1, 6]} />
                <meshStandardMaterial color="#2d3436" metalness={0.2} />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.72, 0.72, 0.1, 6]} />
                <meshStandardMaterial color="#2d3436" metalness={0.2} />
            </mesh>

            {/* Solar Panel Arms */}
            <group position={[0, 0, 0]}>
                {/* Left Panel */}
                <group position={[-0.8, 0, 0]}>
                    <mesh ref={solarPanelLeft}>
                        <boxGeometry args={[1.5, 0.05, 0.6]} />
                        <meshStandardMaterial
                            color="#1e272e"
                            metalness={0.7}
                            roughness={0.3}
                        />
                    </mesh>
                    <mesh position={[0, 0.03, 0]}>
                        <boxGeometry args={[1.4, 0.01, 0.5]} />
                        <meshBasicMaterial color="#34e7e4" wireframe />
                    </mesh>
                </group>

                {/* Right Panel */}
                <group position={[0.8, 0, 0]}>
                    <mesh ref={solarPanelRight}>
                        <boxGeometry args={[1.5, 0.05, 0.6]} />
                        <meshStandardMaterial
                            color="#1e272e"
                            metalness={0.7}
                            roughness={0.3}
                        />
                    </mesh>
                    <mesh position={[0, 0.03, 0]}>
                        <boxGeometry args={[1.4, 0.01, 0.5]} />
                        <meshBasicMaterial color="#34e7e4" wireframe />
                    </mesh>
                </group>
            </group>

            {/* Thruster Base */}
            <mesh position={[0, -0.9, 0]}>
                <cylinderGeometry args={[0.3, 0.15, 0.4, 16]} />
                <meshStandardMaterial color="#34495e" metalness={0.6} />
            </mesh>

            {/* Thruster Glow */}
            <mesh position={[0, -1.1, 0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial
                    color={data.thrusters_available > 0 ? "#ffffff" : "#4b6584"}
                    transparent
                    opacity={fuelGlow * 0.8}
                />
                <pointLight
                    intensity={fuelGlow * 3}
                    distance={3}
                    color={data.thrusters_available > 0 ? "#ffffff" : "#778ca3"}
                />
            </mesh>

            {/* Communications Dish */}
            <group position={[0, 0.8, 0.3]} rotation={[Math.PI / 4, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        side={THREE.DoubleSide}
                        metalness={0.4}
                        roughness={0.4}
                    />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
                    <meshStandardMaterial color="#2d3436" />
                </mesh>
            </group>
        </group>
    );
}

const SatelliteVisualizer = memo(({ data }) => {
    return (
        <div className="w-full h-full min-h-[300px] relative">
            <Canvas shadows gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35} />

                {/* Improved Lighting */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
                <pointLight position={[-5, -5, -5]} intensity={0.5} color="#3b82f6" />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.15}
                    penumbra={1}
                    intensity={2}
                    castShadow
                />

                {/* Scene Content */}
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <SatelliteModel data={data} />
                </Float>

                {/* Subtle Star background */}
                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

                {/* Grid Floor Overlay */}
                <gridHelper args={[10, 10, '#2d3436', '#09090b']} position={[0, -2, 0]} />
            </Canvas>

            {/* Label Overlay */}
            <div className="absolute top-4 left-4 font-mono text-[10px] text-zinc-600 tracking-widest uppercase pointer-events-none">
                SIM_LINK: ACTIVE<br />
                OBJ_ID: {data.name || 'UNKNOWN'}<br />
                INC: {data.inclination_deg || '0.0'}°
            </div>

            <div className="absolute bottom-4 right-4 font-mono text-[9px] text-zinc-800 tracking-widest uppercase pointer-events-none text-right">
                RENDERING_CORE_v4.2<br />
                ORTHO_VIEW_STABLE
            </div>

            {/* HUD Corner Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-zinc-800/50" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-zinc-800/50" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-zinc-800/50" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-zinc-800/50" />
            </div>
        </div>
    );
});

export default SatelliteVisualizer;
