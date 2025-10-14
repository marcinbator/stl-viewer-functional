import { Injectable } from '@angular/core';
import { TaskEither, tryCatch } from 'fp-ts/TaskEither';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

@Injectable()
export class StlLoaderService {
  private createRenderer = (
    container: HTMLElement
  ): {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls?: any;
  } => {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    return { renderer, scene, camera };
  };

  private createLights = (scene: THREE.Scene) => {
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(0, 0, 1);
    scene.add(dir);
    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);
  };

  public loadFile(file: File, container: HTMLElement): TaskEither<Error, () => void> {
    return tryCatch(
      async () => {
        const { renderer, scene, camera } = this.createRenderer(container);
        this.createLights(scene);

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        let isDown = false;
        let startX = 0;
        let startY = 0;
        let rotX = 0;
        let rotY = 0;

        const onPointerDown = (ev: PointerEvent) => {
          isDown = true;
          startX = ev.clientX;
          startY = ev.clientY;
        };
        const onPointerUp = () => {
          isDown = false;
        };
        const onPointerMove = (ev: PointerEvent) => {
          if (!isDown) return;
          const dx = (ev.clientX - startX) * 0.001;
          const dy = (ev.clientY - startY) * 0.001;
          rotY += dx;
          rotX += dy;
        };
        const onWheel = (ev: WheelEvent) => {
          camera.position.z += ev.deltaY * 0.01;
        };

        container.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointermove', onPointerMove);
        container.addEventListener('wheel', onWheel);

        const buffer = await file.arrayBuffer();

        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
          color: 0x9dd3ff,
          metalness: 0.3,
          roughness: 0.7,
        });
        const mesh = new THREE.Mesh(geometry, material);

        geometry.center();

        scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        camera.near = Math.max(0.1, size / 1000);
        camera.far = size * 10;
        camera.updateProjectionMatrix();
        camera.position.copy(center);
        camera.position.x += size / 2.0;
        camera.position.y += size / 5.0;
        camera.position.z += size / 2.0;
        camera.lookAt(center);

        let rafId: number;
        const animate = () => {
          mesh.rotation.x = rotX;
          mesh.rotation.y = rotY;
          renderer.render(scene, camera);
          rafId = requestAnimationFrame(animate);
        };
        animate();

        const cleanup: () => void = () => {
          cancelAnimationFrame(rafId);
          container.removeChild(renderer.domElement);
          container.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointermove', onPointerMove);
          container.removeEventListener('wheel', onWheel);
          geometry.dispose();
          (material as any).dispose?.();
          renderer.dispose();
        };

        return cleanup;
      },
      (reason) => new Error(String(reason))
    );
  }
}
