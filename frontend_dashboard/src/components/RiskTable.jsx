import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RiskTable({ results, decisions }) {
    if (!results || results.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <ShieldCheck size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>No active conjunctions detected in the current window.</p>
            </div>
        );
    }

    // Helper to find maneuver for a debris ID
    const getDecision = (id) => decisions?.find(d => d.other_id === id);

    return (
        <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Conjunction Analysis</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>OBJECT</th>
                            <th style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>TCA (UTC)</th>
                            <th style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>PROBABILITY</th>
                            <th style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>SEVERITY</th>
                            <th style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((res, idx) => {
                            const decision = getDecision(res.other_id);
                            const prob = res.risk_metrics.collision_probability;
                            const isCritical = prob > 1e-6;

                            return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{res.debris_name}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>ID: {res.other_id}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(res.impact_time).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', color: isCritical ? 'var(--color-critical)' : 'var(--color-safe)' }}>
                                        {prob.toExponential(2)}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: decision?.assessment.severity_level === 'CRITICAL' ? 'rgba(255, 75, 75, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: decision?.assessment.severity_level === 'CRITICAL' ? 'var(--color-critical)' : 'inherit',
                                            fontSize: '0.75rem'
                                        }}>
                                            {decision?.assessment.severity_level || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {decision?.recommended_maneuver ? (
                                            <div style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                {decision.recommended_maneuver.replace('_', ' ')}
                                            </div>
                                        ) : (
                                            <span style={{ opacity: 0.4 }}>None</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
