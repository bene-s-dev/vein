import Phaser from 'phaser';
import { ATLAS_KEYS } from '../assets/spriteManifest.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    const barW = Math.min(400, width * 0.6);
    const barH = 8;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 20;

    this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x1e293b);
    const fill = this.add.rectangle(barX, barY, 0, barH, 0x38bdf8).setOrigin(0, 0);
    const label = this.add.text(width / 2, height / 2 - 10, 'Lade Assets…', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => { fill.width = barW * value; });
    this.load.on('fileprogress', (file) => { label.setText(`Lade: ${file.key}`); });

    // 7 Texture-Atlases laden (statt 1013 Einzelbilder)
    for (const key of ATLAS_KEYS) {
      this.load.atlas(key, `/assets/atlas/${key}.webp`, `/assets/atlas/${key}.json`);
    }
  }

  create() {
    // Kompatibilitätsschicht: Atlas-Frames als eigenständige Texture-Keys registrieren.
    // Damit funktioniert scene.add.image(x, y, 'tile_surface') weiterhin ohne Code-Änderungen.
    for (const atlasKey of ATLAS_KEYS) {
      const texture = this.textures.get(atlasKey);
      if (!texture) continue;

      const frameNames = texture.getFrameNames();
      const sourceImage = texture.source[0].image;

      for (const frameName of frameNames) {
        if (this.textures.exists(frameName)) continue;

        const frame = texture.get(frameName);
        if (!frame) continue;

        const w = frame.realWidth || frame.width || 1;
        const h = frame.realHeight || frame.height || 1;
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        cv.getContext('2d').drawImage(
          sourceImage,
          frame.cutX ?? frame.x ?? 0,
          frame.cutY ?? frame.y ?? 0,
          w, h,
          0, 0, w, h
        );
        this.textures.addCanvas(frameName, cv);
      }
    }

    this.scene.start('MiningScene');
  }
}
