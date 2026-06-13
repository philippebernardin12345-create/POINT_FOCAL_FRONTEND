import React, { useState } from 'react';
import CoreForm from './CoreForm';
import Dashboard from './Dashboard';

export default function App() {
    // Gestion des étapes de navigation
    const [step, setStep] = useState('payment'); // 'payment' ou 'dashboard'
    const [session, setSession] = useState({ token: null, userId: null });

    // Fonction appelée une fois le paiement/inscription validé au Sprint 3
    const handleValidationSuccess = (token, userId) => {
        setSession({ token, userId });
        setStep('dashboard');
    };

    return (
        <div style={{ margin: 0, padding: 0, boxSizing: 'border-box' }}>
            {step === 'payment' && (
                <div style={{ padding: '20px' }}>
                    <h2 style={{ textAlign: 'center', color: '#1e3a8a', fontFamily: 'sans-serif' }}>
                        Bienvenue sur Point Focal V6
                    </h2>
                    {/* Chargement de ton formulaire de paiement intelligent */}
                    <CoreForm onValidated={handleValidationSuccess} />
                </div>
            )}

            {step === 'dashboard' && (
                /* Chargement de ton vrai Dashboard connecté */
                <Dashboard userToken={session.token} userId={session.userId} />
            )}
        </div>
    );
}