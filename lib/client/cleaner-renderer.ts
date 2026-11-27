import * as THREE from "three";
import { createCleanerModel } from "./cleaner-model";

export type CleanerRenderer = ReturnType<typeof createCleanerRenderer>;

/** Lazy-loaded WebGL2 renderer. One shadow light, capped resolution and 30fps. */
export function createCleanerRenderer(
  canvas: HTMLCanvasElement,
  variant: "companion" | "loading",
  options: { stationary?: boolean; context?: WebGL2RenderingContext } = {},
) {
  const context =
    options.context ??
    canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  if (!context) throw new Error("WebGL2 is unavailable");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      matchMedia("(max-width: 600px)").matches ? 1.25 : 1.75,
    ),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.5, 2.5, 1.5, -1.5, 0.1, 30);
  camera.position.set(0, variant === "loading" ? 3.35 : 3.6, 7);
  camera.lookAt(0, variant === "loading" ? 1 : 1.25, 0);
  scene.add(new THREE.HemisphereLight(0xfff4df, 0xb4a298, 2.1));
  const key = new THREE.DirectionalLight(0xffe5c5, 3.3);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -5,
    right: 5,
    top: 4,
    bottom: -4,
    near: 0.1,
    far: 15,
  });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0002;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(3, 3, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xf2d5c6, 0.7);
  fill.position.set(2, 1, 5);
  scene.add(fill);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.ShadowMaterial({ color: 0x6b4935, opacity: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.006;
  floor.receiveShadow = true;
  scene.add(floor);
  const model = createCleanerModel();
  scene.add(model.root);
  let width = 1,
    height = 1,
    active = false,
    disposed = false;
  let elapsed = 0,
    lastFrame = 0,
    raf = 0,
    frames = 0;
  canvas.dataset.animating = "false";
  const smooth = (t: number) => t * t * (3 - 2 * t);
  function pose(time: number) {
    let walk = 0;
    const range = Math.max(0, (1.5 * width) / height - 0.85);
    const phase = time % 24;
    if (variant === "companion") {
      if (phase < 10) {
        model.root.position.x = THREE.MathUtils.lerp(
          -range,
          range,
          smooth(phase / 10),
        );
        model.root.rotation.y = 1.05;
        walk = Math.sin((phase / 10) * Math.PI);
      } else if (phase < 12) {
        model.root.position.x = range;
        model.root.rotation.y = THREE.MathUtils.lerp(
          1.05,
          -1.05,
          smooth((phase - 10) / 2),
        );
      } else if (phase < 22) {
        model.root.position.x = THREE.MathUtils.lerp(
          range,
          -range,
          smooth((phase - 12) / 10),
        );
        model.root.rotation.y = -1.05;
        walk = Math.sin(((phase - 12) / 10) * Math.PI);
      } else {
        model.root.position.x = -range;
        model.root.rotation.y = THREE.MathUtils.lerp(
          -1.05,
          1.05,
          smooth((phase - 22) / 2),
        );
      }
    } else {
      model.root.position.x = -0.08;
      model.root.rotation.y =
        -0.35 + Math.sin((time * Math.PI * 2) / 2.4) * 0.035;
    }
    if (options.stationary) model.root.position.x = -0.1;
    model.update(time, walk);
  }
  function draw() {
    if (disposed) return;
    pose(elapsed);
    renderer.render(scene, camera);
    canvas.dataset.frame = String(++frames);
  }
  function tick(now: number) {
    if (!active || disposed) return;
    raf = requestAnimationFrame(tick);
    if (now - lastFrame < 1000 / 30) return;
    elapsed += Math.min((now - lastFrame) / 1000, 0.08);
    lastFrame = now;
    draw();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const viewHeight = 3;
    camera.left = (-viewHeight * width) / height / 2;
    camera.right = -camera.left;
    camera.top = viewHeight / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    renderAt(time: number) {
      elapsed = time;
      draw();
    },
    setActive(value: boolean) {
      if (active === value || disposed) return;
      active = value;
      canvas.dataset.animating = String(active);
      if (active) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(tick);
      } else cancelAnimationFrame(raf);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          for (const mat of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(mat);
          if (object instanceof THREE.InstancedMesh) object.dispose();
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      key.shadow.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      scene.clear();
    },
  };
}
