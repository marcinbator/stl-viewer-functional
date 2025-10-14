import * as THREE from 'three';

export interface RotationState {
  isDown: boolean;
  startX: number;
  startY: number;
  rotX: number;
  rotY: number;
}

export interface SceneSetup {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}
