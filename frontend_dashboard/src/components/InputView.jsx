import { useState, useDeferredValue, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Satellite, Activity, Globe, ChevronDown,
    Fuel, Zap, Thermometer, Settings, Clock,
    Shield, Target, Box, Gauge, Info, AlertCircle
} from 'lucide-react';
import SatelliteVisualizer from './SatelliteVisualizer';

// Performance Optimization: Components moved outside to prevent re-creation on every render
const InputField = memo(({ label, name, type = "text", icon: Icon, required = false, placeholder = "", value, onChange }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-[11px] text-zinc-400 uppercase tracking-[0.25em] font-mono font-bold">
            {label}
            {required && <span className="text-zinc-500">*</span>}
        </label>
        <div className="relative group">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 bg-zinc-900/40 border border-dashed border-zinc-800 
                         text-zinc-50 placeholder-zinc-700 font-mono text-sm
                         focus:border-zinc-500 focus:bg-zinc-800/60 focus:outline-none
                         transition-all duration-200 rounded-none
                         group-hover:border-zinc-700"
            />
            {Icon && (
                <Icon className="absolute right-3.5 top-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" size={16} />
            )}
        </div>
    </div>
));

const SelectField = memo(({ label, name, options, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[11px] text-zinc-400 uppercase tracking-[0.25em] font-mono font-bold">
            {label}
        </label>
        <div className="relative group">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-3 bg-zinc-900/40 border border-dashed border-zinc-800 
                         text-zinc-50 font-mono text-sm appearance-none cursor-pointer
                         focus:border-zinc-500 focus:bg-zinc-800/60 focus:outline-none
                         transition-all duration-200 rounded-none
                         group-hover:border-zinc-700"
            >
                <option value="" className="bg-zinc-950">SELECT...</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-950">{opt.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-3.5 text-zinc-600 pointer-events-none" size={16} />
        </div>
    </div>
));

export default function InputView({ onSubmit }) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [form, setForm] = useState({
        name: 'TEST-SAT-1',
        perigee_km: 500,
        apogee_km: 500,
        inclination_deg: 45,
        thrusters_available: '',
        max_delta_v_per_burn_mps: '',
        power_margin_w: '',
        thermal_margin_c: '',
        attitude_mode: '',
        drag_modulation_capable: '',
        min_safe_command_time_sec: '',
        safe_emergency_dv_mps: '',
        max_single_burn_dv_mps: '',
        ground_station_windows: '',
        comm_blackouts: '',
        eclipse_windows: '',
        gnss_outages: '',
        dry_mass_kg: '',
        fuel_remaining_kg: '',
        isp_s: '',
        fuel_margin_kg: '',
        mission_type: '',
        target_sat_model: '',
        debris_sat_model: ''
    });

    // Strategy: Defer high-cost 3D renders to keep input typing silky smooth
    const deferredForm = useDeferredValue(form);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : value) : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submission = {
            name: form.name,
            perigee_km: parseFloat(form.perigee_km),
            apogee_km: parseFloat(form.apogee_km),
            inclination_deg: parseFloat(form.inclination_deg)
        };

        Object.keys(form).forEach(key => {
            if (!['name', 'perigee_km', 'apogee_km', 'inclination_deg'].includes(key) && form[key] !== '') {
                const numericFields = [
                    'thrusters_available', 'max_delta_v_per_burn_mps', 'power_margin_w',
                    'thermal_margin_c', 'min_safe_command_time_sec', 'safe_emergency_dv_mps',
                    'max_single_burn_dv_mps', 'dry_mass_kg', 'fuel_remaining_kg', 'isp_s', 'fuel_margin_kg'
                ];
                submission[key] = numericFields.includes(key) ? parseFloat(form[key]) : form[key];
            }
        });
        onSubmit(submission);
    };

    return (
        <div className="h-screen bg-[#0a0a0c] text-zinc-300 font-mono flex overflow-hidden">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="fixed inset-0 pointer-events-none opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* LEFT PANEL */}
            <div className="w-3/4 flex flex-col border-r border-dashed border-zinc-800/50 relative z-10">
                {/* Fixed Header */}
                <div className="p-8 border-b border-dashed border-zinc-800/50 bg-[#0a0a0c]/80 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50">
                                <Satellite size={24} className="text-zinc-100" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-light tracking-[0.4em] text-white">ORBITARCH CORE</h1>
                                <p className="text-[11px] text-zinc-500 tracking-[0.5em] uppercase mt-1">Orbital Analysis Interface v2.1</p>
                            </div>
                        </div>
                        <div className="flex gap-10">
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">System Status</p>
                                <p className="text-[12px] text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2 justify-end">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Nominal
                                </p>
                            </div>
                            <div className="text-right border-l border-dashed border-zinc-800 pl-10">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Analysis Mode</p>
                                <p className="text-[12px] text-zinc-200 uppercase tracking-[0.2em]">Predictive Collision</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-10">
                    <div className="max-w-5xl mx-auto space-y-12">
                        <motion.section
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/30 border border-dashed border-zinc-800/50 p-6 relative"
                        >
                            <div className="absolute -top-px -left-px w-3 h-3 border-l border-t border-zinc-500" />
                            <div className="absolute -bottom-px -right-px w-3 h-3 border-r border-b border-zinc-500" />
                            <p className="text-sm text-zinc-300 leading-relaxed tracking-wide">
                                <Info size={14} className="inline mr-3 text-zinc-400" />
                                Welcome to the <span className="text-white font-bold">Collision Avoidance System</span>.
                                Initialize analysis by defining core orbital parameters. Advanced telemetry data can be configured below.
                            </p>
                        </motion.section>

                        <form onSubmit={handleSubmit} className="space-y-12 pb-20">
                            {/* MANDATORY PARAMETERS */}
                            <section className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.4em] whitespace-nowrap">Primary Vector</h2>
                                    <div className="w-full h-px bg-gradient-to-r from-zinc-800 to-transparent" />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <InputField label="Mission Name" name="name" icon={Rocket} required placeholder="EXO-1" value={form.name} onChange={handleChange} />
                                    <InputField label="Inclination (deg)" name="inclination_deg" type="number" step="0.1" required value={form.inclination_deg} onChange={handleChange} />
                                    <InputField label="Perigee (km)" name="perigee_km" type="number" required value={form.perigee_km} onChange={handleChange} />
                                    <InputField label="Apogee (km)" name="apogee_km" type="number" required value={form.apogee_km} onChange={handleChange} />
                                </div>
                            </section>

                            {/* ADVANCED SECTION */}
                            <section className="space-y-6">
                                <motion.button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`w-full py-4 px-6 border border-dashed flex items-center justify-between transition-all duration-300
                                              ${showAdvanced ? 'bg-zinc-800/40 border-zinc-500 text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
                                >
                                    <span className="flex items-center gap-3 text-[11px] tracking-[0.4em] font-bold">
                                        <Settings size={18} /> {showAdvanced ? 'HIDE' : 'SHOW'} ADVANCED TELEMETRY
                                    </span>
                                    <ChevronDown size={20} className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                                </motion.button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden bg-zinc-900/10 border border-dashed border-zinc-800/50 p-8 space-y-10"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                                                {/* Propulsion */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Fuel size={16} className="text-zinc-500" />
                                                        <h3 className="text-[11px] text-zinc-200 uppercase tracking-[0.2em] font-bold">Propulsion & Mass</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6 border-l border-zinc-800 pl-6 py-2">
                                                        <InputField label="Thrusters" name="thrusters_available" type="number" value={form.thrusters_available} onChange={handleChange} />
                                                        <InputField label="Max ΔV (m/s)" name="max_delta_v_per_burn_mps" type="number" value={form.max_delta_v_per_burn_mps} onChange={handleChange} />
                                                        <InputField label="Dry Mass (kg)" name="dry_mass_kg" type="number" value={form.dry_mass_kg} onChange={handleChange} />
                                                        <InputField label="Fuel (kg)" name="fuel_remaining_kg" type="number" value={form.fuel_remaining_kg} onChange={handleChange} />
                                                        <InputField label="ISP (s)" name="isp_s" type="number" value={form.isp_s} onChange={handleChange} />
                                                        <InputField label="Fuel Margin" name="fuel_margin_kg" type="number" value={form.fuel_margin_kg} onChange={handleChange} />
                                                    </div>
                                                </div>

                                                {/* Environmental */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Zap size={16} className="text-zinc-500" />
                                                        <h3 className="text-[11px] text-zinc-200 uppercase tracking-[0.2em] font-bold">Environmental</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6 border-l border-zinc-800 pl-6 py-2">
                                                        <InputField label="Power Margin" name="power_margin_w" type="number" value={form.power_margin_w} onChange={handleChange} />
                                                        <InputField label="Thermal Margin" name="thermal_margin_c" type="number" value={form.thermal_margin_c} onChange={handleChange} />
                                                        <SelectField label="Attitude" name="attitude_mode" options={[{ value: 'nadir', label: 'Nadir' }, { value: 'sun', label: 'Sun' }]} value={form.attitude_mode} onChange={handleChange} />
                                                        <SelectField label="Drag Mod." name="drag_modulation_capable" options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} value={form.drag_modulation_capable} onChange={handleChange} />
                                                    </div>
                                                </div>

                                                {/* Operational */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Clock size={16} className="text-zinc-500" />
                                                        <h3 className="text-[11px] text-zinc-200 uppercase tracking-[0.2em] font-bold">Operational Timing</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6 border-l border-zinc-800 pl-6 py-2">
                                                        <InputField label="Min Safe Cmd" name="min_safe_command_time_sec" type="number" value={form.min_safe_command_time_sec} onChange={handleChange} />
                                                        <InputField label="Emergency ΔV" name="safe_emergency_dv_mps" type="number" value={form.safe_emergency_dv_mps} onChange={handleChange} />
                                                        <InputField label="Max Burn ΔV" name="max_single_burn_dv_mps" type="number" value={form.max_single_burn_dv_mps} onChange={handleChange} />
                                                        <InputField label="Eclipse Win." name="eclipse_windows" value={form.eclipse_windows} onChange={handleChange} />
                                                    </div>
                                                </div>

                                                {/* Mission */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Target size={16} className="text-zinc-500" />
                                                        <h3 className="text-[11px] text-zinc-200 uppercase tracking-[0.2em] font-bold">Mission Config</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6 border-l border-zinc-800 pl-6 py-2">
                                                        <SelectField label="Orbit Type" name="mission_type" options={[{ value: 'leo', label: 'LEO' }, { value: 'geo', label: 'GEO' }]} value={form.mission_type} onChange={handleChange} />
                                                        <InputField label="Target Model" name="target_sat_model" placeholder="Model Alpha" value={form.target_sat_model} onChange={handleChange} />
                                                        <InputField label="Debris Model" name="debris_sat_model" value={form.debris_sat_model} onChange={handleChange} />
                                                        <InputField label="Blackouts" name="comm_blackouts" value={form.comm_blackouts} onChange={handleChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </section>
                        </form>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-1/4 bg-[#0d0d0f] flex flex-col relative z-20">
                <div className="p-8 border-b border-dashed border-zinc-800/50">
                    <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Environmental Telemetry</h2>
                </div>

                <div className="flex-1 p-8 space-y-12 overflow-y-auto custom-scrollbar">
                    <div className="aspect-square border border-dashed border-zinc-800 relative bg-black/20 group">
                        <SatelliteVisualizer data={deferredForm} />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-zinc-500" />
                            <h3 className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Action Center</h3>
                        </div>

                        <div className="p-6 bg-zinc-900/20 border border-dashed border-zinc-800 space-y-6">
                            <p className="text-[11px] text-zinc-600 leading-relaxed italic">
                                Ready for orbital sync. Parameters established and verified.
                            </p>

                            <motion.button
                                onClick={() => {
                                    const formElement = document.querySelector('form');
                                    if (formElement) formElement.requestSubmit();
                                }}
                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: '#ffffff', color: '#ffffff' }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-5 border border-dashed border-zinc-600 text-zinc-400 font-bold text-xs tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-3"
                            >
                                INITIALIZE ANALYSIS
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-dashed border-zinc-800/50 bg-black/20">
                    <p className="text-center text-[10px] text-zinc-700 tracking-[0.4em] uppercase font-bold">OrbitArch Security Protocol</p>
                </div>
            </div>

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
        </div>
    );
}
