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
    const currentY = p.sprite ? p.sprite.y : (p.gy * 32 + 16);
    const isAtSurface = p.gy < 0 || currentY <= -8;
    const depth = isAtSurface ? 0 : Math.max(0, Math.floor(p.depthMeters || p.gy || 0));
    const layer = this.getCurrentLayer(depth);
    const isFirstRescue = !p.firstRescueUsed;
    const hasValidInsurance = this.checkInsuranceValid(depth) || isAtSurface;
    const canUseCanister = (p.gadgets?.fuel_canister || 0) > 0;
    const titleText = (p.fuel <= 0.05) ? 'Treibstoff leer' : 'Grubenwehr-Rettung';
    const locText = isAtSurface ? 'Erdoberfläche (Basis-Gelände)' : `${depth} m Tiefe (${layer.name})`;

    // ── FALL 1: ERSTE RETTUNG KOSTENLOS ──────────────────────────────────────
    if (isFirstRescue) {
      this.modalEl.innerHTML = `
        <div class="emergency-rescue-window" style="
          background: #0f172a;
          border: 1px solid rgba(239, 68, 68, 0.35);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
          border-radius: 16px;
          max-width: 380px;
          width: 92%;
          padding: 20px;
          box-sizing: border-box;
          color: #f8fafc;
          text-align: center;
        ">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            ${icon('fuel', '', 22)}
          </div>

          <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: #ffffff;">
            ${titleText}
          </h2>
          <div style="font-size: 12.5px; color: #94a3b8; margin-bottom: 12px;">
            ${locText}
          </div>

          <div style="
            display: inline-block;
            background: rgba(56, 189, 248, 0.08);
            border: 1px solid rgba(56, 189, 248, 0.2);
            color: #38bdf8;
            font-size: 11.5px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 12px;
          ">
            Kostenlose Erstbergung verfügbar
          </div>

          <!-- Einsatzbefehl & Versicherungshinweis -->
          <div style="
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 15px;
            text-align: left;
            font-size: 11px;
            line-height: 1.4;
            color: #cbd5e1;
          ">
            <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 7px;">
              <div style="color: #38bdf8; flex-shrink: 0; margin-top: 1px;">
                ${icon('radio', '', 14)}
              </div>
              <div>
                <strong style="color: #f8fafc;">Einsatzbefehl der Grubenwehr:</strong><br>
                Bergefahrzeug rückt aus, schleppt dein Fahrzeug an die Oberfläche und betankt es mit Notreserve.
              </div>
            </div>

            <div style="
              background: rgba(245, 158, 11, 0.1);
              border: 1px solid rgba(245, 158, 11, 0.25);
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 10.5px;
              color: #fde68a;
              display: flex;
              gap: 6px;
              align-items: flex-start;
            ">
              <span style="color: #fbbf24; flex-shrink: 0; margin-top: 1px;">${icon('shield-alert', '', 13)}</span>
              <span>
                <strong>Versicherung:</strong> Dies ist deine einmalige Kulanz-Bergung. Für künftige Fahrten musst du im Büro (Tab „Versicherung“) eine Police abschließen.
              </span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-rescue-free" class="btn-3d-danger" style="
              height: 42px;
              width: 100%;
              font-size: 13px;
              font-weight: 800;
              justify-content: center;
              gap: 8px;
              border-radius: 10px;
              border: none;
              background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
              box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
              cursor: pointer;
            ">
              ${icon('truck', '', 15)}
              <span>Fahrzeug bergen</span>
            </button>

            ${canUseCanister ? `
              <button id="btn-rescue-use-fuel" class="btn-action" style="
                height: 38px;
                width: 100%;
                font-size: 12px;
                font-weight: 700;
                justify-content: center;
                gap: 6px;
                border-radius: 10px;
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #38bdf8;
                cursor: pointer;
              ">
                ${icon('fuel', '', 14)}
                <span>Kanister nutzen (${p.gadgets.fuel_canister}x)</span>
              </button>
            ` : ''}

            ${p.fuel > 0.05 ? `
              <button id="btn-rescue-cancel" class="btn-action" style="
                height: 34px;
                width: 100%;
                font-size: 11.5px;
                font-weight: 700;
                justify-content: center;
                border-radius: 10px;
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #94a3b8;
                cursor: pointer;
              ">
                Abbrechen
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
            this.scene.playRescueCutscene('Bergung erfolgreich');
          } else {
            p.teleportToSurface('Bergung erfolgreich');
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

      const btnCancel = this.modalEl.querySelector('#btn-rescue-cancel');
      if (btnCancel) {
        btnCancel.onclick = () => this.close();
      }
      return;
    }

    // ── FALL 2: VERSICHERUNG AKTIV ODER AN DER ERDOBERFLÄCHE ──────────────────
    if (hasValidInsurance) {
      const ins = p.activeInsurance;
      const badgeText = isAtSurface && !ins ? 'Oberflächen-Bergung' : `Versichert (${ins ? ins.layerName : 'Basis'})`;

      this.modalEl.innerHTML = `
        <div class="emergency-rescue-window" style="
          background: #0f172a;
          border: 1px solid rgba(16, 185, 129, 0.35);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
          border-radius: 16px;
          max-width: 360px;
          width: 92%;
          padding: 22px 20px;
          box-sizing: border-box;
          color: #f8fafc;
          text-align: center;
        ">
          <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #34d399; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            ${icon('shield-check', '', 22)}
          </div>

          <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #ffffff;">
            ${titleText}
          </h2>
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">
            ${locText}
          </div>

          <div style="
            display: inline-block;
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #34d399;
            font-size: 11.5px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 12px;
          ">
            ${badgeText}
          </div>

          <!-- Einsatzbefehl -->
          <div style="
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 15px;
            text-align: left;
            font-size: 11px;
            line-height: 1.4;
            color: #cbd5e1;
          ">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <div style="color: #34d399; flex-shrink: 0; margin-top: 1px;">
                ${icon('radio', '', 14)}
              </div>
              <div>
                <strong style="color: #f8fafc;">Einsatzbefehl der Grubenwehr:</strong><br>
                Bergefahrzeug rückt aus, schleppt dein Fahrzeug an die Oberfläche und betankt es mit Notreserve.
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-rescue-insured" class="btn-3d-success" style="
              height: 42px;
              width: 100%;
              font-size: 13px;
              font-weight: 800;
              justify-content: center;
              gap: 8px;
              border-radius: 10px;
              border: none;
              background: linear-gradient(180deg, #10b981 0%, #059669 100%);
              box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
              cursor: pointer;
            ">
              ${icon('truck', '', 15)}
              <span>Fahrzeug bergen</span>
            </button>

            ${canUseCanister ? `
              <button id="btn-rescue-use-fuel" class="btn-action" style="
                height: 38px;
                width: 100%;
                font-size: 12px;
                font-weight: 700;
                justify-content: center;
                gap: 6px;
                border-radius: 10px;
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #38bdf8;
                cursor: pointer;
              ">
                ${icon('fuel', '', 14)}
                <span>Kanister nutzen (${p.gadgets.fuel_canister}x)</span>
              </button>
            ` : ''}

            ${p.fuel > 0.05 ? `
              <button id="btn-rescue-cancel" class="btn-action" style="
                height: 34px;
                width: 100%;
                font-size: 11.5px;
                font-weight: 700;
                justify-content: center;
                border-radius: 10px;
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #94a3b8;
                cursor: pointer;
              ">
                Abbrechen
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
          if (p.activeInsurance) {
            p.activeInsurance = null; // Versicherung wird verbraucht
          }
          SaveSystem.save(this.scene);
          this.close();
          if (this.scene && this.scene.playRescueCutscene) {
            this.scene.playRescueCutscene('Bergung erfolgreich');
          } else {
            p.teleportToSurface('Bergung erfolgreich');
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

      const btnCancel = this.modalEl.querySelector('#btn-rescue-cancel');
      if (btnCancel) {
        btnCancel.onclick = () => this.close();
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
        background: #0f172a;
        border: 1px solid rgba(239, 68, 68, 0.35);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
        border-radius: 16px;
        max-width: 360px;
        width: 92%;
        padding: 22px 20px;
        box-sizing: border-box;
        color: #f8fafc;
        text-align: center;
      ">
        <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 22px;">
          💀
        </div>

        <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #ef4444;">
          Keine Versicherung
        </h2>
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 14px;">
          ${depth} m Tiefe (${layer.name})
        </div>

        <div style="
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
        ">
          <span style="color: #cbd5e1; font-weight: 600;">${p.name}</span>
          <span id="gameover-db-badge" style="
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 6px;
          ">
            Wartet auf Freigabe
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-check-db-rescue" class="btn-action" style="
            height: 42px;
            width: 100%;
            font-size: 13px;
            font-weight: 800;
            justify-content: center;
            gap: 7px;
            border-radius: 10px;
            background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
            border: 1px solid rgba(56, 189, 248, 0.4);
            color: #ffffff;
            cursor: pointer;
          ">
            ${icon('refresh-cw', '', 14)}
            <span>Freigabe prüfen</span>
          </button>

          <div id="gameover-status-msg" style="font-size: 11px; color: #94a3b8; min-height: 14px;"></div>
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
          msgEl.innerHTML = '<span style="color: #34d399; font-weight: 700;">Rettung freigegeben!</span>';
        }
        soundFx.playUpgrade?.();
        p.isGameOver = false;
        SaveSystem.save(this.scene);
        
        setTimeout(() => {
          this.close();
          if (this.scene && this.scene.playRescueCutscene) {
            this.scene.playRescueCutscene('Bergung erfolgreich');
          } else {
            p.teleportToSurface('Bergung erfolgreich');
          }
        }, 600);
      } else {
        if (msgEl) {
          msgEl.textContent = 'Noch nicht freigegeben.';
        }
      }
    };

    if (btnCheck) {
      btnCheck.onclick = () => runCheck();
    }
  }
}
