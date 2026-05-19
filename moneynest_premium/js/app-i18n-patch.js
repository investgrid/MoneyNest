// ════════════════════════════════════════════════════════════════
// ─── app-i18n-patch.js · MoneyNest ──────────────────────────
// Keys extraídas de app.js (textos hardcodeados no cubiertos
// por i18n-patch.js ni billing-i18n-patch.js).
// 7 idiomas: es | en | fr | de | it | pt | ca
// ════════════════════════════════════════════════════════════════

;(function _patchAppTranslations() {
  const PATCH = {

    // ──────────────────────────────────────────────────────────────
    // ESPAÑOL (es)
    // ──────────────────────────────────────────────────────────────
    es: {
      // Modales / títulos
      modal_proveedor_nuevo:    'Nuevo Proveedor',
      modal_proveedor_editar:   'Editar Proveedor',
      modal_devengo_nuevo:      'Nuevo Devengo',
      modal_devengo_editar:     'Editar Devengo',
      modal_activo_nuevo:       'Nuevo Activo Físico',
      modal_activo_editar:      'Editar Activo',

      // Botones
      btn_entrar:               'Entrar',
      btn_entrando:             'Entrando…',
      btn_creando_cuenta:       'Creando cuenta…',
      btn_verificando:          'Verificando…',
      btn_verificar_codigo:     'Verificar código',
      btn_enviando:             'Enviando…',
      btn_enviado:              '✓ Enviado',
      btn_reenviar:             'Reenviar',
      btn_actualizar:           '✓ Actualizar',
      btn_confirmar_venta:      '💰 Confirmar venta',

      // Errores inline
      err_email_requerido:      '⚠ Introduce tu email primero.',
      err_enviar_enlace:        '⚠ Error al enviar el enlace.',
      err_reenviar:             '⚠ Error al reenviar.',
      err_email_valido:         '⚠ Introduce un correo electrónico válido.',
      err_password_minimo_8:    '⚠ La contraseña debe tener al menos 8 caracteres.',
      err_password_no_coinciden:'⚠ Las contraseñas no coinciden.',
      err_importe_valido_corto: 'Introduce un importe válido.',
      err_periodo_invalido:     'Introduce un período válido.',
      err_valor_activo_invalido:'Introduce un valor actual válido.',
      confirm_eliminar_proveedor: '¿Eliminar este proveedor?',
      confirm_eliminar_devengo:  '¿Eliminar este registro de devengo?',
      confirm_eliminar_activo:   '¿Eliminar este activo?',

      // Toasts
      toast_enlace_enviado:     '✅ Enlace enviado. Revisa tu email.',
      toast_demo_cargados:      'Datos de ejemplo cargados — explora libremente',
      toast_modo_real:          '✅ Modo real activado — app lista para tus datos',
      toast_modo_demo:          '✅ Modo demo activado — explora sin límites',

      // Placeholders
      placeholder_buscar_deuda:  '🔍 Buscar deuda...',
      placeholder_buscar_objetivo:'🔍 Buscar objetivo...',
      placeholder_email:         'tu@email.com',
      placeholder_nombre_ej:     'Ej: María García',

      // Selects
      opt_sin_cuenta:            'Sin cuenta',
      opt_sin_proveedor:         'Sin proveedor',
      opt_sin_asociar:           'Sin asociar',

      // Deudas / libertad financiera
      deuda_libertad_exito:      '¡Ya estás libre de deudas! 🎉',
      deuda_sin_pendientes_corto:'✅ Sin deudas pendientes.',

      // Insights
      insight_sin_anomalias:     '¡Sin anomalías este mes! Tus finanzas están en orden.',
      insight_sin_anomalias_corto:'¡Sin anomalías!',
      insight_finanzas_ok:       '¡Tus finanzas se ven equilibradas este período!',
      rating_excelente:          'Excelente ✅',
      rating_mejorable:          'Mejorable ⚡',
      rating_bajo:               'Bajo ⚠️',
      fondo_completo:            '¡Fondo completo!',

      // Demo
      demo_label:                'Modo demo',
      demo_sublabel:             'Datos de ejemplo activos',

      // Gamification / loading
      gamification_cargando:     'Sistema de logros cargando...',

      // Push notif fallback
      notif_push_no_disponibles: 'Las notificaciones push no están disponibles en este dispositivo.',
    },

    // ──────────────────────────────────────────────────────────────
    // ENGLISH (en)
    // ──────────────────────────────────────────────────────────────
    en: {
      modal_proveedor_nuevo:    'New Supplier',
      modal_proveedor_editar:   'Edit Supplier',
      modal_devengo_nuevo:      'New Accrual',
      modal_devengo_editar:     'Edit Accrual',
      modal_activo_nuevo:       'New Physical Asset',
      modal_activo_editar:      'Edit Asset',
      btn_entrar:               'Sign in',
      btn_entrando:             'Signing in…',
      btn_creando_cuenta:       'Creating account…',
      btn_verificando:          'Verifying…',
      btn_verificar_codigo:     'Verify code',
      btn_enviando:             'Sending…',
      btn_enviado:              '✓ Sent',
      btn_reenviar:             'Resend',
      btn_actualizar:           '✓ Update',
      btn_confirmar_venta:      '💰 Confirm sale',
      err_email_requerido:      '⚠ Enter your email first.',
      err_enviar_enlace:        '⚠ Error sending the link.',
      err_reenviar:             '⚠ Error resending.',
      err_email_valido:         '⚠ Enter a valid email address.',
      err_password_minimo_8:    '⚠ Password must be at least 8 characters.',
      err_password_no_coinciden:'⚠ Passwords do not match.',
      err_importe_valido_corto: 'Enter a valid amount.',
      err_periodo_invalido:     'Enter a valid period.',
      err_valor_activo_invalido:'Enter a valid current value.',
      confirm_eliminar_proveedor:'Delete this supplier?',
      confirm_eliminar_devengo:  'Delete this accrual entry?',
      confirm_eliminar_activo:   'Delete this asset?',
      toast_enlace_enviado:     '✅ Link sent. Check your email.',
      toast_demo_cargados:      'Sample data loaded — explore freely',
      toast_modo_real:          '✅ Real mode activated — app ready for your data',
      toast_modo_demo:          '✅ Demo mode activated — explore without limits',
      placeholder_buscar_deuda:  '🔍 Search debt...',
      placeholder_buscar_objetivo:'🔍 Search goal...',
      placeholder_email:         'you@email.com',
      placeholder_nombre_ej:     'E.g.: John Smith',
      opt_sin_cuenta:            'No account',
      opt_sin_proveedor:         'No supplier',
      opt_sin_asociar:           'Unassigned',
      deuda_libertad_exito:      'You are debt-free! 🎉',
      deuda_sin_pendientes_corto:'✅ No pending debts.',
      insight_sin_anomalias:     'No anomalies this month! Your finances are on track.',
      insight_sin_anomalias_corto:'No anomalies!',
      insight_finanzas_ok:       'Your finances look balanced this period!',
      rating_excelente:          'Excellent ✅',
      rating_mejorable:          'Improvable ⚡',
      rating_bajo:               'Low ⚠️',
      fondo_completo:            'Fund complete!',
      demo_label:                'Demo mode',
      demo_sublabel:             'Sample data active',
      gamification_cargando:     'Achievements loading...',
      notif_push_no_disponibles: 'Push notifications are not available on this device.',
    },

    // ──────────────────────────────────────────────────────────────
    // FRANÇAIS (fr)
    // ──────────────────────────────────────────────────────────────
    fr: {
      modal_proveedor_nuevo: 'Nouveau fournisseur', modal_proveedor_editar: 'Modifier fournisseur',
      modal_devengo_nuevo: 'Nouveau produit à recevoir', modal_devengo_editar: 'Modifier produit à recevoir',
      modal_activo_nuevo: 'Nouvel actif physique', modal_activo_editar: 'Modifier actif',
      btn_entrar: 'Se connecter', btn_entrando: 'Connexion…', btn_creando_cuenta: 'Création du compte…',
      btn_verificando: 'Vérification…', btn_verificar_codigo: 'Vérifier le code',
      btn_enviando: 'Envoi…', btn_enviado: '✓ Envoyé', btn_reenviar: 'Renvoyer',
      btn_actualizar: '✓ Mettre à jour', btn_confirmar_venta: '💰 Confirmer la vente',
      err_email_requerido: '⚠ Saisissez votre email d\'abord.',
      err_enviar_enlace: '⚠ Erreur lors de l\'envoi du lien.',
      err_reenviar: '⚠ Erreur lors du renvoi.',
      err_email_valido: '⚠ Saisissez une adresse email valide.',
      err_password_minimo_8: '⚠ Le mot de passe doit contenir au moins 8 caractères.',
      err_password_no_coinciden: '⚠ Les mots de passe ne correspondent pas.',
      err_importe_valido_corto: 'Saisissez un montant valide.',
      err_periodo_invalido: 'Saisissez une période valide.',
      err_valor_activo_invalido: 'Saisissez une valeur actuelle valide.',
      confirm_eliminar_proveedor: 'Supprimer ce fournisseur ?',
      confirm_eliminar_devengo: 'Supprimer cet enregistrement de produit à recevoir ?',
      confirm_eliminar_activo: 'Supprimer cet actif ?',
      toast_enlace_enviado: '✅ Lien envoyé. Vérifiez votre email.',
      toast_demo_cargados: 'Données d\'exemple chargées — explorez librement',
      toast_modo_real: '✅ Mode réel activé — application prête pour vos données',
      toast_modo_demo: '✅ Mode démo activé — explorez sans limites',
      placeholder_buscar_deuda: '🔍 Rechercher une dette...',
      placeholder_buscar_objetivo: '🔍 Rechercher un objectif...',
      placeholder_email: 'vous@email.com',
      placeholder_nombre_ej: 'Ex : Jean Dupont',
      opt_sin_cuenta: 'Sans compte', opt_sin_proveedor: 'Sans fournisseur', opt_sin_asociar: 'Non associé',
      deuda_libertad_exito: 'Vous êtes libre de dettes ! 🎉',
      deuda_sin_pendientes_corto: '✅ Aucune dette en attente.',
      insight_sin_anomalias: 'Aucune anomalie ce mois ! Vos finances sont en ordre.',
      insight_sin_anomalias_corto: 'Aucune anomalie !',
      insight_finanzas_ok: 'Vos finances semblent équilibrées cette période !',
      rating_excelente: 'Excellent ✅', rating_mejorable: 'Améliorable ⚡', rating_bajo: 'Bas ⚠️',
      fondo_completo: 'Fonds complet !', demo_label: 'Mode démo', demo_sublabel: 'Données exemples actives',
      gamification_cargando: 'Chargement des succès...', notif_push_no_disponibles: 'Les notifications push ne sont pas disponibles sur cet appareil.',
    },

    // ──────────────────────────────────────────────────────────────
    // DEUTSCH (de)
    // ──────────────────────────────────────────────────────────────
    de: {
      modal_proveedor_nuevo: 'Neuer Lieferant', modal_proveedor_editar: 'Lieferant bearbeiten',
      modal_devengo_nuevo: 'Neue Abgrenzung', modal_devengo_editar: 'Abgrenzung bearbeiten',
      modal_activo_nuevo: 'Neues Anlagevermögen', modal_activo_editar: 'Anlage bearbeiten',
      btn_entrar: 'Anmelden', btn_entrando: 'Anmeldung…', btn_creando_cuenta: 'Konto wird erstellt…',
      btn_verificando: 'Wird geprüft…', btn_verificar_codigo: 'Code bestätigen',
      btn_enviando: 'Wird gesendet…', btn_enviado: '✓ Gesendet', btn_reenviar: 'Erneut senden',
      btn_actualizar: '✓ Aktualisieren', btn_confirmar_venta: '💰 Verkauf bestätigen',
      err_email_requerido: '⚠ Geben Sie zuerst Ihre E-Mail ein.',
      err_enviar_enlace: '⚠ Fehler beim Senden des Links.',
      err_reenviar: '⚠ Fehler beim erneuten Senden.',
      err_email_valido: '⚠ Geben Sie eine gültige E-Mail-Adresse ein.',
      err_password_minimo_8: '⚠ Das Passwort muss mindestens 8 Zeichen haben.',
      err_password_no_coinciden: '⚠ Die Passwörter stimmen nicht überein.',
      err_importe_valido_corto: 'Geben Sie einen gültigen Betrag ein.',
      err_periodo_invalido: 'Geben Sie einen gültigen Zeitraum ein.',
      err_valor_activo_invalido: 'Geben Sie einen gültigen aktuellen Wert ein.',
      confirm_eliminar_proveedor: 'Diesen Lieferanten löschen?',
      confirm_eliminar_devengo: 'Diesen Abgrenzungseintrag löschen?',
      confirm_eliminar_activo: 'Dieses Anlagevermögen löschen?',
      toast_enlace_enviado: '✅ Link gesendet. Überprüfen Sie Ihre E-Mail.',
      toast_demo_cargados: 'Beispieldaten geladen — erkunden Sie frei',
      toast_modo_real: '✅ Realmodus aktiviert — App bereit für Ihre Daten',
      toast_modo_demo: '✅ Demomodus aktiviert — erkunden Sie ohne Grenzen',
      placeholder_buscar_deuda: '🔍 Schulden suchen...', placeholder_buscar_objetivo: '🔍 Ziel suchen...',
      placeholder_email: 'sie@email.com', placeholder_nombre_ej: 'Z.B.: Hans Müller',
      opt_sin_cuenta: 'Kein Konto', opt_sin_proveedor: 'Kein Lieferant', opt_sin_asociar: 'Nicht zugeordnet',
      deuda_libertad_exito: 'Sie sind schuldenfrei! 🎉',
      deuda_sin_pendientes_corto: '✅ Keine ausstehenden Schulden.',
      insight_sin_anomalias: 'Keine Anomalien diesen Monat! Ihre Finanzen sind in Ordnung.',
      insight_sin_anomalias_corto: 'Keine Anomalien!',
      insight_finanzas_ok: 'Ihre Finanzen sehen in diesem Zeitraum ausgewogen aus!',
      rating_excelente: 'Ausgezeichnet ✅', rating_mejorable: 'Verbesserbar ⚡', rating_bajo: 'Niedrig ⚠️',
      fondo_completo: 'Fonds vollständig!', demo_label: 'Demomodus', demo_sublabel: 'Beispieldaten aktiv',
      gamification_cargando: 'Erfolge werden geladen...', notif_push_no_disponibles: 'Push-Benachrichtigungen sind auf diesem Gerät nicht verfügbar.',
    },

    // ──────────────────────────────────────────────────────────────
    // ITALIANO (it)
    // ──────────────────────────────────────────────────────────────
    it: {
      modal_proveedor_nuevo: 'Nuovo fornitore', modal_proveedor_editar: 'Modifica fornitore',
      modal_devengo_nuevo: 'Nuovo rateo', modal_devengo_editar: 'Modifica rateo',
      modal_activo_nuevo: 'Nuovo bene fisico', modal_activo_editar: 'Modifica bene',
      btn_entrar: 'Accedi', btn_entrando: 'Accesso…', btn_creando_cuenta: 'Creazione account…',
      btn_verificando: 'Verifica…', btn_verificar_codigo: 'Verifica codice',
      btn_enviando: 'Invio…', btn_enviado: '✓ Inviato', btn_reenviar: 'Reinvia',
      btn_actualizar: '✓ Aggiorna', btn_confirmar_venta: '💰 Conferma vendita',
      err_email_requerido: '⚠ Inserisci prima la tua email.',
      err_enviar_enlace: '⚠ Errore nell\'invio del link.',
      err_reenviar: '⚠ Errore nel reinvio.',
      err_email_valido: '⚠ Inserisci un indirizzo email valido.',
      err_password_minimo_8: '⚠ La password deve avere almeno 8 caratteri.',
      err_password_no_coinciden: '⚠ Le password non coincidono.',
      err_importe_valido_corto: 'Inserisci un importo valido.',
      err_periodo_invalido: 'Inserisci un periodo valido.',
      err_valor_activo_invalido: 'Inserisci un valore attuale valido.',
      confirm_eliminar_proveedor: 'Eliminare questo fornitore?',
      confirm_eliminar_devengo: 'Eliminare questo rateo?',
      confirm_eliminar_activo: 'Eliminare questo bene?',
      toast_enlace_enviado: '✅ Link inviato. Controlla la tua email.',
      toast_demo_cargados: 'Dati di esempio caricati — esplora liberamente',
      toast_modo_real: '✅ Modalità reale attivata — app pronta per i tuoi dati',
      toast_modo_demo: '✅ Modalità demo attivata — esplora senza limiti',
      placeholder_buscar_deuda: '🔍 Cerca debito...', placeholder_buscar_objetivo: '🔍 Cerca obiettivo...',
      placeholder_email: 'tu@email.com', placeholder_nombre_ej: 'Es.: Mario Rossi',
      opt_sin_cuenta: 'Senza conto', opt_sin_proveedor: 'Senza fornitore', opt_sin_asociar: 'Non associato',
      deuda_libertad_exito: 'Sei libero dai debiti! 🎉',
      deuda_sin_pendientes_corto: '✅ Nessun debito in sospeso.',
      insight_sin_anomalias: 'Nessuna anomalia questo mese! Le tue finanze sono in ordine.',
      insight_sin_anomalias_corto: 'Nessuna anomalia!',
      insight_finanzas_ok: 'Le tue finanze sembrano equilibrate in questo periodo!',
      rating_excelente: 'Eccellente ✅', rating_mejorable: 'Migliorabile ⚡', rating_bajo: 'Basso ⚠️',
      fondo_completo: 'Fondo completo!', demo_label: 'Modalità demo', demo_sublabel: 'Dati di esempio attivi',
      gamification_cargando: 'Caricamento traguardi...', notif_push_no_disponibles: 'Le notifiche push non sono disponibili su questo dispositivo.',
    },

    // ──────────────────────────────────────────────────────────────
    // PORTUGUÊS (pt)
    // ──────────────────────────────────────────────────────────────
    pt: {
      modal_proveedor_nuevo: 'Novo fornecedor', modal_proveedor_editar: 'Editar fornecedor',
      modal_devengo_nuevo: 'Novo acréscimo', modal_devengo_editar: 'Editar acréscimo',
      modal_activo_nuevo: 'Novo ativo físico', modal_activo_editar: 'Editar ativo',
      btn_entrar: 'Entrar', btn_entrando: 'A entrar…', btn_creando_cuenta: 'A criar conta…',
      btn_verificando: 'A verificar…', btn_verificar_codigo: 'Verificar código',
      btn_enviando: 'A enviar…', btn_enviado: '✓ Enviado', btn_reenviar: 'Reenviar',
      btn_actualizar: '✓ Atualizar', btn_confirmar_venta: '💰 Confirmar venda',
      err_email_requerido: '⚠ Introduz primeiro o teu email.',
      err_enviar_enlace: '⚠ Erro ao enviar o link.',
      err_reenviar: '⚠ Erro ao reenviar.',
      err_email_valido: '⚠ Introduz um endereço de email válido.',
      err_password_minimo_8: '⚠ A palavra-passe deve ter pelo menos 8 caracteres.',
      err_password_no_coinciden: '⚠ As palavras-passe não coincidem.',
      err_importe_valido_corto: 'Introduz um valor válido.',
      err_periodo_invalido: 'Introduz um período válido.',
      err_valor_activo_invalido: 'Introduz um valor atual válido.',
      confirm_eliminar_proveedor: 'Eliminar este fornecedor?',
      confirm_eliminar_devengo: 'Eliminar este registo de acréscimo?',
      confirm_eliminar_activo: 'Eliminar este ativo?',
      toast_enlace_enviado: '✅ Link enviado. Verifica o teu email.',
      toast_demo_cargados: 'Dados de exemplo carregados — explora livremente',
      toast_modo_real: '✅ Modo real ativado — app pronta para os teus dados',
      toast_modo_demo: '✅ Modo demo ativado — explora sem limites',
      placeholder_buscar_deuda: '🔍 Pesquisar dívida...', placeholder_buscar_objetivo: '🔍 Pesquisar objetivo...',
      placeholder_email: 'tu@email.com', placeholder_nombre_ej: 'Ex: João Silva',
      opt_sin_cuenta: 'Sem conta', opt_sin_proveedor: 'Sem fornecedor', opt_sin_asociar: 'Não associado',
      deuda_libertad_exito: 'Estás livre de dívidas! 🎉',
      deuda_sin_pendientes_corto: '✅ Sem dívidas pendentes.',
      insight_sin_anomalias: 'Sem anomalias este mês! As tuas finanças estão em ordem.',
      insight_sin_anomalias_corto: 'Sem anomalias!',
      insight_finanzas_ok: 'As tuas finanças parecem equilibradas neste período!',
      rating_excelente: 'Excelente ✅', rating_mejorable: 'Melhorável ⚡', rating_bajo: 'Baixo ⚠️',
      fondo_completo: 'Fundo completo!', demo_label: 'Modo demo', demo_sublabel: 'Dados de exemplo ativos',
      gamification_cargando: 'A carregar conquistas...', notif_push_no_disponibles: 'As notificações push não estão disponíveis neste dispositivo.',
    },

    // ──────────────────────────────────────────────────────────────
    // CATALÀ (ca)
    // ──────────────────────────────────────────────────────────────
    ca: {
      modal_proveedor_nuevo: 'Nou proveïdor', modal_proveedor_editar: 'Editar proveïdor',
      modal_devengo_nuevo: 'Nou meritament', modal_devengo_editar: 'Editar meritament',
      modal_activo_nuevo: 'Nou actiu físic', modal_activo_editar: 'Editar actiu',
      btn_entrar: 'Entrar', btn_entrando: 'Entrant…', btn_creando_cuenta: 'Creant compte…',
      btn_verificando: 'Verificant…', btn_verificar_codigo: 'Verificar codi',
      btn_enviando: 'Enviant…', btn_enviado: '✓ Enviat', btn_reenviar: 'Reenviar',
      btn_actualizar: '✓ Actualitzar', btn_confirmar_venta: '💰 Confirmar venda',
      err_email_requerido: '⚠ Introdueix el teu email primer.',
      err_enviar_enlace: '⚠ Error en enviar l\'enllaç.',
      err_reenviar: '⚠ Error en reenviar.',
      err_email_valido: '⚠ Introdueix una adreça d\'email vàlida.',
      err_password_minimo_8: '⚠ La contrasenya ha de tenir almenys 8 caràcters.',
      err_password_no_coinciden: '⚠ Les contrasenyes no coincideixen.',
      err_importe_valido_corto: 'Introdueix un import vàlid.',
      err_periodo_invalido: 'Introdueix un període vàlid.',
      err_valor_activo_invalido: 'Introdueix un valor actual vàlid.',
      confirm_eliminar_proveedor: 'Eliminar aquest proveïdor?',
      confirm_eliminar_devengo: 'Eliminar aquest registre de meritament?',
      confirm_eliminar_activo: 'Eliminar aquest actiu?',
      toast_enlace_enviado: '✅ Enllaç enviat. Revisa el teu email.',
      toast_demo_cargados: 'Dades d\'exemple carregades — explora lliurement',
      toast_modo_real: '✅ Mode real activat — app llesta per a les teves dades',
      toast_modo_demo: '✅ Mode demo activat — explora sense límits',
      placeholder_buscar_deuda: '🔍 Cercar deute...', placeholder_buscar_objetivo: '🔍 Cercar objectiu...',
      placeholder_email: 'tu@email.com', placeholder_nombre_ej: 'Ex: Joan Garcia',
      opt_sin_cuenta: 'Sense compte', opt_sin_proveedor: 'Sense proveïdor', opt_sin_asociar: 'Sense associar',
      deuda_libertad_exito: 'Estàs lliure de deutes! 🎉',
      deuda_sin_pendientes_corto: '✅ Sense deutes pendents.',
      insight_sin_anomalias: 'Sense anomalies aquest mes! Les teves finances estan en ordre.',
      insight_sin_anomalias_corto: 'Sense anomalies!',
      insight_finanzas_ok: 'Les teves finances semblen equilibrades en aquest període!',
      rating_excelente: 'Excel·lent ✅', rating_mejorable: 'Millorable ⚡', rating_bajo: 'Baix ⚠️',
      fondo_completo: 'Fons complet!', demo_label: 'Mode demo', demo_sublabel: 'Dades d\'exemple actives',
      gamification_cargando: 'Carregant assoliments...', notif_push_no_disponibles: 'Les notificacions push no estan disponibles en aquest dispositiu.',
    },
  };

  if (typeof TRANSLATIONS !== 'undefined') {
    Object.keys(PATCH).forEach(lang => {
      if (!TRANSLATIONS[lang]) TRANSLATIONS[lang] = {};
      Object.assign(TRANSLATIONS[lang], PATCH[lang]);
    });
  }
})();
