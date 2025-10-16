import { Injectable } from '@angular/core';
import { TaskEither, tryCatch } from 'fp-ts/TaskEither';
import * as THREE from 'three';
import { RotationState } from './scene.interface';
import * as Pure from './scene.pure';
import * as Effects from './scene.effects';

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
        const { renderer, scene, camera } = Effects.createRenderer(container);

        Effects.createLights(scene);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const rotationHandlers = this.createRotationHandlers(rotationState);
        const geometry = Effects.parseSTLBuffer(buffer);
        const material = Pure.createMaterial();
        const mesh = Pure.createMesh(geometry, material);

        scene.add(mesh);

        const { size, center } = Pure.calculateBoundingBoxFromMesh(mesh);
        const camCfg = Pure.computeCameraConfig(size, center);
        camera.near = camCfg.near;
        camera.far = camCfg.far;
        camera.updateProjectionMatrix();
        camera.position.copy(camCfg.position);
        camera.lookAt(center);

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
      const { dx, dy, newStartX, newStartY } = Pure.computeRotationDelta(
        state.startX,
        state.startY,
        ev.clientX,
        ev.clientY
      );
      state.rotY += dx;
      state.rotX += dy;
      state.startX = newStartX;
      state.startY = newStartY;
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
      const newPos = Pure.computeZoomedPosition(camera.position, center, ev.deltaY, modelSize);
      camera.position.copy(newPos);
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
