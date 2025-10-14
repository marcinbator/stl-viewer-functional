import { Injectable } from '@angular/core';
import { TaskEither, tryCatch } from 'fp-ts/TaskEither';
import * as THREE from 'three';
import { RotationState } from './scene.interface';
import * as Pure from './scene.pure';

@Injectable()
export class StlLoaderService {
  public loadFile(file: File, container: HTMLElement): TaskEither<Error, () => void> {
    return tryCatch(
      async () => {
        const rotationState: RotationState = {
          isDown: false,
          startX: 0,
          startY: 0,
          rotX: 0,
          rotY: 0,
        };

        const buffer = await file.arrayBuffer();
        const { renderer, scene, camera } = Pure.createRenderer(container);

        this.createLights(scene);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const rotationHandlers = this.createRotationHandlers(rotationState);
        const geometry = Pure.parseSTLBuffer(buffer);
        const material = Pure.createMaterial();
        const mesh = Pure.createMesh(geometry, material);

        scene.add(mesh);

        const { size, center } = Pure.calculateBoundingBox(mesh);
        this.adjustCamera(camera, size, center);

        const onWheel = this.createZoomHandler(camera, center, size);
        const handlers = { ...rotationHandlers, onWheel };

        this.attachEventListeners(container, handlers);

        const rafId = this.startAnimation(mesh, renderer, scene, camera, rotationState);

        return this.createCleanupFunction(rafId, container, renderer, geometry, material, handlers);
      },
      (reason) => new Error(String(reason))
    );
  }

  //

  private createLights = (scene: THREE.Scene): void => {
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(0, 0, 1);
    scene.add(dir);
    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);
  };

  private adjustCamera = (
    camera: THREE.PerspectiveCamera,
    size: number,
    center: THREE.Vector3
  ): void => {
    camera.near = Math.max(0.1, size / 1000);
    camera.far = size * 10;
    camera.updateProjectionMatrix();
    camera.position.copy(center);
    camera.position.x += size / 2.0;
    camera.position.y += size / 5.0;
    camera.position.z += size / 2.0;
    camera.lookAt(center);
  };

  private createRotationHandlers = (
    state: RotationState
  ): {
    onPointerDown: (ev: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerMove: (ev: PointerEvent) => void;
  } => {
    const onPointerDown = (ev: PointerEvent) => {
      state.isDown = true;
      state.startX = ev.clientX;
      state.startY = ev.clientY;
    };

    const onPointerUp = () => {
      state.isDown = false;
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!state.isDown) return;
      const dx = (ev.clientX - state.startX) * 0.005;
      const dy = (ev.clientY - state.startY) * 0.005;
      state.rotY += dx;
      state.rotX += dy;

      state.startX = ev.clientX;
      state.startY = ev.clientY;
    };

    return { onPointerDown, onPointerUp, onPointerMove };
  };

  private createZoomHandler = (
    camera: THREE.PerspectiveCamera,
    center: THREE.Vector3,
    modelSize: number
  ) => {
    return (ev: WheelEvent) => {
      ev.preventDefault();

      const currentDistance = camera.position.distanceTo(center);

      const zoomSpeed = modelSize * 0.001;
      const delta = ev.deltaY * zoomSpeed;

      const minDistance = modelSize * 0.5;
      const maxDistance = modelSize * 10;

      const newDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance + delta));

      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, center).normalize();
      camera.position.copy(center).addScaledVector(direction, newDistance);
    };
  };

  private attachEventListeners = (
    container: HTMLElement,
    handlers: {
      onPointerDown: (ev: PointerEvent) => void;
      onPointerUp: () => void;
      onPointerMove: (ev: PointerEvent) => void;
      onWheel: (ev: WheelEvent) => void;
    }
  ): void => {
    container.addEventListener('pointerdown', handlers.onPointerDown);
    window.addEventListener('pointerup', handlers.onPointerUp);
    window.addEventListener('pointermove', handlers.onPointerMove);
    container.addEventListener('wheel', handlers.onWheel);
  };

  private detachEventListeners = (
    container: HTMLElement,
    handlers: {
      onPointerDown: (ev: PointerEvent) => void;
      onPointerUp: () => void;
      onPointerMove: (ev: PointerEvent) => void;
      onWheel: (ev: WheelEvent) => void;
    }
  ): void => {
    container.removeEventListener('pointerdown', handlers.onPointerDown);
    window.removeEventListener('pointerup', handlers.onPointerUp);
    window.removeEventListener('pointermove', handlers.onPointerMove);
    container.removeEventListener('wheel', handlers.onWheel);
  };

  private startAnimation = (
    mesh: THREE.Mesh,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    state: RotationState
  ): number => {
    let rafId: number;
    const animate = () => {
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = state.rotY;
      mesh.rotation.x = state.rotX;
      mesh.rotation.z = 0;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return rafId!;
  };

  private createCleanupFunction = (
    rafId: number,
    container: HTMLElement,
    renderer: THREE.WebGLRenderer,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    handlers: {
      onPointerDown: (ev: PointerEvent) => void;
      onPointerUp: () => void;
      onPointerMove: (ev: PointerEvent) => void;
      onWheel: (ev: WheelEvent) => void;
    }
  ): (() => void) => {
    return () => {
      cancelAnimationFrame(rafId);
      container.removeChild(renderer.domElement);
      this.detachEventListeners(container, handlers);
      geometry.dispose();
      (material as any).dispose?.();
      renderer.dispose();
    };
  };
}
