import React, { useState, useEffect } from 'react';

export default function Dashboard({ userToken, userId }) {
    const [userData, setUserData] = useState({
        email: 'Chargement...',
        invitationCode: '---',
        publicLink: 'Chargement...',
        privateKmLink: 'Chargement...',
        referralCount: 0,
        status: 'Vérification...',
        isMopao: false
    });
    
    const [fifoQueue, setFifoQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [parrainLink, setParrainLink] = useState('');
    const [submittingLink, setSubmittingLink] = useState(false);

    // Ajuste cette URL si ton backend Render a un nom différent
    const API_URL = "https://point-focal-backend.onrender.com/api";

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Récupération du profil utilisateur réel
                const profileRes = await fetch(`${API_URL}/user/profile`, {
                    headers: {
                        'Authorization': `Bearer ${userToken || localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUserData({
                        email: profileData.email,
                        invitationCode: profileData.code_invitation || 'Aucun',
                        publicLink: profileData.code_invitation ? `https://pointfocalapp.com/join/${profileData.code_invitation}` : 'Non généré',
                        privateKmLink: profileData.is_mopao ? `https://pointfocalapp.com/join/${profileData.code_invitation}-KM` : 'Non autorisé',
                        referralCount: profileData.referral_count || 0,
                        status: profileData.is_active ? 'Actif (Validé)' : 'En attente de validation',
                        isMopao: profileData.is_mopao || false
                    });

                    // 2. Si l'utilisateur est Mopao, on charge la VRAIE file FIFO globale
                    if (profileData.is_mopao) {
                        const fifoRes = await fetch(`${API_URL}/admin/fifo-queue`, {
                            headers: {
                                'Authorization': `Bearer ${userToken || localStorage.getItem('token')}`
                            }
                        });
                        if (fifoRes.ok) {
                            const fifoData = await fifoRes.json();
                            setFifoQueue(fifoData);
                        }
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement des données réelles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [userToken]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert("📋 Lien copié dans le presse-papier !");
    };

    const handleSaveParrain = async () => {
        if (!parrainLink) return alert("Veuillez coller un lien valide.");
        setSubmittingLink(true);
        try {
            const res = await fetch(`${API_URL}/user/set-parrain`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken || localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ parrainLink })
            });
            const data = await res.json();
            if (res.ok) {
                alert("✅ Lien de parrainage enregistré et lié avec succès !");
            } else {
                alert(`❌ Erreur: ${data.message || 'Impossible de lier ce parrain'}`);
            }
        } catch (err) {
            alert("❌ Erreur réseau lors de l'enregistrement.");
        } finally {
            setSubmittingLink(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>⏳ Connexion sécurisée à Supabase en cours...</div>;

    return (
        <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', fontFamily: 'sans-serif', color: '#333' }}>
            
            {/* HEADER BAR */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a8a', color: '#fff', padding: '15px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1e3a8a' }}>PF</div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Tableau de Bord Point Focal</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.9rem' }}>
                    <span>📧 {userData.email}</span>
                    <span style={{ 
                        backgroundColor: userData.status.includes('Actif') ? '#22c55e' : '#f59e0b', 
                        padding: '5px 12px', 
                        borderRadius: '15px', 
                        fontWeight: 'bold', 
                        fontSize: '0.8rem' 
                    }}>
                        {userData.status}
                    </span>
                </div>
            </header>

            <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* GRID D'ACTIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                    
                    {/* CARTE 1 : LIENS EN DIRECT */}
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #3b82f6' }}>
                        <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>🔗 Carte 1 : Votre Lien Unique ({userData.referralCount}/2 Filleuls)</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Distribuez ce lien pour remplir votre matrice ou alimenter automatiquement la FIFO commune.</p>
                        
                        <div style={{ marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontSize: '0.9rem', color: '#2563eb', wordBreak: 'break-all', marginRight: '10px' }}>{userData.publicLink}</code>
                            <button onClick={() => handleCopy(userData.publicLink)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', shrink: 0 }}>Copier</button>
                        </div>
                    </div>

                    {/* CARTE 2 : MATRICE MLM VICTORY */}
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #10b981' }}>
                        <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>🚀 Carte 2 : Liaison Arbre Généalogique</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Collez le lien reçu de votre parrain pour finaliser l'ancrage de votre position.</p>
                        
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                value={parrainLink}
                                onChange={(e) => setParrainLink(e.target.value)}
                                placeholder="Collez le lien Victory ou Point Focal ici..." 
                                style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.9rem' }} 
                            />
                            <button 
                                onClick={handleSaveParrain}
                                disabled={submittingLink}
                                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {submittingLink ? 'Liaison...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>

                </div>

                {/* PANNEAU MOPAO ULTRA-SÉCURISÉ (Affiché dynamiquement) */}
                {userData.isMopao && (
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderTop: '4px solid #ef4444' }}>
                        <h3 style={{ marginTop: 0, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            👑 Panneau Supérieur Mopao — File d'Attente FIFO Réelle
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>Vue globale en temps réel de la file d'attente issue de Supabase.</p>
                        
                        <div style={{ overflowX: 'auto' }}>
                            {fifoQueue.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Aucun utilisateur en attente dans la FIFO pour le moment.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 15px', color: '#475569' }}>Date d'inscription</th>
                                            <th style={{ padding: '12px 15px', color: '#475569' }}>Email</th>
                                            <th style={{ padding: '12px 15px', color: '#475569' }}>Code</th>
                                            <th style={{ padding: '12px 15px', color: '#475569' }}>Statut Système</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fifoQueue.map((filleul, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 15px', fontFamily: 'monospace' }}>
                                                    {new Date(filleul.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{filleul.email}</td>
                                                <td style={{ padding: '12px 15px', color: '#2563eb' }}>{filleul.code_invitation}</td>
                                                <td style={{ padding: '12px 15px' }}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        backgroundColor: filleul.is_active ? '#d4edda' : '#fff3cd',
                                                        color: filleul.is_active ? '#155724' : '#856404',
                                                    }}>
                                                        {filleul.is_active ? 'VALIDATED' : 'PROCESSING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}