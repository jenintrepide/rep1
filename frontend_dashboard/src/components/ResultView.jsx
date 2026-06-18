import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Billboard, Text, PerspectiveCamera, Float, Line, Sphere } from '@react-three/drei';
import { useMemo, useState, useRef, memo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Target, Shield, AlertCircle,
    Activity, Gauge, Calendar, Info, ChevronRight, ChevronLeft,
    Satellite as SatelliteIcon, Box, Zap, Search, Filter, X,
    ChevronUp, ChevronDown, Maximize, Play, Pause, Maximize2, Move, Minimize, Filter as FilterIcon, ArrowLeftCircle, XCircle, Globe, RefreshCw
} from 'lucide-react';
import predictionData from '../../../prediction_output.json';
import decisionData from '../../../decision_output.json';

// --- 3D COMPONENTS ---

function SatelliteModel() {
    const group = useRef();
    const solarPanelLeft = useRef();
    const solarPanelRight = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            group.current.rotation.y += 0.005;
            group.current.position.y = Math.sin(t * 0.5) * 0.1;
        }
    });

    return (
        <group ref={group} rotation={[0.5, 0, 0]}>
            <mesh castShadow>
                <cylinderGeometry args={[0.6, 0.8, 1.5, 6]} />
                <meshStandardMaterial color="#f8f9fa" metalness={0.5} roughness={0.3} />
            </mesh>
            <group>
                <group position={[-0.8, 0, 0]}>
                    <mesh ref={solarPanelLeft}>
                        <boxGeometry args={[1.5, 0.05, 0.6]} />
                        <meshStandardMaterial color="#1e272e" metalness={0.7} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0.03, 0]}>
                        <boxGeometry args={[1.4, 0.01, 0.5]} />
                        <meshBasicMaterial color="#34e7e4" wireframe />
                    </mesh>
                </group>
                <group position={[0.8, 0, 0]}>
                    <mesh ref={solarPanelRight}>
                        <boxGeometry args={[1.5, 0.05, 0.6]} />
                        <meshStandardMaterial color="#1e272e" metalness={0.7} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0.03, 0]}>
                        <boxGeometry args={[1.4, 0.01, 0.5]} />
                        <meshBasicMaterial color="#34e7e4" wireframe />
                    </mesh>
                </group>
            </group>
            <mesh position={[0, -0.9, 0]}>
                <cylinderGeometry args={[0.3, 0.15, 0.4, 16]} />
                <meshStandardMaterial color="#34495e" metalness={0.6} />
            </mesh>
            <group position={[0, 0.8, 0.3]} rotation={[Math.PI / 4, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} metalness={0.4} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
                    <meshStandardMaterial color="#2d3436" />
                </mesh>
            </group>
        </group>
    );
}

function DebrisObject({ data, isSelected, onClick, positionMetadata }) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef();

    useFrame((state) => {
        if (isSelected && meshRef.current) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
            meshRef.current.scale.set(scale, scale, scale);
        } else if (meshRef.current) {
            meshRef.current.scale.set(1, 1, 1);
        }
    });

    const position = useMemo(() => {
        // Correct logic: Use R_OTHER_RELATIVE_KM from the specific prediction result
        if (positionMetadata && positionMetadata.R_OTHER_RELATIVE_KM) {
            const rel = positionMetadata.R_OTHER_RELATIVE_KM;
            // Scaling logic: 1km = 0.5 units in 3D space. 
            // Standard RIC frame mapping to X, Y, Z
            return new THREE.Vector3(rel[0] * 0.5, rel[1] * 0.5, rel[2] * 0.5);
        }

        // Professional Fallback: If no prediction data, check if the decision item itself has RIC context
        if (data.cdm_data && data.cdm_data.relative_position_ric) {
            const ric = data.cdm_data.relative_position_ric;
            return new THREE.Vector3(ric[0] * 0.5, ric[1] * 0.5, ric[2] * 0.5);
        }

        // Final random fallback with high entropy (spherical coordinates)
        let hash = 0;
        const str = data.other_id || data.debris_name || "OBJ";
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
        const seed = Math.abs(hash);
        const r = 15 + (seed % 25);
        const theta = (seed % 360) * (Math.PI / 180);
        const phi = ((seed >> 4) % 180) * (Math.PI / 180);

        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }, [data, positionMetadata]);

    const color = useMemo(() => {
        const level = (data.assessment?.severity_level || 'UNKNOWN').toUpperCase();
        switch (level) {
            case 'CRITICAL': return '#ef4444'; // Red
            case 'HIGH': return '#f97316';     // Orange
            case 'MEDIUM': return '#eab308';   // Yellow
            case 'LOW': return '#71717a';      // Zinc-500 equivalent (was white/dim)
            default: return '#ffffff';
        }
    }, [data]);

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={onClick}
                castShadow
            >
                <sphereGeometry args={[isSelected ? 0.6 : 0.4, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isSelected || hovered ? 2 : 0.2}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {(hovered || isSelected || (data.assessment?.severity_level === 'CRITICAL')) && (
                <Billboard>
                    <Text
                        position={[0, 1.2, 0]}
                        fontSize={0.4}
                        color={color}
                        anchorY="bottom"
                    >
                        {data.debris_name}
                    </Text>
                    <Text
                        position={[0, 0.8, 0]}
                        fontSize={0.2}
                        color="#71717a"
                        anchorY="bottom"
                    >
                        {(data.risk_metrics?.miss_distance_km || 0).toFixed(1)}KM
                    </Text>
                </Billboard>
            )}
        </group>
    );
}

const SceneManager = memo(({ selectedDebris, predictionResults, controlsRef, isPaused, simulatedManeuver }) => {
    const { camera } = useThree();

    useFrame((state, delta) => {
        if (isPaused) return; // Freeze simulation logic

        // PRIORITIZE SIMULATION VIEW
        if (simulatedManeuver) {
            const targetPos = new THREE.Vector3(0, 0, 0); // Focus on User Satellite
            const idealCamPos = new THREE.Vector3(5, 5, 10); // Close-up view for maneuver details

            camera.position.lerp(idealCamPos, delta * 3);

            if (controlsRef.current) {
                controlsRef.current.target.lerp(targetPos, delta * 3);
                controlsRef.current.update();
            } else {
                camera.lookAt(targetPos);
            }
            return;
        }

        if (selectedDebris) {
            const pred = predictionResults?.find(p => p.other_id === selectedDebris.other_id);
            let targetPos;

            if (pred && pred.R_OTHER_RELATIVE_KM) {
                const rel = pred.R_OTHER_RELATIVE_KM;
                targetPos = new THREE.Vector3(rel[0] * 0.5, rel[1] * 0.5, rel[2] * 0.5);
            } else if (selectedDebris.cdm_data?.relative_position_ric) {
                const ric = selectedDebris.cdm_data.relative_position_ric;
                targetPos = new THREE.Vector3(ric[0] * 0.5, ric[1] * 0.5, ric[2] * 0.5);
            } else {
                let hash = 0;
                const str = selectedDebris.other_id || selectedDebris.debris_name || "OBJ";
                for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
                const seed = Math.abs(hash);
                const r = 15 + (seed % 25);
                const theta = (seed % 360) * (Math.PI / 180);
                const phi = ((seed >> 4) % 180) * (Math.PI / 180);
                targetPos = new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
            }

            const offset = new THREE.Vector3(8, 4, 8);
            const idealPos = targetPos.clone().add(offset);

            camera.position.lerp(idealPos, delta * 2);
            if (controlsRef.current) {
                controlsRef.current.target.lerp(targetPos, delta * 4);
                controlsRef.current.update();
            } else {
                camera.lookAt(targetPos);
            }
        } else {
            const angle = state.clock.elapsedTime * 0.05;
            const radius = 35;
            const targetCamPos = new THREE.Vector3(Math.sin(angle) * radius, 20, Math.cos(angle) * radius);
            camera.position.lerp(targetCamPos, delta * 2);

            if (controlsRef.current) {
                controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), delta * 2);
                controlsRef.current.update();
            } else {
                camera.lookAt(0, 0, 0);
            }
        }
    });

    return null;
});

const DebrisTrajectory = ({ predictionEntry }) => {
    const {
        cdm_data,
        trajectory
    } = predictionEntry || {};

    const pointsData = useMemo(() => {
        if (!cdm_data?.relative_position_ric || !trajectory?.impact_vector) return null;

        const pos = cdm_data.relative_position_ric; // [R, I, C]
        const dir = trajectory.impact_vector; // Normalized direction

        // Scene scale factor
        const S = 0.5;

        // Center point (TCA) - mapped to scene coordinates
        // Assuming pred results are at TCA
        const center = new THREE.Vector3(pos[0] * S, pos[1] * S, pos[2] * S);

        // Direction vector
        const direction = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();

        // Line extend (100km each way equivalent)
        const length = 100 * S;

        const start = center.clone().add(direction.clone().multiplyScalar(-length));
        const end = center.clone().add(direction.clone().multiplyScalar(length));

        return { points: [start, end], center };
    }, [cdm_data, trajectory]);

    if (!pointsData) return null;
    const { points, center } = pointsData;

    return (
        <group>
            {/* Trajectory Line */}
            <Line
                points={points}
                color="#ef4444"
                lineWidth={1}
                dashed={true}
                dashScale={2}
                gapSize={1}
                opacity={0.6}
                transparent
            />

            {/* Collision / TCA Point */}
            <mesh position={center}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
            </mesh>
            <Billboard position={center}>
                <Text position={[0, 0.5, 0]} fontSize={0.3} color="#ef4444" anchorY="bottom">
                    TCA / IMPACT
                </Text>
            </Billboard>

            {/* End points fade */}
            <mesh position={points[0]}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="red" transparent opacity={0.2} />
            </mesh>
            <mesh position={points[1]}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="red" transparent opacity={0.2} />
            </mesh>
        </group>
    );
};

const TargetTrajectory = () => {
    // In RIC frame, Target is at (0,0,0) and moving along +Y (In-Track)
    const points = useMemo(() => {
        const length = 100; // Extend far enough
        return [
            new THREE.Vector3(0, -length, 0), // Retrograde
            new THREE.Vector3(0, length, 0)   // Prograde
        ];
    }, []);

    return (
        <group>
            {/* Main Orbit Line */}
            <Line
                points={points}
                color="#3b82f6" // Blue for "Ownship"
                lineWidth={1}
                dashed={true}
                dashScale={2}
                gapSize={1}
                opacity={0.3}
                transparent
            />
            {/* Direction Labels */}
            <Billboard position={[0, 8, 0]}>
                <Text fontSize={0.3} color="#3b82f6" fillOpacity={0.5} anchorY="bottom">
                    ORBIT TRACK (+V)
                </Text>
            </Billboard>
        </group>
    );
};

const ManeuverSimulation = ({ maneuver, isPlaying, onComplete, debrisData }) => {
    const ghostRef = useRef();
    const debrisRef = useRef();
    const [progress, setProgress] = useState(0);

    // Calculate Debris Start Position (from RIC or fallback)
    const debrisStartPos = useMemo(() => {
        if (!debrisData) return new THREE.Vector3(5, 0, 5); // Fallback

        // Try RIC
        if (debrisData.cdm_data?.relative_position_ric) {
            const ric = debrisData.cdm_data.relative_position_ric;
            return new THREE.Vector3(ric[0] * 0.5, ric[1] * 0.5, ric[2] * 0.5);
        }

        // Try Prediction list match if passed differently, usually debrisData is the full object
        return new THREE.Vector3(10, 5, 0);
    }, [debrisData]);

    useFrame((state, delta) => {
        if (!isPlaying || !ghostRef.current) return;

        if (progress < 1) {
            const newProgress = Math.min(1, progress + delta * 0.5); // 2 seconds duration
            setProgress(newProgress);

            // --- 1. SATELLITE MANEUVER ANIMATION ---
            const direction = new THREE.Vector3(0, 0, 0);
            const type = maneuver.maneuver || '';

            // RIC Frame Mapping: X=Radial, Y=In-Track, Z=Cross-Track
            if (type.includes('ALONG_TRACK')) {
                const sign = type.includes('RETROGRADE') ? -1 : 1;
                direction.set(0, sign, 0);
            }
            else if (type.includes('RADIAL')) {
                const sign = type.includes('INWARD') ? -1 : 1;
                direction.set(sign, 0, 0);
            }
            else if (type.includes('CROSS_TRACK')) {
                const sign = type.includes('ANTI_NORMAL') ? -1 : 1;
                direction.set(0, 0, sign);
            }

            const visualScale = 5;
            ghostRef.current.position.copy(direction.multiplyScalar(Math.sin(newProgress * Math.PI * 0.5) * visualScale));
            ghostRef.current.material.opacity = Math.sin(newProgress * Math.PI);

            // --- 2. DEBRIS INTERCEPTION ANIMATION ---
            if (debrisRef.current) {
                // Move from Start Pos to (0,0,0) [IMPACT POINT]
                const impactPos = new THREE.Vector3(0, 0, 0);
                debrisRef.current.position.lerpVectors(debrisStartPos, impactPos, newProgress);
            }

        } else {
            if (onComplete) onComplete();
        }
    });

    // Reset when not playing
    useFrame(() => {
        if (!isPlaying && progress > 0) setProgress(0);
    });

    if (!isPlaying) return null;

    return (
        <group>
            {/* Ghost Satellite showing new path */}
            <mesh ref={ghostRef}>
                <cylinderGeometry args={[0.6, 0.8, 1.5, 6]} />
                <meshStandardMaterial
                    color="#10b981"
                    transparent
                    opacity={0.5}
                    wireframe
                    emissive="#10b981"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Ghost Debris (Attacking) */}
            <mesh ref={debrisRef} position={debrisStartPos} castShadow>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial
                    color="#ef4444"
                    transparent
                    opacity={0.8}
                    emissive="#ef4444"
                    emissiveIntensity={1}
                />
            </mesh>
            <Billboard position={[0, -1.5, 0]}>
                <Text fontSize={0.25} color="#ef4444" anchorY="top">
                    IMPACT POINT
                </Text>
            </Billboard>

            {/* Trajectory Trace */}
            {progress > 0.1 && (
                <Line
                    points={[[0, 0, 0], ghostRef.current ? ghostRef.current.position : [0, 0, 0]]}
                    color="#10b981"
                    lineWidth={2}
                    dashed
                    dashScale={2}
                />
            )}
            {/* Debris Trail */}
            {progress > 0.1 && debrisRef.current && (
                <Line
                    points={[debrisStartPos, debrisRef.current.position]}
                    color="#ef4444"
                    lineWidth={1}
                    dashed
                    opacity={0.5}
                />
            )}
        </group>
    );
};

const SortIcon = ({ column, sortConfig }) => {
    if (sortConfig.key !== column) return <ChevronDown size={10} className="opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
};

// --- UI COMPONENTS ---

const SeverityBadge = ({ level }) => {
    const config = useMemo(() => {
        const normalizedLevel = (level || 'UNKNOWN').toUpperCase();
        switch (normalizedLevel) {
            case 'CRITICAL':
                return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/40' };
            case 'HIGH':
                return { label: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/40' };
            case 'MEDIUM':
                return { label: 'MEDIUM', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40' };
            case 'LOW':
                return { label: 'LOW', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/40' };
            default:
                return { label: normalizedLevel, color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/40' };
        }
    }, [level]);

    return (
        <span className={`px-2 py-0.5 border border-dashed rounded-none text-[9px] font-bold tracking-widest ${config.color} ${config.bg} ${config.border}`}>
            {config.label}
        </span>
    );
};

export default function ResultView({ data, onBack }) {
    const debrisList = useMemo(() => data.prediction_results || [], [data]);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'assessment.severity_score', direction: 'desc' });
    const [filterSeverity, setFilterSeverity] = useState('ALL');
    const [isPanelMaximized, setIsPanelMaximized] = useState(false);
    const [isRightPanelFull, setIsRightPanelFull] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [simulatedManeuver, setSimulatedManeuver] = useState(null);
    const [showAbortModal, setShowAbortModal] = useState(false);
    const [abortManeuver, setAbortManeuver] = useState(null);

    const controlsRef = useRef();




    // Sorting & Filtering Logic
    const processedDebris = useMemo(() => {
        let list = [...debrisList];

        if (searchTerm) {
            list = list.filter(d =>
                d.debris_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.other_id.toString().includes(searchTerm)
            );
        }

        if (filterSeverity !== 'ALL') {
            list = list.filter(d => {
                // Filter by the API string level directly
                const lvl = (d.assessment?.severity_level || '').toUpperCase();
                return lvl === filterSeverity;
            });
        }

        list.sort((a, b) => {
            let aVal, bVal;
            if (sortConfig.key === 'miss_distance_km') {
                aVal = a.risk_metrics?.miss_distance_km || 0;
                bVal = b.risk_metrics?.miss_distance_km || 0;
            } else if (sortConfig.key === 'assessment.severity_score') {
                aVal = a.assessment?.severity_score || 0;
                bVal = b.assessment?.severity_score || 0;
            } else {
                aVal = a[sortConfig.key];
                bVal = b[sortConfig.key];
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [debrisList, searchTerm, sortConfig, filterSeverity]);

    const paginatedDebris = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedDebris.slice(start, start + itemsPerPage);
    }, [processedDebris, currentPage]);

    const totalPages = Math.ceil(processedDebris.length / itemsPerPage);
    const selectedDebris = selectedIndex !== null ? debrisList.find(d => d.other_id === processedDebris[selectedIndex]?.other_id) || null : null;

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="h-screen bg-[#0a0a0c] text-zinc-300 font-mono flex overflow-hidden">
            {/* Texture overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            {/* LEFT PANEL: DATA & REPORT */}
            <div className={`${isPanelMaximized ? 'w-full' : (isRightPanelFull ? 'hidden' : 'w-1/2')} flex flex-col border-r border-dashed border-zinc-800/50 relative z-10 bg-[#0a0a0c]/40 backdrop-blur-sm transition-all duration-500`}>

                {/* Header */}
                <div className="p-8 border-b border-dashed border-zinc-800/50">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={onBack}
                            className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-2 tracking-[0.3em] uppercase transition-colors group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> [ BACK_TO_MISSION ]
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50">
                                <Activity size={24} className="text-zinc-100" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-light tracking-[0.4em] text-white uppercase">Analysis Report</h1>
                                <p className="text-[11px] text-zinc-500 tracking-[0.5em] uppercase mt-1">Conjunction Assessment v4.2</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPanelMaximized(!isPanelMaximized)}
                            className="p-2 border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all"
                            title={isPanelMaximized ? "Minimize Panel" : "Maximize Panel"}
                        >
                            {isPanelMaximized ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>

                {/* Condition Legend */}
                <div className="px-8 py-4 border-b border-dashed border-zinc-800/50 bg-black/20 flex flex-wrap gap-6 items-center">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mr-2">Risk Legend:</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                        <span className="text-[10px] text-zinc-400 tracking-wider font-mono">CRITICAL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                        <span className="text-[10px] text-zinc-400 tracking-wider font-mono">HIGH</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
                        <span className="text-[10px] text-zinc-400 tracking-wider font-mono">MEDIUM</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
                        <span className="text-[10px] text-zinc-400 tracking-wider font-mono">LOW</span>
                    </div>
                </div>

                {selectedDebris ? (
                    // DETAILED VIEW IN PANEL

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8" >
                        {/* Header Section */}
                        < div className="flex justify-between items-start mb-6" >
                            <div>
                                <h2 className="text-3xl font-light text-white tracking-[0.2em] uppercase">{selectedDebris.debris_name}</h2>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1 tracking-widest">ID_TAG: <span className="text-zinc-300">{selectedDebris.other_id}</span></p>
                            </div>
                            <button
                                onClick={() => setSelectedIndex(null)}
                                className="p-2 rounded-full border border-dashed border-zinc-700 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 transition-all group"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Top Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-zinc-900/50 border border-dashed border-zinc-800 flex flex-col justify-between">
                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Risk Severity</p>
                                <div className="flex items-center gap-3">
                                    <SeverityBadge level={selectedDebris.assessment?.severity_level} />
                                    <span className="text-2xl font-mono text-white">{(selectedDebris.assessment?.severity_score || 0).toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-zinc-900/50 border border-dashed border-zinc-800 flex flex-col justify-between">
                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Miss Distance</p>
                                <span className="text-2xl font-mono text-white">{(selectedDebris.risk_metrics?.miss_distance_km || 0).toFixed(3)} <span className="text-sm text-zinc-600">km</span></span>
                            </div>
                        </div>

                        {/* Detailed Data Sections */}
                        {(() => {
                            // selectedDebris is now the prediction entry
                            const predictionEntry = selectedDebris;

                            // Lookup matching decision entry for maneuvers
                            const decisionEntry = (data.decision_results || decisionData).find(d => String(d.other_id) === String(selectedDebris.other_id)) || {};

                            return (
                                <div className="space-y-8">

                                    {/* Impact Analysis */}
                                    <div className="p-6 bg-zinc-900/30 border border-dashed border-zinc-800">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Target size={14} className="text-red-500" />
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Collision Prognostics</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 font-mono text-xs">
                                            <div className="flex flex-col gap-1 border-b border-zinc-800/50 pb-2 mr-4">
                                                <span className="text-zinc-600 text-[9px] uppercase">Probability</span>
                                                <span className={`text-zinc-200 ${(predictionEntry.risk_metrics?.collision_probability) > 1e-6 ? 'text-red-400 font-bold' : ''}`}>
                                                    {(predictionEntry.risk_metrics?.collision_probability || 0).toExponential(2)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-800/50 pb-2">
                                                <span className="text-zinc-600 text-[9px] uppercase">Time of Impact</span>
                                                <span className="text-zinc-300">
                                                    {(predictionEntry.impact_time) ? new Date(predictionEntry.impact_time).toLocaleString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-800/50 pb-2 mr-4">
                                                <span className="text-zinc-600 text-[9px] uppercase">Impact Energy</span>
                                                <span className="text-zinc-300">
                                                    {(predictionEntry.risk_metrics?.energy_joules || 0).toExponential(2)} J
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-800/50 pb-2">
                                                <span className="text-zinc-600 text-[9px] uppercase">Confidence</span>
                                                <span className="text-zinc-300">
                                                    {(predictionEntry.confidence?.impact_time_confidence * 100)?.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-800/50 pb-2 mr-4">
                                                <span className="text-zinc-600 text-[9px] uppercase">Geometry</span>
                                                <span className="text-zinc-300">
                                                    {predictionEntry.trajectory?.impact_location || 'N/A'}
                                                </span>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Orbital Physics */}
                                    <div className="p-6 bg-zinc-900/30 border border-dashed border-zinc-800">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Globe size={14} className="text-blue-500" />
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Orbital State Vector</p>
                                        </div>

                                        <div className="space-y-4 font-mono text-xs">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-zinc-600 text-[9px] uppercase block mb-1">Regime</span>
                                                    <span className="text-zinc-300 border border-zinc-800 px-2 py-1 inline-block">
                                                        {predictionEntry.metadata?.regime || 'LEO'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-600 text-[9px] uppercase block mb-1">Target Velocity (Mag)</span>
                                                    <span className="text-zinc-300">
                                                        {predictionEntry.V_TARGET_KM_S ? Math.sqrt(predictionEntry.V_TARGET_KM_S.reduce((a, b) => a + b * b, 0)).toFixed(3) : '0.000'} km/s
                                                    </span>
                                                </div>
                                            </div>

                                            {predictionEntry.cdm_data?.relative_position_ric && (
                                                <div>
                                                    <span className="text-zinc-600 text-[9px] uppercase block mb-2">Relative Position (RIC) [km]</span>
                                                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                                                        <div className="bg-black/40 border border-zinc-800 p-1">
                                                            <span className="text-red-400 block mb-0.5">R</span>
                                                            {predictionEntry.cdm_data.relative_position_ric[0].toFixed(2)}
                                                        </div>
                                                        <div className="bg-black/40 border border-zinc-800 p-1">
                                                            <span className="text-green-400 block mb-0.5">I</span>
                                                            {predictionEntry.cdm_data.relative_position_ric[1].toFixed(2)}
                                                        </div>
                                                        <div className="bg-black/40 border border-zinc-800 p-1">
                                                            <span className="text-blue-400 block mb-0.5">C</span>
                                                            {predictionEntry.cdm_data.relative_position_ric[2].toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-800">
                                                <span className="text-zinc-600 text-[9px] uppercase">Mahalanobis Dist.</span>
                                                <span className="text-zinc-300">
                                                    {predictionEntry.cdm_data?.mahalanobis_distance?.toFixed(4)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Maneuver Decisions */}
                                    {decisionEntry && decisionEntry.maneuver_evaluations && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield size={14} className="text-emerald-500" />
                                                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Strategic Response</p>
                                            </div>

                                            <div className="space-y-3">
                                                {(() => {
                                                    // Sort by RL score (descending) to find the best maneuver
                                                    const sortedManeuvers = [...(decisionEntry.maneuver_evaluations || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
                                                    const bestManeuver = sortedManeuvers[0]?.maneuver;

                                                    return sortedManeuvers.map((evalItem) => {
                                                        const isRecommended = bestManeuver === evalItem.maneuver;
                                                        return (
                                                            <div
                                                                key={evalItem.maneuver}
                                                                className={`p-3 border border-dashed flex items-center justify-between transition-all group ${isRecommended
                                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                                    : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {isRecommended && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                                    <div>
                                                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isRecommended ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                                            {evalItem.maneuver.replace(/_/g, ' ')}
                                                                        </p>
                                                                        <p className="text-[9px] text-zinc-600 mt-0.5">
                                                                            Gain: <span className="text-zinc-400">{evalItem.expected_separation_gain_km?.toFixed(1)} km</span>
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {isRecommended ? (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => setShowAbortModal(true)}
                                                                            className="px-3 py-1 bg-red-500/10 text-red-400 text-[9px] font-bold tracking-widest border border-red-500/30 hover:bg-red-500/20 transition-colors uppercase"
                                                                        >
                                                                            Abort
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setSimulatedManeuver({ ...evalItem, isPlaying: true })}
                                                                            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-widest border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors uppercase"
                                                                        >
                                                                            Execute
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => setSimulatedManeuver({ ...evalItem, isPlaying: true })}
                                                                            className="p-1.5 rounded bg-zinc-800 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 transition-colors border border-transparent hover:border-emerald-500/30"
                                                                            title="Simulate Maneuver"
                                                                        >
                                                                            <Play size={10} fill="currentColor" />
                                                                        </button>
                                                                        <span className="text-[9px] text-zinc-700 font-mono">
                                                                            {evalItem.score !== undefined ? Number(evalItem.score).toFixed(2) : ''}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            );
                        })()}
                    </div>

                ) : (
                    // TABLE VIEW
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Filters & Search */}
                        <div className="p-6 pb-2 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-zinc-600" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                        setSelectedIndex(null);
                                    }}
                                    placeholder="SEARCH OBJECT ID..."
                                    className="w-full bg-zinc-900/50 border border-dashed border-zinc-700 p-2 pl-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <FilterIcon className="absolute left-3 top-2.5 text-zinc-500" size={12} />
                                <select
                                    value={filterSeverity}
                                    onChange={(e) => {
                                        setFilterSeverity(e.target.value);
                                        setCurrentPage(1);
                                        setSelectedIndex(null);
                                    }}
                                    className="appearance-none bg-zinc-900/50 border border-dashed border-zinc-700 p-2 pl-9 pr-8 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer uppercase font-bold tracking-wider"
                                >
                                    <option value="ALL">ALL RISKS</option>
                                    <option value="CRITICAL">CRITICAL</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-zinc-600 pointer-events-none" size={10} />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] text-zinc-600 border-b border-dashed border-zinc-800/80 uppercase tracking-[0.2em] font-bold sticky top-0 bg-[#0a0a0c] z-10">
                                        <th
                                            className="pb-4 pt-4 font-bold cursor-pointer group hover:text-zinc-300 transition-colors"
                                            onClick={() => handleSort('debris_name')}
                                        >
                                            <div className="flex items-center gap-2">ID <SortIcon column="debris_name" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th
                                            className="pb-4 pt-4 font-bold cursor-pointer group hover:text-zinc-300 transition-colors"
                                            onClick={() => handleSort('risk_snapshot.miss_distance_km')}
                                        >
                                            <div className="flex items-center gap-2">DIST <SortIcon column="miss_distance_km" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th
                                            className="pb-4 pt-4 font-bold cursor-pointer group hover:text-zinc-300 transition-colors"
                                            onClick={() => handleSort('assessment.severity_score')}
                                        >
                                            <div className="flex items-center gap-2">SEVERITY <SortIcon column="assessment.severity_score" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th className="pb-4 pt-4 font-bold text-right text-zinc-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {paginatedDebris.map((debris, i) => (
                                        <tr
                                            key={i}
                                            onClick={() => setSelectedIndex(processedDebris.indexOf(debris))}
                                            className={`group cursor-pointer border-b border-dashed border-zinc-800/30 transition-all duration-300 hover:bg-zinc-900/40`}
                                        >
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors tracking-widest">
                                                        {debris.debris_name}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-600 font-mono mt-0.5">{debris.other_id}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-mono text-zinc-400 group-hover:text-zinc-200 tracking-wider">
                                                {(debris.risk_metrics?.miss_distance_km || 0).toFixed(3)} km
                                            </td>
                                            <td className="py-4">
                                                <SeverityBadge level={debris.assessment?.severity_level} />
                                            </td>
                                            <td className="py-4 text-right">
                                                <ChevronRight size={14} className="ml-auto text-zinc-700 group-hover:text-zinc-400" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-dashed border-zinc-800/50 flex justify-between items-center bg-black/10">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[10px] text-zinc-500 font-mono tracking-widest">PAGE {currentPage} / {totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )
                }

                {/* Footer Security */}
                <div className="p-8 border-t border-dashed border-zinc-800/50 bg-black/20">
                    <p className="text-center text-[10px] text-zinc-700 tracking-[0.4em] uppercase font-bold italic">
                        OrbitArch Intelligence // Result_Security_Verified
                    </p>
                </div>
            </div >

            {/* RIGHT PANEL: 3D SPACE HUD */}
            {
                !isPanelMaximized && (
                    <div className={`${isRightPanelFull ? 'w-full' : 'w-1/2'} bg-[#0d0d0f] relative overflow-hidden transition-all duration-500`}>

                        {/* 3D Scene */}
                        <div className="absolute inset-0">
                            <Canvas shadows gl={{ antialias: true }}>
                                <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={45} />

                                <ambientLight intensity={0.4} />
                                <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />

                                <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade />

                                <OrbitControls
                                    ref={controlsRef}
                                    enablePan={true}
                                    enableZoom={true}
                                    makeDefault
                                    minDistance={5}
                                    maxDistance={100}
                                />

                                <group>
                                    <SatelliteModel />
                                    <TargetTrajectory />
                                    <ManeuverSimulation
                                        maneuver={simulatedManeuver}
                                        debrisData={selectedDebris}
                                        isPlaying={simulatedManeuver?.isPlaying}
                                        onComplete={() => setTimeout(() => setSimulatedManeuver(null), 1000)} // Auto-clear after delay
                                    />
                                </group>

                                {(selectedDebris ? [selectedDebris] : processedDebris).map((debris) => (
                                    <DebrisObject
                                        key={debris.other_id}
                                        data={debris}
                                        isSelected={selectedDebris?.other_id === debris.other_id}
                                        onClick={() => {
                                            const idx = processedDebris.findIndex(d => d.other_id === debris.other_id);
                                            if (idx !== -1) setSelectedIndex(idx);
                                        }}
                                        positionMetadata={data.prediction_results?.find(p => p.other_id === debris.other_id)}
                                    />
                                ))}

                                <SceneManager
                                    selectedDebris={selectedDebris}
                                    predictionResults={data.prediction_results}
                                    controlsRef={controlsRef}
                                    isPaused={isPaused}
                                    simulatedManeuver={simulatedManeuver}
                                />

                                {selectedDebris && (
                                    <DebrisTrajectory
                                        predictionEntry={(data.prediction_results || predictionData).find(p => p.other_id === selectedDebris.other_id)}
                                    />
                                )}

                                <gridHelper args={[100, 20, '#18181b', '#09090b']} position={[0, -5, 0]} />
                            </Canvas>
                        </div>

                        {/* HUD Overlay Elements */}
                        <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">

                            {/* Top Row: Severity & Identity */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="bg-black/40 border border-dashed border-zinc-800 p-4 backdrop-blur-md flex items-center gap-6 pointer-events-auto">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Visualizer_Mode</p>
                                            <p className="text-[11px] text-zinc-200 uppercase tracking-[0.3em] font-bold">Tactical_Ortho_Sync</p>
                                        </div>

                                        <div className="h-8 w-[1px] bg-zinc-800/50 mx-2" />

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setIsPaused(!isPaused)}
                                                className="p-2 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                                title={isPaused ? "Play Simulation" : "Pause Simulation"}
                                            >
                                                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                                            </button>
                                            <button
                                                className="p-2 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                                title="Move Camera"
                                            >
                                                <Move size={16} />
                                            </button>
                                            <button
                                                onClick={() => setIsRightPanelFull(!isRightPanelFull)}
                                                className="p-2 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                                title="Maximize View"
                                            >
                                                {isRightPanelFull ? <Minimize size={16} /> : <Maximize2 size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* HIGH RIGHT: SELECTED DEBRIS CARD - REPLACED WITH CLOSE OPTION */}
                                <AnimatePresence>
                                    {selectedDebris && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={() => setSelectedIndex(null)}
                                            className="p-4 bg-zinc-900/80 border border-dashed border-zinc-500 backdrop-blur-xl rounded-full text-zinc-400 hover:text-white hover:border-white transition-all pointer-events-auto"
                                            title="Close Selection"
                                        >
                                            <X size={20} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Bottom Row: Controls & Metadata */}
                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <p className="text-[9px] text-zinc-700 tracking-[0.4em] uppercase font-bold">COORD_DATA_STREAM</p>
                                    <div className="h-[2px] w-24 bg-zinc-800 overflow-hidden">
                                        <motion.div
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="w-1/2 h-full bg-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-[40px] font-light text-zinc-800 tracking-tighter opacity-30 leading-none">ORTHO</p>
                                    <p className="text-[10px] text-zinc-600 tracking-[0.5em] uppercase font-bold">rendering_v4.2</p>
                                </div>
                            </div>

                            {/* HUD Corners */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-zinc-800/50" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-zinc-800/50" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-zinc-800/50" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-zinc-800/50" />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ABORT CONFIRMATION MODAL */}
            <AnimatePresence>
                {showAbortModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowAbortModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-[#0a0a0c] border border-dashed border-red-500/30 p-8 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6 text-red-500">
                                <AlertCircle size={24} />
                                <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Abort Maneuver?</h3>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mb-8 leading-relaxed">
                                Are you sure you want to abort the recommended protocol?
                                <br /><br />
                                <span className="text-zinc-500">Action:</span> <span className="text-white">MANUAL_OVERRIDE</span>
                                <br />
                                <span className="text-zinc-500">Consequence:</span> <span className="text-red-400">INCREASED_COLLISION_PROBABILITY</span>
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowAbortModal(false)}
                                    className="flex-1 py-3 border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-[10px] tracking-widest font-bold uppercase transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        console.log("Maneuver Aborted");
                                        setShowAbortModal(false);
                                    }}
                                    className="flex-1 py-3 bg-red-500 text-black border border-red-500 hover:bg-red-400 text-[10px] tracking-widest font-bold uppercase transition-all"
                                >
                                    Confirm Abort
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #252529;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            ` }} />
        </div >
    );
}
