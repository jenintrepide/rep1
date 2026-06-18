import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function StatusCard({ title, value, status, icon: Icon }) {
    const getStatusColor = (s) => {
        switch (s) {
            case 'CRITICAL': return 'var(--color-critical)';
            case 'WARNING': return 'var(--color-warning)';
            case 'SAFE': return 'var(--color-safe)';
            default: return 'var(--color-neutral)';
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    {title}
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getStatusColor(status) }}>
                    {value}
                </div>
            </div>
            {Icon && <Icon size={32} color={getStatusColor(status)} style={{ opacity: 0.8 }} />}
        </div>
    );
}
