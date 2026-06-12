import React, { useState, useEffect } from 'react';

export default function CoreForm({ userId }) {
    // Les 3 cases obligatoires du formulaire de paiement critique
    const [form, setForm] = useState({
        victoryLink: '',
        targetAddress: '',
        txHash: ''
    });

    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [finalLinks, setFinalLinks] = useState(null);

    // URL absolue de ton serveur Render
    const API_URL = "https://point-focal-backend.onrender.com/api";

    // DÉCLENCHEUR AUTOMATIQUE : Dès qu'une valeur change dans les cases, l'écouteur analyse la complétion
    useEffect(() => {
        const { victoryLink, targetAddress, txHash } = form;

        // Conditions strictes de déclenchement (Formats inviolables de la V5/V6)
        const isVictoryFilled = victoryLink.trim().length > 10;
        const isAddressValid = targetAddress.startsWith('0x') && targetAddress.length === 42;
        const isHashValid = txHash.startsWith('0x') && txHash.length === 66;

        // Si et seulement si les 3 cases respectent le format, la vérification blockchain démarre seule
        if (isVictoryFilled && isAddressValid && isHashValid) {
            triggerAutomaticVerification();
        } else {
            // Remise à zéro du message si l'utilisateur efface un caractère ou modifie l'ordre
            setStatusMessage('');
        }
    }, [form]);

    const triggerAutomaticVerification = async () => {
        setLoading(true);
        setStatusMessage('⚡ SÉCURITÉ : Déclenchement automatique. Analyse de la transaction sur la BSC...');

        try {
            // Correction ici : Ajout de l'URL absolue vers ton Render backend
            const response = await fetch(`${API_URL}/payment/auto-trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    victoryLink: form.victoryLink.trim(),
                    targetAddress: form.targetAddress.trim(),
                    txHash: form.txHash.trim()
                })
            });
            const data = await response.json();

            if (response.ok) {
                setStatusMessage('✅ PAIEMENT VALIDÉ ! Génération instantanée de vos liens achevée.');
                setFinalLinks(data.links); // Récupération automatique des liens générés (publicLink et privateKmLink)
            } else {
                setStatusMessage(`❌ REJET IMMÉDIAT : ${data.error || 'Vérification échouée.'}`);
            }
        } catch (err) {
            setStatusMessage('❌ Erreur de connexion avec le serveur Point Focal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            padding: '30px', 
            maxWidth: '650px', 
            margin: '40px auto', 
            background: '#ffffff', 
            color: '#333333', 
            borderRadius: '10px', 
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            fontFamily: 'sans-serif'
        }}>
            <h2 style={{ color: '#FF0000', borderBottom: '2px solid #FF0000', paddingBottom: '10px', marginTop: 0 }}>
                💳 ÉTAPE CRITIQUE — FORMULAIRE DE PAIEMENT
            </h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '25px' }}>
                Remplissez les champs ci-dessous dans l'ordre requis. Dès que la troisième case sera complétée, le système interrogera directement la blockchain.
            </p>

            {/* CASE 1 : LIEN VICTORY AUTOMATIC */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                    🔗 Case 1 : Lien Victory Automatic utilisé
                </label>
                <input 
                    type="text" 
                    value={form.victoryLink}
                    onChange={(e) => setForm({ ...form, victoryLink: e.target.value })}
                    placeholder="Ex: https://victoryautomatic.com/user/register/..."
                    style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem' }}
                    disabled={loading || finalLinks}
                />
            </div>

            {/* CASE 2 : ADRESSE CIBLE */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                    📍 Case 2 : Adresse cible (Doit commencer par 0x et faire 42 caractères)
                </label>
                <input 
                    type="text" 
                    value={form.targetAddress}
                    onChange={(e) => setForm({ ...form, targetAddress: e.target.value })}
                    placeholder="0x..."
                    maxLength={42}
                    style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '1rem' }}
                    disabled={loading || finalLinks}
                />
            </div>

            {/* CASE 3 : HASH DE TRANSACTION */}
            <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                    🔐 Case 3 : Hash de la transaction (Doit commencer par 0x et faire 66 caractères)
                </label>
                <input 
                    type="text" 
                    value={form.txHash}
                    onChange={(e) => setForm({ ...form, txHash: e.target.value })}
                    placeholder="0x..."
                    maxLength={66}
                    style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '1rem' }}
                    disabled={loading || finalLinks}
                />
            </div>

            {/* CONSOLE D'AFFICHAGE DES ACTIONS EN DIRECT */}
            {statusMessage && (
                <div style={{ 
                    padding: '15px', 
                    borderRadius: '5px', 
                    background: loading ? '#fff3cd' : (finalLinks ? '#d4edda' : '#f8d7da'), 
                    color: loading ? '#856404' : (finalLinks ? '#155724' : '#721c24'),
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    marginBottom: '20px',
                    borderLeft: '5px solid'
                }}>
                    {statusMessage}
                </div>
            )}

            {/* SPRINT 10 : AFFICHAGE IMMÉDIAT ET AUTOMATIQUE DES LIENS SÉCURISÉS APRÈS VALIDATION */}
            {finalLinks && (
                <div style={{ 
                    marginTop: '30px', 
                    border: '3px dashed #28a745', 
                    padding: '25px', 
                    backgroundColor: '#f9fff9', 
                    borderRadius: '8px' 
                }}>
                    <h3 style={{ color: '#28a745', marginTop: 0, fontSize: '1.2rem' }}>
                        🚀 LIENS GÉNÉRÉS AVEC SUCCÈS (AUCUNE ACTION MANUELLE REQUISE) :
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <span style={{ display: 'block', fontWeight: 'bold', color: '#155724' }}>
                            📢 Lien Point Focal Public (À partager sur vos réseaux publics) :
                        </span>
                        <code style={{ display: 'block', background: '#e9ecef', padding: '10px', borderRadius: '4px', marginTop: '5px', wordBreak: 'break-all' }}>
                            {finalLinks.publicLink}
                        </code>
                    </div>

                    <div>
                        <span style={{ display: 'block', fontWeight: 'bold', color: '#155724' }}>
                            🔒 Lien Point Focal KM (À partager EXCLUSIVEMENT en privé) :
                        </span>
                        <code style={{ display: 'block', background: '#e9ecef', padding: '10px', borderRadius: '4px', marginTop: '5px', wordBreak: 'break-all', fontWeight: 'bold', color: '#0056b3' }}>
                            {finalLinks.privateKmLink}
                        </code>
                    </div>
                </div>
            )}
        </div>
    );
}