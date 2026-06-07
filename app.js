// ... (suite du script)

                        <button id="faqBtn" class="btn btn-secondary">❓ ${t.faq}</button>
                        <button id="refreshBtn" class="btn btn-info" style="background: #17a2b8; color: white;">🔄 Actualiser</button>
                        ${isKM ? `<button id="callMopaoFromDashboardBtn" class="btn btn-success">${t.callMopao}</button>` : ''}
                    </div>
                </div>
            `;
            
            attachDashboardEvents();
        }
        
        function renderAdminPanel() {
            return `
                <div class="card admin-panel">
                    <h2 class="card-title">⚙️ Administration</h2>
                    <div style="margin-bottom: 20px;">
                        <h3>Gestion des opportunités</h3>
                        <div id="adminOpportunities">
                            ${OPPORTUNITIES.map(opp => `
                                <div class="opportunity-item">
                                    <div>
                                        <strong>${opp.name}</strong><br>
                                        <small>${opp.link}</small>
                                    </div>
                                    <div>
                                        <button class="btn btn-warning toggle-opp-btn" data-opp-id="${opp.id}" style="margin-right: 5px;">
                                            ${opp.active ? '🔴 Désactiver' : '🟢 Activer'}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h3>Statistiques</h3>
                        <p>Total utilisateurs: ${users?.length || 0}</p>
                        <p>Paiements validés: ${users?.filter(u => u.paymentValidated).length || 0}</p>
                    </div>
                </div>
            `;
        }
        
        // ==================== TIMERS ====================
        
        function startYoutubeTimer() {
            let timeLeft = 10;
            if (youtubeTimer) clearInterval(youtubeTimer);
            
            youtubeTimer = setInterval(() => {
                timeLeft--;
                const timerEl = document.getElementById('popupTimer');
                const btnEl = document.getElementById('popupNextBtn');
                
                if (timerEl) timerEl.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(youtubeTimer);
                    if (btnEl) {
                        btnEl.disabled = false;
                        btnEl.onclick = () => {
                            currentStep = 'video';
                            render();
                            showNotification('Popup terminé, passez à la vidéo !', 'success');
                            apiSendNotification('video_ready', { userId: currentUser?.id });
                        };
                    }
                }
            }, 1000);
        }
        
        function startVideoTimer() {
            if (videoTimer) clearInterval(videoTimer);
            let timeLeft = 200;
            videoStartTime = Date.now();
            
            videoTimer = setInterval(() => {
                timeLeft--;
                const timerEl = document.getElementById('videoTimer');
                const progressEl = document.getElementById('videoProgress');
                const nextBtn = document.getElementById('nextAfterVideoBtn');
                
                if (timerEl) timerEl.textContent = timeLeft;
                if (progressEl) progressEl.style.width = `${((200 - timeLeft) / 200) * 100}%`;
                
                if (timeLeft <= 0) {
                    clearInterval(videoTimer);
                    if (nextBtn) {
                        nextBtn.disabled = false;
                        nextBtn.onclick = async () => {
                            // Envoyer la confirmation au backend
                            try {
                                await api.post('/video/complete', { 
                                    userId: currentUser.id, 
                                    duration: 200,
                                    completedAt: new Date().toISOString()
                                });
                                currentStep = 'victory';
                                victoryStartTime = Date.now();
                                render();
                                showNotification('Vidéo terminée ! Accès à Victory Automatic', 'success');
                                apiSendNotification('video_completed', { userId: currentUser?.id });
                            } catch (error) {
                                showNotification('Erreur: ' + error.message, 'error');
                            }
                        };
                    }
                }
            }, 1000);
        }
        
        function startVictoryTimer() {
            if (victoryTimer) clearInterval(victoryTimer);
            
            // Vérifier si c'est un KM (pas de timer)
            const isKM = currentUser?.inviteCode?.endsWith('KM') || false;
            if (isKM) return;
            
            let remainingSeconds = 48 * 3600;
            const startTime = localStorage.getItem('victoryStartTime');
            
            if (startTime) {
                const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
                remainingSeconds = Math.max(0, 48 * 3600 - elapsed);
            } else {
                localStorage.setItem('victoryStartTime', victoryStartTime?.toString() || Date.now().toString());
            }
            
            function updateTimer() {
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;
                const timerEl = document.getElementById('victoryTimer');
                const progressEl = document.getElementById('victoryProgress');
                const nextBtn = document.getElementById('nextToPaymentBtn');
                
                if (timerEl) timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (progressEl) progressEl.style.width = `${((48*3600 - remainingSeconds) / (48*3600)) * 100}%`;
                
                // Notifications automatiques
                if (remainingSeconds === 24 * 3600) {
                    showNotification('⏰ Plus que 24h pour finaliser votre activation !', 'warning');
                    apiSendNotification('reminder_24h', { userId: currentUser?.id, email: currentUser?.email });
                }
                if (remainingSeconds === 12 * 3600) {
                    showNotification('⏰ Plus que 12h ! Dépêchez-vous !', 'warning');
                    apiSendNotification('reminder_12h', { userId: currentUser?.id, email: currentUser?.email });
                }
                if (remainingSeconds === 3600) {
                    showNotification('⚠️ DERNIÈRE HEURE ! Finalisez votre paiement maintenant !', 'error');
                    apiSendNotification('reminder_1h', { userId: currentUser?.id, email: currentUser?.email });
                }
                
                if (remainingSeconds <= 0) {
                    clearInterval(victoryTimer);
                    if (nextBtn) nextBtn.disabled = true;
                    showNotification('❌ Délai expiré ! Vous ne pouvez plus générer vos liens.', 'error');
                    apiSendNotification('expired', { userId: currentUser?.id, email: currentUser?.email });
                    localStorage.removeItem('victoryStartTime');
                }
                remainingSeconds--;
            }
            
            updateTimer();
            victoryTimer = setInterval(updateTimer, 1000);
        }
        
        // ==================== VALIDATION PAIEMENT ====================
        
        function attachPaymentEvents() {
            const victoryLinkInput = document.getElementById('victoryLink');
            const targetAddressInput = document.getElementById('targetAddress');
            const hashInput = document.getElementById('transactionHash');
            const callMopaoBtn = document.getElementById('callMopaoBtn');
            
            function checkAndValidate() {
                const victoryLink = victoryLinkInput?.value;
                const targetAddress = targetAddressInput?.value;
                const hash = hashInput?.value;
                
                // Validation des formats
                const isTargetValid = targetAddress?.match(/^0x[a-fA-F0-9]{40}$/i);
                const isHashValid = hash?.match(/^0x[a-fA-F0-9]{64}$/i);
                
                if (victoryLink && targetAddress && hash && isTargetValid && isHashValid) {
                    validatePayment(victoryLink, targetAddress, hash);
                }
            }
            
            victoryLinkInput?.addEventListener('input', checkAndValidate);
            targetAddressInput?.addEventListener('input', checkAndValidate);
            hashInput?.addEventListener('input', checkAndValidate);
            
            // Bouton Allô Mopao pour les KM
            if (callMopaoBtn) {
                callMopaoBtn.onclick = () => {
                    const victoryLink = victoryLinkInput?.value;
                    const targetAddress = targetAddressInput?.value;
                    
                    if (victoryLink && targetAddress) {
                        // Notifier le Mopao
                        apiSendNotification('km_payment_ready', {
                            userId: currentUser?.id,
                            userEmail: currentUser?.email,
                            victoryLink,
                            targetAddress,
                            timestamp: new Date().toISOString()
                        });
                        showNotification('📞 Votre Mopao a été notifié ! Il va ajouter le hash de transaction.', 'success');
                    } else {
                        showNotification('Veuillez d\'abord remplir le lien Victory et l\'adresse cible', 'warning');
                    }
                };
            }
        }
        
        async function validatePayment(victoryLink, targetAddress, hash) {
            const statusDiv = document.getElementById('validationStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="loader"></div> Vérification en cours...';
            }
            
            try {
                // Appel API pour vérifier la transaction sur BSC
                const result = await apiVerifyPayment(victoryLink, targetAddress, hash);
                
                if (result.valid) {
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <div style="padding: 15px; background: #d4edda; border-radius: 8px; color: #155724;">
                                ✅ Paiement validé !<br>
                                Transaction: ${hash.substring(0, 10)}...<br>
                                Confirmations: ${result.confirmations || 12}+<br>
                                Montant: 2.03 USDT<br><br>
                                <strong>🎉 Génération automatique de vos liens en cours...</strong>
                            </div>
                        `;
                    }
                    
                    // Génération des liens
                    const publicLink = `https://pointfocal.com/ref/${currentUser.id}_${Date.now()}`;
                    const kmLink = `https://pointfocal.com/km/${currentUser.id}_KM_${Date.now()}`;
                    
                    // Mise à jour en base
                    currentUser.publicLink = publicLink;
                    currentUser.kmLink = kmLink;
                    currentUser.paymentValidated = true;
                    currentUser.generatedLinks = true;
                    
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    
                    showNotification('✅ Paiement validé ! Vos liens ont été générés.', 'success');
                    apiSendNotification('payment_validated', { 
                        userId: currentUser?.id, 
                        email: currentUser?.email,
                        publicLink,
                        kmLink
                    });
                    
                    // Redirection vers dashboard après 2 secondes
                    setTimeout(() => {
                        currentStep = 'dashboard';
                        render();
                    }, 3000);
                    
                } else {
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <div style="padding: 15px; background: #f8d7da; border-radius: 8px; color: #721c24;">
                                ❌ ${result.message || 'Paiement invalide'}<br>
                                Vérifiez que:<br>
                                - La transaction existe sur BSC<br>
                                - Le montant est exactement 2.03 USDT<br>
                                - L\'adresse cible est correcte<br>
                                - La transaction a au moins 12 confirmations
                            </div>
                        `;
                    }
                    showNotification(result.message || 'Paiement invalide', 'error');
                    apiSendNotification('payment_rejected', { userId: currentUser?.id, email: currentUser?.email, reason: result.message });
                }
            } catch (error) {
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div style="padding: 15px; background: #f8d7da; border-radius: 8px; color: #721c24;">
                            ❌ Erreur: ${error.message}
                        </div>
                    `;
                }
                showNotification('Erreur lors de la vérification', 'error');
            }
        }
        
        // ==================== GESTION AUTHENTIFICATION ====================
        
        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            try {
                const user = await apiLogin(email, password);
                currentUser = user;
                currentStep = 'dashboard';
                showNotification(`Bienvenue ${user.email} !`, 'success');
                render();
            } catch (error) {
                showNotification(error.message || 'Email ou mot de passe incorrect', 'error');
            }
        }
        
        async function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('regEmail')?.value;
            const whatsapp = document.getElementById('regWhatsapp')?.value;
            const password = document.getElementById('regPassword')?.value;
            const confirmPassword = document.getElementById('regConfirmPassword')?.value;
            const inviteCode = document.getElementById('regInviteCode')?.value;
            
            if (password !== confirmPassword) {
                showNotification('Les mots de passe ne correspondent pas !', 'error');
                return;
            }
            
            if (!inviteCode.match(/^[A-Z]{4}[0-9]{4}(KM)?$/)) {
                showNotification('Code d\'invitation invalide (4 lettres + 4 chiffres, option KM)', 'error');
                return;
            }
            
            try {
                const user = await apiRegister({
                    email,
                    whatsapp,
                    password,
                    inviteCode,
                    isKM: inviteCode.endsWith('KM')
                });
                
                currentUser = user;
                currentStep = 'youtubePopup';
                showNotification('Inscription réussie ! Vérifiez votre email.', 'success');
                apiSendNotification('registration_success', { userId: user.id, email: user.email });
                render();
            } catch (error) {
                showNotification(error.message || 'Erreur lors de l\'inscription', 'error');
            }
        }
        
        // ==================== ÉVÉNEMENTS DASHBOARD ====================
        
        function attachDashboardEvents() {
            // Boutons rejoindre opportunités
            document.querySelectorAll('.join-opp-btn').forEach(btn => {
                btn.onclick = async () => {
                    const oppId = parseInt(btn.dataset.oppId);
                    const oppLink = btn.dataset.oppLink;
                    
                    try {
                        const result = await apiJoinOpportunity(oppId, oppLink);
                        if (result.success) {
                            showNotification(`Vous avez rejoint ${result.opportunityName} avec succès !`, 'success');
                            btn.textContent = '✅ Rejoint';
                            btn.disabled = true;
                            
                            // Sauvegarder le lien dans la base de données
                            await api.post('/user/save-opportunity-link', {
                                opportunityId: oppId,
                                link: oppLink,
                                userId: currentUser.id
                            });
                        }
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                };
            });
            
            // Bouton Communauté
            document.getElementById('communityBtn')?.addEventListener('click', () => {
                window.open('https://t.me/pointfocal_community', '_blank');
                showNotification('Rejoignez notre communauté Telegram !', 'success');
            });
            
            // Bouton FAQ
            document.getElementById('faqBtn')?.addEventListener('click', () => {
                showNotification('📖 FAQ: Pour toute question, contactez le support sur WhatsApp', 'info');
            });
            
            // Bouton Rafraîchir
            document.getElementById('refreshBtn')?.addEventListener('click', async () => {
                showNotification('Actualisation...', 'info');
                await render();
            });
            
            // Bouton Allô Mopao
            document.getElementById('callMopaoFromDashboardBtn')?.addEventListener('click', () => {
                apiSendNotification('call_mopao', { 
                    userId: currentUser?.id, 
                    userEmail: currentUser?.email,
                    timestamp: new Date().toISOString()
                });
                showNotification('📞 Votre Mopao a été notifié !', 'success');
            });
        }
        
        function attachLangEvents() {
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.onclick = () => {
                    currentLang = btn.dataset.lang;
                    render();
                };
            });
        }
        
        function attachAuthEvents() {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (loginForm) loginForm.onsubmit = (e) => handleLogin(e);
            if (registerForm) registerForm.onsubmit = (e) => handleRegister(e);
        }
        
        // ==================== UTILITAIRES ====================
        
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            if (input) input.type = input.type === 'password' ? 'text' : 'password';
        }
        
        async function logout() {
            try {
                await api.post('/auth/logout', {});
            } catch (e) {}
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('victoryStartTime');
            
            currentUser = null;
            currentStep = 'login';
            
            if (youtubeTimer) clearInterval(youtubeTimer);
            if (videoTimer) clearInterval(videoTimer);
            if (victoryTimer) clearInterval(victoryTimer);
            
            render();
            showNotification('Déconnecté avec succès', 'success');
        }
        
        function changeStep(step) {
            currentStep = step;
            render();
        }
        
        function forgotPassword() {
            const email = prompt('Entrez votre email pour recevoir un lien de réinitialisation:');
            if (email && email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                api.post('/auth/forgot-password', { email })
                    .then(() => showNotification('Un email de réinitialisation vous a été envoyé !', 'success'))
                    .catch(() => showNotification('Email non trouvé', 'error'));
            } else if (email) {
                showNotification('Email invalide', 'error');
            }
        }
        
        // ==================== INITIALISATION ====================
        
        // Exposer les fonctions globales nécessaires
        window.togglePassword = togglePassword;
        window.changeStep = changeStep;
        window.forgotPassword = forgotPassword;
        window.logout = logout;
        
        // Démarrer l'application
        render();
        
    </script>
</body>
</html>