import { STLLoader } from 'three-stdlib';
import { SceneSetup } from './scene.interface';
import * as THREE from 'three';

//allocates 3D
export function createRenderer(container: HTMLElement): SceneSetup {
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  return { renderer, scene, camera };
}

export function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x9dd3ff,
    metalness: 0.3,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
}

export function parseSTLBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  geometry.computeVertexNormals();
  geometry.center();
  return geometry;
}

export function createMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(geometry, material);
}

export function calculateBoundingBox(mesh: THREE.Mesh): { size: number; center: THREE.Vector3 } {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());
  return { size, center };
}
