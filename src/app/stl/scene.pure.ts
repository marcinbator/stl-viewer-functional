import * as THREE from 'three';

export function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x9dd3ff,
    metalness: 0.3,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
}

export function createMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(geometry, material);
}

export function calculateBoundingBoxFromMesh(mesh: THREE.Mesh): {
  size: number;
  center: THREE.Vector3;
} {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());
  return { size, center };
}

export function computeCameraConfig(
  size: number,
  center: THREE.Vector3
): { near: number; far: number; position: THREE.Vector3 } {
  const near = Math.max(0.1, size / 1000);
  const far = size * 10;
  const position = new THREE.Vector3().copy(center);
  position.x += size / 2.0;
  position.y += size / 5.0;
  position.z += size / 2.0;
  return { near, far, position };
}

export function computeZoomedPosition(
  cameraPos: THREE.Vector3,
  center: THREE.Vector3,
  deltaY: number,
  modelSize: number
): THREE.Vector3 {
  const currentDistance = cameraPos.distanceTo(center);
  const zoomSpeed = modelSize * 0.001;
  const delta = deltaY * zoomSpeed;

  const minDistance = modelSize * 0.5;
  const maxDistance = modelSize * 10;

  const newDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance + delta));

  const direction = new THREE.Vector3();
  direction.subVectors(cameraPos, center).normalize();
  return new THREE.Vector3().copy(center).addScaledVector(direction, newDistance);
}

export function computeRotationDelta(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  sensitivity = 0.005
): { dx: number; dy: number; newStartX: number; newStartY: number } {
  const dx = (clientX - startX) * sensitivity;
  const dy = (clientY - startY) * sensitivity;
  return { dx, dy, newStartX: clientX, newStartY: clientY };
}

export function computeDefaultCameraParams(
  width: number,
  height: number
): {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  position: THREE.Vector3;
} {
  const fov = 45;
  const aspect = width / height;
  const near = 0.1;
  const far = 1000;
  const position = new THREE.Vector3(0, 0, 100);
  return { fov, aspect, near, far, position };
}
