import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);
const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Original Rose character, modelled in real geometry. No model or texture downloads. */
export function createCleanerModel() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const material = (color: string, roughness = 0.78, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const skin = material("#c58b66", 0.66);
  const uniform = material("#995b48");
  const apron = material("#e8d7b9", 0.95);
  const seam = material("#c3a982");
  const trousers = material("#5b5851", 0.92);
  const shoes = material("#44322b", 0.48);
  const sole = material("#bba38b", 0.8);
  const hair = material("#39271f", 0.62);
  const gold = material("#c8a36c", 0.36, 0.45);
  const wood = material("#a7764f", 0.72);
  const straw = material("#d4af6e", 0.96);
  const eyeWhite = material("#f9ecdc", 0.4);
  const iris = material("#30271f", 0.3);
  const lip = material("#935742", 0.7);
  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    parent = body,
  ) {
    const object = new THREE.Mesh(geometry, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function ellipsoid(
    mat: THREE.Material,
    position: number[],
    scale: number[],
    parent = body,
  ) {
    const object = mesh(sphere, mat, parent);
    object.position.set(position[0], position[1], position[2]);
    object.scale.set(scale[0], scale[1], scale[2]);
    return object;
  }
  function tube(
    points: number[][],
    radius: number,
    mat: THREE.Material,
    parent = body,
  ) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => point(p[0], p[1], p[2]))),
        20,
        radius,
        6,
        false,
      ),
      mat,
      parent,
    );
  }
  function segment(mat: THREE.Material, radius: number, parent = root) {
    const shaft = mesh(cylinder, mat, parent);
    shaft.scale.set(radius, 1, radius);
    return shaft;
  }
  function placeSegment(
    object: THREE.Mesh,
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
  ) {
    const direction = b.clone().sub(a);
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
    object.scale.set(radius, direction.length(), radius);
  }

  // The fitted work shirt, with a soft shoulder line and an actual curved cloth apron.
  const torso = mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.18, 0.96),
        new THREE.Vector2(0.215, 1.02),
        new THREE.Vector2(0.175, 1.2),
        new THREE.Vector2(0.215, 1.39),
        new THREE.Vector2(0.245, 1.49),
        new THREE.Vector2(0.18, 1.57),
        new THREE.Vector2(0.075, 1.61),
      ],
      28,
    ),
    uniform,
  );
  torso.scale.z = 0.64;
  ellipsoid(uniform, [0, 1.03, 0], [0.22, 0.16, 0.14]);
  ellipsoid(skin, [0, 1.64, 0.005], [0.076, 0.12, 0.077]);
  const cloth = new THREE.PlaneGeometry(0.48, 0.67, 14, 18);
  const positions = cloth.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const progress = (y + 0.335) / 0.67;
    const x = positions.getX(i) * (1 - 0.32 * progress);
    positions.setXYZ(
      i,
      x,
      y + 1.165,
      0.137 +
        0.03 * Math.cos(x * 10) +
        0.008 * Math.sin(x * 55) * (1 - progress),
    );
  }
  cloth.computeVertexNormals();
  const clothMaterial = apron.clone();
  clothMaterial.side = THREE.DoubleSide;
  mesh(cloth, clothMaterial);
  tube(
    [
      [-0.14, 1.49, 0.15],
      [-0.15, 1.6, 0.06],
      [-0.12, 1.56, -0.11],
    ],
    0.022,
    apron,
  );
  tube(
    [
      [0.14, 1.49, 0.15],
      [0.15, 1.6, 0.06],
      [0.12, 1.56, -0.11],
    ],
    0.022,
    apron,
  );
  tube(
    [
      [-0.2, 0.84, 0.15],
      [0, 0.82, 0.177],
      [0.2, 0.84, 0.15],
    ],
    0.006,
    seam,
  );
  const pocket = ellipsoid(seam, [0, 1.105, 0.174], [0.115, 0.095, 0.017]);
  pocket.scale.y = 0.08;
  tube(
    [
      [-0.105, 1.175, 0.18],
      [0, 1.165, 0.192],
      [0.105, 1.175, 0.18],
    ],
    0.006,
    apron,
  );
  tube(
    [
      [-0.18, 1.25, 0.11],
      [-0.22, 1.25, 0],
      [-0.17, 1.25, -0.12],
    ],
    0.014,
    apron,
  );
  tube(
    [
      [0.18, 1.25, 0.11],
      [0.22, 1.25, 0],
      [0.17, 1.25, -0.12],
    ],
    0.014,
    apron,
  );

  const head = new THREE.Group();
  head.position.set(0, 1.84, 0.01);
  body.add(head);
  ellipsoid(skin, [0, 0.025, 0], [0.177, 0.222, 0.16], head);
  ellipsoid(skin, [0, -0.065, 0.045], [0.135, 0.125, 0.13], head);
  for (const side of [-1, 1]) {
    ellipsoid(skin, [side * 0.175, 0.005, -0.01], [0.031, 0.047, 0.025], head);
    ellipsoid(gold, [side * 0.178, -0.025, 0.005], [0.012, 0.012, 0.012], head);
    const eye = ellipsoid(
      eyeWhite,
      [side * 0.066, 0.045, 0.144],
      [0.032, 0.018, 0.019],
      head,
    );
    eye.castShadow = false;
    ellipsoid(
      iris,
      [side * 0.065, 0.045, 0.161],
      [0.011, 0.012, 0.006],
      head,
    ).castShadow = false;
    ellipsoid(
      eyeWhite,
      [side * 0.062 - 0.003, 0.049, 0.167],
      [0.0035, 0.0035, 0.002],
      head,
    ).castShadow = false;
    tube(
      [
        [side * 0.034, 0.075, 0.148],
        [side * 0.065, 0.085, 0.151],
        [side * 0.096, 0.076, 0.132],
      ],
      0.007,
      hair,
      head,
    );
    tube(
      [
        [side * 0.036, 0.054, 0.15],
        [side * 0.065, 0.062, 0.161],
        [side * 0.095, 0.053, 0.143],
      ],
      0.0035,
      hair,
      head,
    );
  }
  ellipsoid(skin, [0, 0.004, 0.158], [0.023, 0.037, 0.036], head);
  tube(
    [
      [-0.035, -0.062, 0.147],
      [0, -0.07, 0.157],
      [0.035, -0.06, 0.147],
    ],
    0.005,
    lip,
    head,
  );
  const cap = mesh(
    new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.38),
    hair,
    head,
  );
  cap.position.set(0, 0.04, -0.015);
  cap.scale.set(0.187, 0.228, 0.177);
  const backHair = mesh(
    new THREE.SphereGeometry(1, 24, 16, Math.PI, Math.PI, 0, Math.PI * 0.85),
    hair,
    head,
  );
  backHair.position.set(0, 0.04, -0.015);
  backHair.scale.set(0.187, 0.228, 0.177);
  ellipsoid(hair, [0, 0.12, -0.165], [0.115, 0.105, 0.095], head);
  ellipsoid(hair, [-0.025, 0.16, -0.2], [0.083, 0.08, 0.065], head);
  tube(
    [
      [-0.17, 0.125, 0.035],
      [-0.11, 0.16, 0.134],
      [0.015, 0.19, 0.145],
      [0.14, 0.15, 0.07],
    ],
    0.029,
    hair,
    head,
  );
  tube(
    [
      [-0.175, 0.135, 0.015],
      [-0.1, 0.218, 0.06],
      [0, 0.241, 0.065],
      [0.12, 0.208, 0.045],
      [0.18, 0.125, -0.005],
    ],
    0.012,
    apron,
    head,
  );

  // Two-bone limbs keep wrists on the handle and feet in contact with the floor.
  function limb(mat: THREE.Material, upperRadius: number, lowerRadius: number) {
    return {
      upper: segment(mat, upperRadius),
      lower: segment(mat, lowerRadius),
      joint: ellipsoid(
        mat,
        [0, 0, 0],
        [lowerRadius, lowerRadius, lowerRadius],
        root,
      ),
      upperRadius,
      lowerRadius,
    };
  }
  const legs = [-1, 1].map((side) => {
    const parts = limb(trousers, 0.083, 0.065);
    const foot = new THREE.Group();
    root.add(foot);
    ellipsoid(sole, [0, 0.026, 0.048], [0.091, 0.026, 0.175], foot);
    ellipsoid(shoes, [0, 0.075, 0.04], [0.087, 0.065, 0.16], foot);
    ellipsoid(shoes, [0, 0.13, -0.02], [0.065, 0.07, 0.075], foot);
    for (let i = 0; i < 3; i++)
      tube(
        [
          [-0.035, 0.13 - i * 0.009, 0.06 + i * 0.025],
          [0, 0.141 - i * 0.009, 0.07 + i * 0.025],
          [0.035, 0.13 - i * 0.009, 0.06 + i * 0.025],
        ],
        0.003,
        sole,
        foot,
      );
    return { ...parts, side, foot };
  });
  const arms = [-1, 1].map((side) => {
    const parts = limb(skin, 0.059, 0.045);
    parts.upper.material = uniform;
    const sleeve = ellipsoid(uniform, [0, 0, 0], [0.078, 0.09, 0.078], root);
    const hand = new THREE.Group();
    root.add(hand);
    ellipsoid(skin, [0, 0, 0.015], [0.043, 0.057, 0.027], hand);
    for (let i = 0; i < 4; i++) {
      tube(
        [
          [-0.028 + i * 0.018, 0.025, 0.028],
          [-0.028 + i * 0.018, 0.017, 0.061],
          [-0.028 + i * 0.018, -0.015, 0.063],
          [-0.028 + i * 0.018, -0.027, 0.041],
        ],
        0.008,
        skin,
        hand,
      );
    }
    tube(
      [
        [0.039, 0.022, 0.01],
        [0.057, -0.005, 0.033],
        [0.029, -0.027, 0.045],
      ],
      0.011,
      skin,
      hand,
    );
    return { ...parts, side, sleeve, hand };
  });
  function jointPosition(
    start: THREE.Vector3,
    end: THREE.Vector3,
    upper: number,
    lower: number,
    pole: THREE.Vector3,
  ) {
    const direction = end.clone().sub(start);
    const distance = THREE.MathUtils.clamp(
      direction.length(),
      0.001,
      upper + lower - 0.001,
    );
    direction.normalize();
    const along =
      (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, upper * upper - along * along));
    const bend = pole
      .clone()
      .addScaledVector(direction, -pole.dot(direction))
      .normalize();
    return start
      .clone()
      .addScaledVector(direction, along)
      .addScaledVector(bend, height);
  }
  const handle = segment(wood, 0.016);
  const brush = new THREE.Group();
  root.add(brush);
  const brushTop = mesh(
    new THREE.CylinderGeometry(0.06, 0.105, 0.12, 18),
    wood,
    brush,
  );
  brushTop.position.y = 0.15;
  brushTop.scale.z = 0.6;
  const bristleGeometry = new THREE.CylinderGeometry(0.008, 0.012, 0.16, 5);
  const bristles = new THREE.InstancedMesh(bristleGeometry, straw, 45);
  bristles.castShadow = true;
  bristles.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 45; i++) {
    const row = Math.floor(i / 15),
      x = ((i % 15) - 7) / 7;
    dummy.position.set(x * 0.12, 0.078, (row - 1) * 0.035);
    dummy.rotation.z = -x * 0.18;
    dummy.updateMatrix();
    bristles.setMatrixAt(i, dummy.matrix);
  }
  brush.add(bristles);
  tube(
    [
      [-0.11, 0.125, 0.045],
      [0, 0.126, 0.055],
      [0.11, 0.125, 0.045],
    ],
    0.012,
    uniform,
    brush,
  );

  const dustMaterial = new THREE.MeshStandardMaterial({
    color: "#b99e80",
    transparent: true,
    opacity: 0.55,
    roughness: 1,
  });
  const dust = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.016, 0),
    dustMaterial,
    9,
  );
  root.add(dust);
  const sparkleMaterial = new THREE.MeshBasicMaterial({
    color: "#d1ad72",
    transparent: true,
  });
  const sparkles = [-1, 1].map((side) => {
    const group = new THREE.Group();
    root.add(group);
    const a = mesh(new THREE.OctahedronGeometry(0.035), sparkleMaterial, group);
    a.scale.set(0.27, 1.5, 0.27);
    const b = mesh(new THREE.OctahedronGeometry(0.035), sparkleMaterial, group);
    b.scale.set(1, 0.25, 0.25);
    group.position.set(-0.2 + side * 0.07, 0.1, 0.24);
    return group;
  });

  function update(time: number, walking: number) {
    const gait = (time * Math.PI * 2) / 1.2;
    const sweep = Math.sin((time * Math.PI * 2) / 2.4);
    const bob = Math.cos(gait * 2) * 0.009 * walking;
    body.position.y = bob;
    body.rotation.z = Math.sin(gait) * 0.012 * walking;
    head.rotation.x = 0.045 + sweep * 0.025;
    head.rotation.y = 0.08 + sweep * 0.025;
    const bottom = point(
      0.43 + sweep * 0.14,
      0.015,
      0.43 + Math.cos(time * 2.618) * 0.035,
    );
    const top = point(0.11 + sweep * 0.055, 1.56 + bob, 0.26);
    placeSegment(handle, bottom.clone().add(point(0, 0.18, 0)), top, 0.016);
    brush.position.copy(bottom);
    brush.rotation.y = -0.18 + sweep * 0.12;
    brush.rotation.z = sweep * 0.025;
    for (const arm of arms) {
      const shoulder = point(arm.side * 0.235, 1.49 + bob, 0.005);
      const grip = bottom.clone().lerp(top, arm.side < 0 ? 0.85 : 0.68);
      const elbow = jointPosition(
        shoulder,
        grip,
        0.27,
        0.265,
        point(arm.side * 0.45, -0.5, 0.6),
      );
      placeSegment(arm.upper, shoulder, elbow, 0.065);
      placeSegment(arm.lower, elbow, grip, 0.044);
      arm.sleeve.position.copy(shoulder);
      arm.joint.position.copy(elbow);
      arm.hand.position.copy(grip);
      arm.hand.quaternion.setFromUnitVectors(
        UP,
        top.clone().sub(bottom).normalize(),
      );
      arm.hand.rotation.y += arm.side < 0 ? -0.7 : 0.7;
    }
    for (const leg of legs) {
      const phase = gait + (leg.side < 0 ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(phase)) * 0.075 * walking;
      const stride = Math.cos(phase) * 0.16 * walking;
      const hip = point(leg.side * 0.125, 0.98 + bob, 0);
      const ankle = point(leg.side * 0.14, 0.135 + lift, stride);
      const knee = jointPosition(hip, ankle, 0.45, 0.435, point(0, 0, 1));
      placeSegment(leg.upper, hip, knee, 0.084);
      placeSegment(leg.lower, knee, ankle, 0.061);
      leg.joint.position.copy(knee);
      leg.foot.position.set(ankle.x, lift, ankle.z);
      leg.foot.rotation.x = -lift * 1.5;
    }
    const cycle = (time % 2.4) / 2.4;
    dustMaterial.opacity = 0.45 * Math.max(0, 1 - cycle * 1.8);
    for (let i = 0; i < 9; i++) {
      dummy.position.set(
        bottom.x + Math.sin(i * 7) * 0.14 - cycle * 0.11,
        0.025 + Math.sin(i * 3) ** 2 * cycle * 0.1,
        bottom.z + Math.cos(i * 5) * 0.09,
      );
      dummy.scale.setScalar(Math.max(0.15, 1 - cycle));
      dummy.rotation.set(i, cycle * 2, 0);
      dummy.updateMatrix();
      dust.setMatrixAt(i, dummy.matrix);
    }
    dust.instanceMatrix.needsUpdate = true;
    sparkleMaterial.opacity =
      Math.max(0, Math.sin(cycle * Math.PI * 2 - 1.2)) * 0.7;
    sparkles.forEach((sparkle, i) => {
      sparkle.scale.setScalar(0.7 + 0.3 * Math.sin(time * 2.6 + i));
      sparkle.rotation.y = time * 0.6;
    });
  }
  update(0, 0);
  return { root, update };
}
