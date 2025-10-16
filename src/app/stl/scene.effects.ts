import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { computeDefaultCameraParams } from './scene.pure';

export function createRenderer(container: HTMLElement): {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
} {
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);
  const params = computeDefaultCameraParams(width, height);
  const camera = new THREE.PerspectiveCamera(params.fov, params.aspect, params.near, params.far);
  camera.position.copy(params.position);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  return { renderer, scene, camera };
}

export function createLights(scene: THREE.Scene): void {
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(0, 0, 1);
  scene.add(dir);
  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);
}

export function parseSTLBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  geometry.computeVertexNormals();
  geometry.center();
  return geometry;
}
