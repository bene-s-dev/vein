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
      el.className = 'modal-backdrop';
      el.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 12000;
        background: rgba(4, 7, 15, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        align-items: center;
        justify-content: center;
        padding: 16px;
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
        <div class="modal-window" style="
          background: linear-gradient(180deg, #111827 0%, #0b0f19 100%);
          border: 1px solid rgba(245, 158, 11, 0.4);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(245, 158, 11, 0.15);
          border-radius: 16px;
          max-width: 440px;
          width: 100%;
          padding: 24px;
          box-sizing: border-box;
          color: #f8fafc;
          position: relative;
        ">
          <!-- Header Tag -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.35);
              color: #f87171;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.5px;
            ">
              ${icon('alert-triangle', '', 13)}
              TREIBSTOFF LEER
            </span>
            <span style="
              background: rgba(16, 185, 129, 0.18);
              border: 1px solid rgba(16, 185, 129, 0.4);
              color: #34d399;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
            ">
              1x KOSTENLOS
            </span>
          </div>

          <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
            Notfall-Bergung zur Basis
          </h2>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">
            Dein Crawler sitzt bei <strong>${depth} m</strong> (${layer.name}) fest und die Tanks sind erschöpft.
          </div>

          <!-- Infokasten -->
          <div style="
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 20px;
            font-size: 11.5px;
            line-height: 1.5;
            color: #cbd5e1;
          ">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <div style="color: #fbbf24; flex-shrink: 0; margin-top: 1px;">
                ${icon('info', '', 16)}
              </div>
              <div>
                <strong>Erste Rettung ist kostenlos!</strong><br>
                Die Basis schleppt deinen Crawler sofort zur Oberfläche und lädt den Tank auf 20% auf.<br><br>
                <span style="color: #fb923c; font-weight: 700;">Wichtiger Hinweis:</span>
                Dies ist deine einzige kostenlose Rettung. Für alle zukünftigen Notfälle musst du im <strong>Büro (Tab „Versicherung“)</strong> eine Schicht-Versicherung abschließen. Ohne Versicherung führt jeder weitere Treibstoffmangel zum <strong>Game Over</strong>!
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-rescue-free" class="btn-3d-danger" style="
              height: 46px;
              width: 100%;
              font-size: 13px;
              font-weight: 800;
              justify-content: center;
              gap: 8px;
              border-radius: 10px;
              border: none;
              background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
              box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
            ">
              ${icon('rocket', '', 16)}
              <span>KOSTENLOSE RETTUNG ANFORDERN</span>
            </button>

            ${canUseCanister ? `
              <button id="btn-rescue-use-fuel" class="btn-action" style="
                height: 40px;
                width: 100%;
                font-size: 12px;
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
          p.teleportToSurface('Kostenlose Erstbergung erfolgreich! Schließe im Büro eine Versicherung ab.');
          SaveSystem.save(this.scene);
          this.close();
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
        <div class="modal-window" style="
          background: linear-gradient(180deg, #111827 0%, #0b0f19 100%);
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(56, 189, 248, 0.15);
          border-radius: 16px;
          max-width: 440px;
          width: 100%;
          padding: 24px;
          box-sizing: border-box;
          color: #f8fafc;
          position: relative;
        ">
          <!-- Header Tag -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.35);
              color: #f87171;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
            ">
              ${icon('alert-triangle', '', 13)}
              TREIBSTOFF LEER
            </span>
            <span style="
              background: rgba(16, 185, 129, 0.18);
              border: 1px solid rgba(16, 185, 129, 0.4);
              color: #34d399;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
              display: inline-flex;
              align-items: center;
              gap: 5px;
            ">
              ${icon('shield-check', '', 13)}
              VERSICHERT
            </span>
          </div>

          <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #ffffff;">
            Versicherte Bergung
          </h2>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">
            Dein Crawler sitzt bei <strong>${depth} m</strong> (${layer.name}) fest.
          </div>

          <!-- Infobox Versicherung -->
          <div style="
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.25);
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 20px;
            font-size: 11.5px;
            line-height: 1.5;
            color: #cbd5e1;
          ">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <div style="color: #34d399; flex-shrink: 0; margin-top: 2px;">
                ${icon('shield-check', '', 18)}
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
              height: 46px;
              width: 100%;
              font-size: 13px;
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
                height: 40px;
                width: 100%;
                font-size: 12px;
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
          p.teleportToSurface('Versicherte Bergung erfolgreich! Versicherung aufgebraucht.');
          SaveSystem.save(this.scene);
          this.close();
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
      <div class="modal-window" style="
        background: radial-gradient(circle at top, #1f1212 0%, #0a0505 100%);
        border: 2px solid rgba(239, 68, 68, 0.6);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(239, 68, 68, 0.3);
        border-radius: 16px;
        max-width: 460px;
        width: 100%;
        padding: 26px;
        box-sizing: border-box;
        color: #f8fafc;
        text-align: center;
        position: relative;
      ">
        <div style="font-size: 38px; line-height: 1; margin-bottom: 8px;">💀</div>
        <h2 style="margin: 0 0 4px 0; font-size: 26px; font-weight: 900; color: #ef4444; letter-spacing: 1px;">
          GAME OVER
        </h2>
        <div style="font-size: 13px; font-weight: 700; color: #fca5a5; margin-bottom: 12px;">
          Treibstoff erschöpft in ${depth} m Tiefe (${layer.name})
        </div>

        <p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin: 0 0 16px 0;">
          Deine kostenlose Erstbergung wurde bereits aufgebraucht und du hattest <strong>keine gültige Versicherung</strong> für die Schicht <em>${layer.name}</em> abgeschlossen. Dein Crawler ist im Tiefengestein verschüttet.
        </p>

        <!-- Supabase Status Kasten -->
        <div style="
          background: rgba(15, 23, 42, 0.85);
          border: 1px dashed rgba(239, 68, 68, 0.45);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 18px;
          text-align: left;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #f87171; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('database', '', 13)}
              SUPABASE DATENBANK-STATUS
            </span>
            <span id="gameover-db-badge" style="
              background: rgba(239, 68, 68, 0.2);
              color: #ef4444;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 4px;
            ">
              is_game_over: TRUE
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.45;">
            Spieler: <strong style="color: #f8fafc;">${p.name}</strong><br>
            Der Administrator kann deinen Crawler in Supabase kostenlos retten, indem <code>is_game_over</code> in der Tabelle <code>leaderboard</code> auf <code>false</code> gesetzt wird.
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btn-check-db-rescue" class="btn-action" style="
            height: 44px;
            width: 100%;
            font-size: 12.5px;
            font-weight: 800;
            justify-content: center;
            gap: 8px;
            border-radius: 10px;
            background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
          ">
            ${icon('refresh-cw', '', 15)}
            <span>STATUS PRÜFEN & CRAWLER RETTEN</span>
          </button>

          <div id="gameover-status-msg" style="font-size: 11px; color: #94a3b8; min-height: 16px;">
            Prüft automatisch alle 5 Sekunden auf Admin-Rettung...
          </div>
        </div>
      </div>
    `;

    refreshIcons(this.modalEl);

    // DB-Check Handler
    const btnCheck = this.modalEl.querySelector('#btn-check-db-rescue');
    const msgEl = this.modalEl.querySelector('#gameover-status-msg');
    const badgeEl = this.modalEl.querySelector('#gameover-db-badge');

    const runCheck = async () => {
      if (msgEl) msgEl.textContent = 'Prüfe Supabase Datenbank...';
      const isStillGameOver = await LeaderboardService.checkGameOver(p.name);
      
      if (isStillGameOver === false) {
        if (badgeEl) {
          badgeEl.textContent = 'is_game_over: FALSE';
          badgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
          badgeEl.style.color = '#34d399';
        }
        if (msgEl) {
          msgEl.innerHTML = '<span style="color: #34d399; font-weight: 800;">🎉 Rettung bestätigt! Crawler wird geborgen...</span>';
        }
        soundFx.playUpgrade?.();
        p.isGameOver = false;
        SaveSystem.save(this.scene);
        
        setTimeout(() => {
          p.teleportToSurface('Vom Administrator gerettet! Willkommen zurück an der Oberfläche.');
          this.close();
        }, 1200);
      } else {
        if (msgEl) {
          msgEl.textContent = 'Noch nicht freigeschaltet (is_game_over ist noch TRUE).';
        }
      }
    };

    if (btnCheck) {
      btnCheck.onclick = () => runCheck();
    }

    // Auto-Poll alle 5 Sekunden
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (this.isOpen && p.isGameOver) {
        runCheck();
      }
    }, 5000);
  }
}
