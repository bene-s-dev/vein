import Phaser from 'phaser';
import { AssetLoader } from '../assets/AssetLoader.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Prozedurale Texturen sofort erzeugen
    AssetLoader.generateTextures(this);
  }

  create() {
    this.scene.start('MiningScene');
  }
}
