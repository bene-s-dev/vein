import Phaser from 'phaser';
import { SPRITE_KEYS } from '../assets/spriteManifest.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Lade-Fortschrittsbalken
    const { width, height } = this.scale;
    const barW = Math.min(400, width * 0.6);
    const barH = 8;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 20;

    const bg = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x1e293b);
    const fill = this.add.rectangle(barX, barY, 0, barH, 0x38bdf8).setOrigin(0, 0);
    const label = this.add.text(width / 2, height / 2 - 10, 'Lade Sprites…', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      fill.width = barW * value;
    });

    this.load.on('fileprogress', (file) => {
      label.setText(`Lade: ${file.key}`);
    });

    // Alle Sprites als WebP aus public/assets/sprites/ laden
    for (const key of SPRITE_KEYS) {
      this.load.image(key, `/assets/sprites/${key}.webp`);
    }
  }

  create() {
    this.scene.start('MiningScene');
  }
}
