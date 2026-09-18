import { icon, refreshIcons } from './IconHelper.js';
import { soundFx } from '../core/SoundEffects.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { LeaderboardService } from '../core/LeaderboardService.js';
import { GEOLOGICAL_LAYERS } from './MinerBookModal.js';

export class EmergencyRescueModal {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.pollInterval = null;
    this.createDom();
  }

  createDom() {
    let el = document.getElementById('emergency-rescue-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'emergency-rescue-modal';
      el.className = 'emergency-rescue-backdrop';
      el.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 12000;
        background: rgba(4, 7, 15, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        align-items: center;
        justify-content: center;
        padding: 12px;
        box-sizing: border-box;
      `;
      document.body.appendChild(el);
    }
    this.modalEl = el;
  }

  getCurrentLayer(depthMeters) {
    let matched = GEOLOGICAL_LAYERS[0];
    for (const layer of GEOLOGICAL_LAYERS) {
      if (depthMeters >= layer.minDepth) {
        matched = layer;
      }
    }
    return matched;
  }

  checkInsuranceValid(depthMeters) {
    if (!this.player.activeInsurance) return false;
    return depthMeters <= (this.player.activeInsurance.maxDepth || 50);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    document.body.classList.add('modal-open');
    this.modalEl.style.display = 'flex';
    this.render();
  }

  close() {
    this.isOpen = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.modalEl.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  render() {
    const p = this.player;
    const depth = Math.max(0, Math.floor(p.depthMeters || p.gy || 0));
    const layer = this.getCurrentLayer(depth);
    const isFirstRescue = !p.firstRescueUsed;
    const hasValidInsurance = this.checkInsuranceValid(depth);
    const canUseCanister = (p.gadgets?.fuel_canister || 0) > 0;

    // ── FALL 1: ERSTE RETTUNG KOSTENLOS ──────────────────────────────────────
    if (isFirstRescue) {
      this.modalEl.innerHTML = `
        <div class="emergency-rescue-window" style="
          background: linear-gradient(180deg, #111827 0%, #0b0f19 100%);
          border: 1px solid rgba(239, 68, 68, 0.45);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(239, 68, 68, 0.2);
          border-radius: 14px;
          max-width: 420px;
          width: 95%;
          max-height: 94vh;
          overflow-y: auto;
          padding: 16px 18px;
          box-sizing: border-box;
          color: #f8fafc;
          position: relative;
        ">
          <!-- Funkspruch Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(239, 68, 68, 0.16);
              border: 1px solid rgba(239, 68, 68, 0.4);
              color: #f87171;
              padding: 2px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.6px;
            ">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ef4444; animation: warnPulse 0.9s infinite;"></span>
              MINENRETTUNGSDIENST • NOTRUF
            </span>
            <span style="
              background: rgba(56, 189, 248, 0.14);
              border: 1px solid rgba(56, 189, 248, 0.35);
              color: #38bdf8;
              padding: 2px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 800;
            ">
              ERSTBERGUNG
            </span>
          </div>

          <h2 style="margin: 0 0 4px 0; font-size: 16.5px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px;">
            Crawler havariert: Rettungstrupp bereit
          </h2>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4;">
            Ortung bestätigt: Position bei <strong>${depth} m</strong> (${layer.name}). Treibstoffreserven vollständig erschöpft.
          </div>

          <!-- Funkspruch Box -->
          <div style="
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 14px;
            font-size: 11px;
            line-height: 1.45;
            color: #cbd5e1;
          ">
            <div style="display: flex; gap: 9px; align-items: flex-start;">
              <div style="color: #38bdf8; flex-shrink: 0; margin-top: 1px;">
                ${icon('radio', '', 16)}
              </div>
              <div>
                <strong style="color: #f8fafc; font-size: 11.5px;">Einsatzprotokoll der Grubenwehr:</strong><br>
                „Ein schweres Bergefahrzeug ist einsatzbereit. Unser Team schleppt deinen Crawler an die Erdoberfläche und betankt ihn mit 20% Notreserve.“
                <div style="
                  background: rgba(245, 158, 11, 0.1);
                  border: 1px solid rgba(245, 158, 11, 0.3);
                  border-radius: 6px;
                  padding: 7px 9px;
                  margin-top: 7px;
                  font-size: 10.5px;
                  color: #e2e8f0;
                ">
                  <span style="color: #fbbf24; font-weight: 800; display: block; margin-bottom: 2px;">⚠️ Grubenordnung & Versicherungspflicht:</span>
                  Dies ist deine <strong>einmalige Kulanz-Bergung</strong>. Für künftige Tiefenfahrten musst du im <strong>Büro (Tab „Versicherung“)</strong> eine Schicht-Police abschließen. Ohne Deckung endet jeder weitere Treibstoffausfall im <strong>Game Over</strong>!
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-rescue-free" class="btn-3d-danger" style="
              height: 44px;
              width: 100%;
              font-size: 12.5px;
              font-weight: 800;
              justify-content: center;
              gap: 8px;
              border-radius: 10px;
              border: none;
              background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
              box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
            ">
              ${icon('truck', '', 16)}
              <span>RETTUNGSFAHRZEUG ANFORDERN</span>
            </button>

            ${canUseCanister ? `
              <button id="btn-rescue-use-fuel" class="btn-action" style="
                height: 38px;
                width: 100%;
                font-size: 11.5px;
                font-weight: 700;
                justify-content: center;
                gap: 6px;
                border-radius: 10px;
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #38bdf8;
              ">
                ${icon('fuel', '', 14)}
                <span>Treibstoff-Kanister verwenden (${p.gadgets.fuel_canister}x)</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      refreshIcons(this.modalEl);

      const btnFree = this.modalEl.querySelector('#btn-rescue-free');
      if (btnFree) {
        btnFree.onclick = () => {
          soundFx.playPurchase();
          p.firstRescueUsed = true;
          p.freeRescues = 0;
          SaveSystem.save(this.scene);
          this.close();
          if (this.scene && this.scene.playRescueCutscene) {
            this.scene.playRescueCutscene('Erstbergung durch die Minenrettung erfolgreich! Schließe im Büro eine Versicherung ab.');
          } else {
            p.teleportToSurface('Erstbergung erfolgreich! Schließe im Büro eine Versicherung ab.');
          }
        };
      }

      const btnCanister = this.modalEl.querySelector('#btn-rescue-use-fuel');
      if (btnCanister) {
        btnCanister.onclick = () => {
          if (p.useFuelCanister && p.useFuelCanister()) {
            this.close();
          }
        };
      }
      return;
    }

    // ── FALL 2: VERSICHERUNG AKTIV & GÜLTIG FÜR DIESE TIEFE ──────────────────
    if (hasValidInsurance) {
      const ins = p.activeInsurance;
      this.modalEl.innerHTML = `
        <div class="emergency-rescue-window" style="
          background: linear-gradient(180deg, #111827 0%, #0b0f19 100%);
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.15);
          border-radius: 14px;
          max-width: 420px;
          width: 95%;
          max-height: 94vh;
          overflow-y: auto;
          padding: 16px 18px;
          box-sizing: border-box;
          color: #f8fafc;
          position: relative;
        ">
          <!-- Header Tag -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.35);
              color: #f87171;
              padding: 2px 8px;
              border-radius: 20px;
              font-size: 10.5px;
              font-weight: 800;
            ">
              ${icon('alert-triangle', '', 12)}
              TREIBSTOFF LEER
            </span>
            <span style="
              background: rgba(16, 185, 129, 0.18);
              border: 1px solid rgba(16, 185, 129, 0.4);
              color: #34d399;
              padding: 2px 8px;
              border-radius: 20px;
              font-size: 10.5px;
              font-weight: 800;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            ">
              ${icon('shield-check', '', 12)}
              VERSICHERT
            </span>
          </div>

          <h2 style="margin: 0 0 4px 0; font-size: 17px; font-weight: 800; color: #ffffff;">
            Versicherte Bergung
          </h2>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">
            Dein Crawler sitzt bei <strong>${depth} m</strong> (${layer.name}) fest.
          </div>

          <!-- Infobox Versicherung -->
          <div style="
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.25);
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 14px;
            font-size: 11px;
            line-height: 1.45;
            color: #cbd5e1;
          ">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <div style="color: #34d399; flex-shrink: 0; margin-top: 1px;">
                ${icon('shield-check', '', 16)}
              </div>
              <div>
                <strong>Gedeckt durch deine ${ins.layerName}-Versicherung!</strong><br>
                Deine Police deckt Tiefen bis <strong>${ins.maxDepth} m</strong> ab. Die Bergungsdrohnen bringen deinen Crawler sicher zur Basis zurück (Tank wird auf 20% geladen).<br><br>
                <span style="color: #94a3b8;">Hinweis: Die Police wird bei der Rettung verbraucht. Schließe an der Oberfläche im Büro einen neuen Schutz ab.</span>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-rescue-insured" class="btn-3d-success" style="
              height: 42px;
              width: 100%;
              font-size: 12.5px;
              font-weight: 800;
              justify-content: center;
              gap: 8px;
              border-radius: 10px;
              border: none;
              background: linear-gradient(180deg, #10b981 0%, #059669 100%);
              box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
            ">
              ${icon('shield', '', 16)}
              <span>VERSICHERTE RETTUNG STARTEN</span>
            </button>

            ${canUseCanister ? `
              <button id="btn-rescue-use-fuel" class="btn-action" style="
                height: 38px;
                width: 100%;
                font-size: 11.5px;
                font-weight: 700;
                justify-content: center;
                gap: 6px;
                border-radius: 10px;
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #38bdf8;
              ">
                ${icon('fuel', '', 14)}
                <span>Treibstoff-Kanister verwenden (${p.gadgets.fuel_canister}x)</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      refreshIcons(this.modalEl);

      const btnInsured = this.modalEl.querySelector('#btn-rescue-insured');
      if (btnInsured) {
        btnInsured.onclick = () => {
          soundFx.playPurchase();
          p.activeInsurance = null; // Versicherung wird verbraucht
          SaveSystem.save(this.scene);
          this.close();
          if (this.scene && this.scene.playRescueCutscene) {
            this.scene.playRescueCutscene('Versicherte Bergung erfolgreich! Versicherung aufgebraucht.');
          } else {
            p.teleportToSurface('Versicherte Bergung erfolgreich! Versicherung aufgebraucht.');
          }
        };
      }

      const btnCanister = this.modalEl.querySelector('#btn-rescue-use-fuel');
      if (btnCanister) {
        btnCanister.onclick = () => {
          if (p.useFuelCanister && p.useFuelCanister()) {
            this.close();
          }
        };
      }
      return;
    }

    // ── FALL 3: KEINE VERSICHERUNG -> GAME OVER! ──────────────────────────────
    p.isGameOver = true;
    soundFx.playError?.();

    // Game Over in Supabase speichern
    LeaderboardService.setGameOver(p.name, true, depth, p.level);
    SaveSystem.save(this.scene);

    this.modalEl.innerHTML = `
      <div class="emergency-rescue-window" style="
        background: radial-gradient(circle at top, #1f1212 0%, #0a0505 100%);
        border: 2px solid rgba(239, 68, 68, 0.6);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(239, 68, 68, 0.3);
        border-radius: 14px;
        max-width: 440px;
        width: 95%;
        max-height: 94vh;
        overflow-y: auto;
        padding: 18px 20px;
        box-sizing: border-box;
        color: #f8fafc;
        text-align: center;
        position: relative;
      ">
        <div style="font-size: 32px; line-height: 1; margin-bottom: 6px;">💀</div>
        <h2 style="margin: 0 0 3px 0; font-size: 22px; font-weight: 900; color: #ef4444; letter-spacing: 0.8px;">
          GAME OVER
        </h2>
        <div style="font-size: 11.5px; font-weight: 700; color: #fca5a5; margin-bottom: 10px;">
          Treibstoff erschöpft in ${depth} m Tiefe (${layer.name})
        </div>

        <p style="font-size: 11px; color: #cbd5e1; line-height: 1.45; margin: 0 0 12px 0;">
          Deine Erstbergung wurde bereits aufgebraucht und du hattest <strong>keine Versicherung</strong> für die Schicht <em>${layer.name}</em> abgeschlossen. Dein Crawler sitzt im Tiefengestein fest.
        </p>

        <!-- Entwickler-Rettung Kasten (nicht-technisch) -->
        <div style="
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 14px;
          text-align: left;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('life-buoy', '', 14)}
              Entwickler-Unterstützung
            </span>
            <span id="gameover-db-badge" style="
              background: rgba(239, 68, 68, 0.2);
              color: #f87171;
              font-size: 9.5px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 4px;
            ">
              Wartet auf Freigabe
            </span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.45;">
            Fahrer: <strong style="color: #f8fafc;">${p.name}</strong><br>
            Der Entwickler kann deinen Crawler aus der Ferne kostenlos freischalten und bergen. Klicke auf den Button, sobald er die Rettung für dich freigegeben hat.
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-check-db-rescue" class="btn-action" style="
            height: 42px;
            width: 100%;
            font-size: 12px;
            font-weight: 800;
            justify-content: center;
            gap: 7px;
            border-radius: 10px;
            background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
            border: 1px solid rgba(56, 189, 248, 0.5);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
            cursor: pointer;
          ">
            ${icon('refresh-cw', '', 14)}
            <span>FREIGABE PRÜFEN & RETTUNG STARTEN</span>
          </button>

          <div id="gameover-status-msg" style="font-size: 10.5px; color: #94a3b8; min-height: 14px;">
            Klicke auf den Button, um den Status abzufragen.
          </div>
        </div>
      </div>
    `;

    refreshIcons(this.modalEl);

    // DB-Check Handler: NUR bei Klick auf den Button (kein Auto-Poll)
    const btnCheck = this.modalEl.querySelector('#btn-check-db-rescue');
    const msgEl = this.modalEl.querySelector('#gameover-status-msg');
    const badgeEl = this.modalEl.querySelector('#gameover-db-badge');

    const runCheck = async () => {
      if (btnCheck) btnCheck.disabled = true;
      if (msgEl) msgEl.textContent = 'Prüfe Freigabe...';
      const isStillGameOver = await LeaderboardService.checkGameOver(p.name);
      if (btnCheck) btnCheck.disabled = false;
      
      if (isStillGameOver === false) {
        if (badgeEl) {
          badgeEl.textContent = 'Freigegeben!';
          badgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
          badgeEl.style.color = '#34d399';
        }
        if (msgEl) {
          msgEl.innerHTML = '<span style="color: #34d399; font-weight: 800;">🎉 Rettung freigegeben! Rettungsfahrzeug rückt an...</span>';
        }
        soundFx.playUpgrade?.();
        p.isGameOver = false;
        SaveSystem.save(this.scene);
        
        setTimeout(() => {
          this.close();
          if (this.scene && this.scene.playRescueCutscene) {
            this.scene.playRescueCutscene('Vom Entwickler gerettet! Willkommen zurück an der Oberfläche.');
          } else {
            p.teleportToSurface('Vom Entwickler gerettet! Willkommen zurück an der Oberfläche.');
          }
        }, 600);
      } else {
        if (msgEl) {
          msgEl.textContent = 'Noch keine Freigabe vorhanden. Bitte Entwickler kontaktieren und erneut prüfen.';
        }
      }
    };

    if (btnCheck) {
      btnCheck.onclick = () => runCheck();
    }
  }
}
