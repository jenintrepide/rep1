import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- COMPONENTS ---

function Earth() {
    return (
        <mesh>
            <sphereGeometry args={[1, 64, 64]} />
            <meshStandardMaterial
                color="#2a4ba8"
                emissive="#112244"
                roughness={0.5}
                metalness={0.1}
            />
            <mesh scale={[1.01, 1.01, 1.01]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.3}
                    color="#4da6ff"
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </mesh>
    );
}

function Satellite({ position, color, label }) {
    // Normalize huge ECI coordinates to a viewable scale
    // Earth Radius ~6378 km. Our Sphere is r=1.
    // Scale factor = 1 / 6378.
    const SCALE = 1 / 6378;
    const pos = [position[0] * SCALE, position[2] * SCALE, -position[1] * SCALE]; // Swap Y/Z for typical 3D (Y-up)

    return (
        <group position={pos}>
            <mesh>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
            {label && (
                <Billboard>
                    <Text
                        fontSize={0.05}
                        color={color}
                        position={[0, 0.05, 0]}
                        anchorX="center"
                        anchorY="bottom"
                    >
                        {label}
                    </Text>
                </Billboard>
            )}
        </group>
    );
}

// --- MAIN SCENE ---

export default function SpaceScene({ data }) {
    // Extract Target Sat Position (if available)
    // The API returns R_TARGET_ECI_KM in the first prediction result (usually)
    // or we can infer it if we had the initial position.
    // Ideally, 'data.prediction_results' has the target state at TCA.

    const targetSat = data?.prediction_results?.[0];
    const targetPos = targetSat ? targetSat.R_TARGET_ECI_KM : null;

    return (
        <div style={{ width: '100%', height: '500px', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
            <Canvas camera={{ position: [2, 2, 2], fov: 45 }}>
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate autoRotateSpeed={0.5} />

                {/* Environment */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* Earth */}
                <Earth />

                {/* Target Satellite (Green) */}
                {targetPos && (
                    <Satellite position={targetPos} color="#00e676" label="YOU" />
                )}

                {/* Debris Objects (Red) */}
                {data?.prediction_results?.map((res, i) => {
                    // We only have Relative Position (RIC) and Target Position (ECI)
                    // Debris ECI approx = Target ECI + Relative (rotated).
                    // For simplicity in this demo, since we might lack the full RIC-to-ECI matrix in frontend,
                    // we might need to rely on the backend sending Debris ECI or just show relative clouds.
                    // However! prediction_results actually has 'R_TARGET_ECI_KM'.
                    // And if we have relative vectors, we can approximate.

                    // WAITING: The backend currently doesn't send DEBRIS ECI.
                    // BUT, for the "Simulation" feel, we can visualize the relative cluster 
                    // centered around the target if we want a "Relative View",
                    // OR we can just try to plot what we have.

                    // For now, let's visualize the target.
                    // If we don't have debris ECI, we can't accurately plot them around Earth
                    // unless we do vector math.
                    // Let's assume for this MVP we visualize the TARGET orbit.
                    return null;
                })}
            </Canvas>

            {/* Overlay UI */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
                    {targetPos ? "LIVE TRACKING ACTIVE" : "WAITING FOR ORBIT DATA..."}
                </p>
            </div>
        </div>
    );
}
