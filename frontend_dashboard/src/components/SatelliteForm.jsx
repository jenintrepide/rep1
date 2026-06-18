import { useState } from 'react';
import { Rocket, Activity, Globe } from 'lucide-react';

export default function SatelliteForm({ onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        name: 'CUSTOM_OBJECT',
        perigee_km: 716.3,
        apogee_km: 728.4,
        inclination_deg: 98.8
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'name' ? value : Number(value)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        width: '100%',
        color: 'white',
        marginTop: '6px',
        boxSizing: 'border-box'
    };

    return (
        <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Rocket size={20} color="var(--color-accent)" />
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Target Configuration</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Satellite Name</label>
                    <input
                        style={inputStyle}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Perigee (km)</label>
                        <input
                            style={inputStyle}
                            type="number"
                            name="perigee_km"
                            value={formData.perigee_km}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Apogee (km)</label>
                        <input
                            style={inputStyle}
                            type="number"
                            name="apogee_km"
                            value={formData.apogee_km}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Inclination (deg)</label>
                    <input
                        style={inputStyle}
                        type="number"
                        name="inclination_deg"
                        value={formData.inclination_deg}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    className="glow-text"
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: isLoading ? 'var(--color-bg)' : 'var(--color-neutral)',
                        border: '1px solid var(--color-accent)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        opacity: isLoading ? 0.7 : 1,
                        pointerEvents: isLoading ? 'none' : 'auto'
                    }}
                >
                    {isLoading ? 'ANALYZING ORBITS...' : 'INITIATE SCAN'}
                </button>
            </form>
        </div>
    );
}
