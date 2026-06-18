import { Terminal, ShieldAlert } from 'lucide-react';

export default function Layout({ children }) {
    return (
        <div className="app-container">
            <header className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Terminal color="var(--color-accent)" size={28} />
                    <h1 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '1px' }}>
                        ORBITAL <span style={{ color: 'var(--color-accent)' }}>SENTINEL</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    <span>STATUS: <span style={{ color: 'var(--color-safe)' }}>ACTIVE</span></span>
                    <span>SYSTEM: <span style={{ color: 'var(--color-accent)' }}>NOMINAL</span></span>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
