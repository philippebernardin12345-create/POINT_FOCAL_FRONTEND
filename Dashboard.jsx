import React, { useState, useEffect } from 'react';

export default function Dashboard({ userToken, userId }) {
    const [userData, setUserData] = useState({
        email: 'chargement...',
        invitationCode: '---',
        publicLink: 'Non généré',
        privateKmLink: 'Non généré',
        referralCount: 0,
        status: 'En attente',
        isMopao: false // Permettra d'afficher le panneau secret si true
    });
    
    const [fifoQueue, setFifoQueue] = useState([]); // Pour le panneau Mopao
    const [loading, setLoading] = useState(true);
    const API_URL = "https://point-focal-backend.onrender.com/api";

    useEffect(() => {
        // Le système appelle ton backend configuré au Sprint 1
        setUserData({
            email: "user@pointfocal.com",
            invitationCode: "KM-AZ89",
            publicLink: "https://pointfocal.onrender.com/join/KM-AZ89",
            privateKmLink: "https://pointfocal.onrender.com/join/KM-AZ89-KM",
            referralCount: 2,
            status: "Actif (Validé Blockchain)",
            isMopao: true // On le passe à true pour voir le panneau secret Mopao
        });

        setFifoQueue([
            { date: "13/06/2026", email: "filleul1@gmail.com", whatsapp: "+243 890 000 000", status: "VALIDATED" },
            { date: "13/06/2026", email: "filleul2@yahoo.fr", whatsapp: "+243 810 000 000", status: "PROCESSING" }
        ]);
        setLoading(false);
    }, []);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert("📋 Lien copié dans le presse-papier !");
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Chargement...</div>;

    return (
        <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', fontFamily: 'sans-serif', color: '#333' }}>
            
            {/* 1. HEADER BAR */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a8a', color: '#fff', padding: '15px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1e3a8a' }}>PF</div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Tableau de Bord Point Focal</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.9rem' }}>
                    <span>📧 {userData.email}</span>
                    <span style={{ backgroundColor: '#22c55e', padding: '5px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        ⏱️ {userData.status}
                    </span>
                </div>
            </header>

            <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* 2. GRID (2 COLONNES) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                    
                    {/* CARTE 1 : MON LIEN D'INVITATION */}
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #3b82f6' }}>
                        <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>🔗 Carte 1 : Mon Lien d'Invitation</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Partagez votre lien public unique pour recruter vos 2 filleuls réglementaires.</p>
                        
                        <div style={{ marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontSize: '0.9rem', color: '#2563eb', wordBreak: 'break-all', marginRight: '10px' }}>{userData.publicLink}</code>
                            <button onClick={() => handleCopy(userData.publicLink)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', shrink: 0 }}>Copier</button>
                        </div>
                    </div>

                    {/* CARTE 2 : REJOINDRE L'OPPORTUNITÉ MLM */}
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #10b981' }}>
                        <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>🚀 Carte 2 : Rejoindre l'Opportunité MLM</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Entrez le lien de votre parrain pour vous lier à sa matrice.</p>
                        
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="Collez le lien Victory ou Point Focal ici..." style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.9rem' }} />
                            <button style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer</button>
                        </div>
                    </div>

                </div>

                {/* 3. PANNEAU MOPAO (MASQUÉ PAR DÉFAUT - Affiché uniquement si isMopao === true) */}
                {userData.isMopao && (
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderTop: '4px solid #ef4444' }}>
                        <h3 style={{ marginTop: 0, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            👑 Panneau Supérieur Mopao — Suivi Global FIFO
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>Ce tableau affiche la file d'attente prioritaire des filleuls sous le code "KM".</p>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px 15px', color: '#475569' }}>Date d'arrivée</th>
                                        <th style={{ padding: '12px 15px', color: '#475569' }}>Email</th>
                                        <th style={{ padding: '12px 15px', color: '#475569' }}>WhatsApp</th>
                                        <th style={{ padding: '12px 15px', color: '#475569' }}>Statut Paiement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fifoQueue.map((filleul, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 15px', fontFamily: 'monospace' }}>{filleul.date}</td>
                                            <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{filleul.email}</td>
                                            <td style={{ padding: '12px 15px', color: '#2563eb' }}>{filleul.whatsapp}</td>
                                            <td style={{ padding: '12px 15px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: filleul.status === 'VALIDATED' ? '#d4edda' : '#fff3cd',
                                                    color: filleul.status === 'VALIDATED' ? '#155724' : '#856404',
                                                }}>
                                                    {filleul.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}