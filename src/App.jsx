
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./styles.css";

export default function App() {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const [stage, setStage] = useState("idle");

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08051a");
    scene.fog = new THREE.FogExp2("#100824", 0.012);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );

    const initialCamera = new THREE.Vector3(0, 3.1, 10);
    camera.position.copy(initialCamera);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    host.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    const ambient = new THREE.HemisphereLight(
      "#b9a4ff",
      "#16091f",
      1.5
    );
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight("#ffe5b0", 2.5);
    moonLight.position.set(-5, 12, 8);
    moonLight.castShadow = true;
    scene.add(moonLight);

    const fireLight = new THREE.PointLight("#ff8c32", 0, 12);
    fireLight.position.set(0, 1.8, 2);
    scene.add(fireLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshStandardMaterial({
        color: "#100a20",
        roughness: 0.95
      })
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    // Moon
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 48, 48),
      new THREE.MeshStandardMaterial({
        color: "#fff0c9",
        emissive: "#c49a50",
        emissiveIntensity: 0.45,
        roughness: 0.85
      })
    );

    moon.position.set(7, 11, -24);
    scene.add(moon);

    const moonGlow = new THREE.PointLight("#ffdfa0", 18, 55);
    moonGlow.position.copy(moon.position);
    scene.add(moonGlow);

    // Stars
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 110;
      starPositions[i * 3 + 1] = Math.random() * 65 + 2;
      starPositions[i * 3 + 2] = -Math.random() * 65 - 10;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: "#fff3d4",
        size: 0.11,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
      })
    );

    scene.add(stars);

    // Materials
    const skin = new THREE.MeshStandardMaterial({
      color: "#b97853",
      roughness: 0.9
    });

    const darkCloth = new THREE.MeshStandardMaterial({
      color: "#20122b",
      roughness: 0.9
    });

    const roseCloth = new THREE.MeshStandardMaterial({
      color: "#672d4e",
      roughness: 0.85
    });

    const hair = new THREE.MeshStandardMaterial({
      color: "#100b13",
      roughness: 0.95
    });

    const gold = new THREE.MeshStandardMaterial({
      color: "#e7ad5c",
      metalness: 0.55,
      roughness: 0.3
    });

    // Helper for 3D characters
    function sphere(parent, material, position, scale) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 24),
        material
      );
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function capsule(parent, material, position, radius, length) {
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(radius, length, 8, 16),
        material
      );
      mesh.position.set(...position);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }

    // Couple: both characters face away from the camera
    const couple = new THREE.Group();
    scene.add(couple);
    couple.position.set(0, 0, 1.3);

    function makePerson(x, outfit, longHair = false) {
      const person = new THREE.Group();
      person.position.x = x;
      couple.add(person);

      // Legs
      capsule(person, darkCloth, [-0.19, 0.48, 0], 0.12, 0.8);
      capsule(person, darkCloth, [0.19, 0.48, 0], 0.12, 0.8);

      // Torso
      const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.34, 0.7, 8, 24),
        outfit
      );
      torso.position.y = 1.48;
      torso.scale.set(1, 1, 0.65);
      torso.castShadow = true;
      person.add(torso);

      // Neck and head
      capsule(person, skin, [0, 2.12, 0], 0.13, 0.16);
      sphere(person, skin, [0, 2.48, 0], [0.29, 0.37, 0.27]);

      // Hair covering back of head
      sphere(
        person,
        hair,
        [0, 2.57, -0.055],
        [0.31, 0.34, 0.29]
      );

      if (longHair) {
        // Flowing hair
        capsule(
          person,
          hair,
          [0, 2.19, -0.12],
          0.16,
          0.55
        );
        sphere(
          person,
          hair,
          [0, 1.94, -0.1],
          [0.2, 0.34, 0.14]
        );
      } else {
        // Short hairstyle
        sphere(
          person,
          hair,
          [0, 2.77, -0.02],
          [0.3, 0.14, 0.27]
        );
      }

      // Arms
      const leftArm = capsule(
        person,
        outfit,
        [-0.39, 1.48, 0],
        0.095,
        0.55
      );
      leftArm.rotation.z = -0.25;

      const rightArm = capsule(
        person,
        outfit,
        [0.39, 1.48, 0],
        0.095,
        0.55
      );
      rightArm.rotation.z = 0.25;

      sphere(person, skin, [-0.4, 1.08, 0.03], [0.1, 0.12, 0.1]);
      sphere(person, skin, [0.4, 1.08, 0.03], [0.1, 0.12, 0.1]);

      return person;
    }

    const boy = makePerson(-0.43, darkCloth);
    const girl = makePerson(0.43, roseCloth, true);

    // Bring them close together
    boy.rotation.z = -0.035;
    girl.rotation.z = 0.035;

    // Joined hands
    sphere(couple, skin, [0, 1.06, 1.32], [0.12, 0.08, 0.09]);

    // Matchstick
    const match = new THREE.Group();
    match.position.set(0, 0, 2.6);
    scene.add(match);

    const wood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 1.65, 16),
      new THREE.MeshStandardMaterial({
        color: "#bd8150",
        roughness: 0.8
      })
    );

    wood.position.y = 0.82;
    wood.castShadow = true;
    match.add(wood);

    const matchHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 24, 24),
      new THREE.MeshStandardMaterial({
        color: "#b51e28",
        roughness: 0.55
      })
    );

    matchHead.position.y = 1.67;
    match.add(matchHead);

    // Match flame
    const flame = new THREE.Group();
    flame.position.set(0, 1.85, 0);
    flame.visible = false;
    match.add(flame);

    const flameOuter = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.65, 24),
      new THREE.MeshBasicMaterial({
        color: "#ff8429",
        transparent: true,
        opacity: 0.9
      })
    );
    flameOuter.position.y = 0.32;
    flame.add(flameOuter);

    const flameInner = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.43, 24),
      new THREE.MeshBasicMaterial({
        color: "#fff4bd"
      })
    );
    flameInner.position.y = 0.28;
    flame.add(flameInner);

    // Slim traditional sky-rocket with a long wooden guide stick, matching the reference.
    const rocket = new THREE.Group();
    rocket.visible = false;
    scene.add(rocket);

    const rocketRed = new THREE.MeshStandardMaterial({
      color: "#d71920", roughness: 0.42, metalness: 0.08
    });
    const stickMaterial = new THREE.MeshStandardMaterial({
      color: "#c99a43", roughness: 0.78
    });
    const nozzleMaterial = new THREE.MeshStandardMaterial({
      color: "#b7a47c", metalness: 0.35, roughness: 0.55
    });

    // Red-and-white diagonal paper wrapping around a narrow cylindrical casing.
    const stripeCanvas = document.createElement("canvas");
    stripeCanvas.width = 128;
    stripeCanvas.height = 256;
    const stripeCtx = stripeCanvas.getContext("2d");
    stripeCtx.fillStyle = "#fff8ed";
    stripeCtx.fillRect(0, 0, 128, 256);
    stripeCtx.strokeStyle = "#e51d27";
    stripeCtx.lineWidth = 17;
    for (let x = -180; x < 260; x += 31) {
      stripeCtx.beginPath();
      stripeCtx.moveTo(x, 256);
      stripeCtx.lineTo(x + 256, 0);
      stripeCtx.stroke();
    }
    const stripeTexture = new THREE.CanvasTexture(stripeCanvas);
    stripeTexture.colorSpace = THREE.SRGBColorSpace;
    stripeTexture.wrapS = THREE.RepeatWrapping;
    stripeTexture.wrapT = THREE.RepeatWrapping;
    stripeTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const rocketPaper = new THREE.MeshStandardMaterial({
      map: stripeTexture, roughness: 0.58, metalness: 0.02
    });

    const bodyRadius = 0.13;
    const bodyLength = 1.08;
    const rocketBody = new THREE.Mesh(
      new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32),
      rocketPaper
    );
    rocketBody.position.y = 0.36;
    rocket.add(rocketBody);

    // Small pointed red cap, with its base meeting the striped casing.
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(bodyRadius, 0.4, 32), rocketRed
    );
    nose.position.y = 1.10;
    rocket.add(nose);

    // Long, very thin wooden launch stick attached along the lower side.
    const guideStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 3.35, 10), stickMaterial
    );
    guideStick.position.set(0.115, -1.86, 0);
    guideStick.castShadow = true;
    rocket.add(guideStick);

    // A narrow collar and small exhaust sit at the bottom of the paper body.
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.095, 0.12, 24), nozzleMaterial
    );
    nozzle.position.y = -0.23;
    rocket.add(nozzle);

    const exhaust = new THREE.PointLight("#ff9a38", 10, 7);
    exhaust.position.set(0, -0.32, 0);
    rocket.add(exhaust);

    const rocketFlame = new THREE.Group();
    rocketFlame.position.y = -0.29;
    rocket.add(rocketFlame);
    const flameCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.48, 20),
      new THREE.MeshBasicMaterial({ color: "#fff5bd" })
    );
    flameCore.rotation.x = Math.PI;
    flameCore.position.y = -0.25;
    rocketFlame.add(flameCore);
    const flameGlow = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.68, 20),
      new THREE.MeshBasicMaterial({ color: "#ff6a20", transparent: true, opacity: 0.72 })
    );
    flameGlow.rotation.x = Math.PI;
    flameGlow.position.y = -0.31;
    rocketFlame.add(flameGlow);

    // Bright launch trail and drifting smoke puffs.
    const trailParticles = [];
    let lastTrailTime = 0;
    function emitRocketTrail() {
      const count = 18;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const particles = [];
      const hot = new THREE.Color("#ffb13b");
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        positions[j] = rocket.position.x + (Math.random() - 0.5) * 0.13;
        positions[j + 1] = rocket.position.y - 0.48;
        positions[j + 2] = rocket.position.z + (Math.random() - 0.5) * 0.13;
        velocities[j] = (Math.random() - 0.5) * 1.6;
        velocities[j + 1] = -1.4 - Math.random() * 2.4;
        velocities[j + 2] = (Math.random() - 0.5) * 1.6;
        const c = hot.clone().lerp(new THREE.Color("#ff4b19"), Math.random() * 0.55);
        colors[j] = c.r; colors[j + 1] = c.g; colors[j + 2] = c.b;
        particles.push({ life: 1, decay: 1.4 + Math.random() * 0.9 });
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      particleGroups.push({ points, velocities, particles, gravity: 2.2 });
    }

    // Particle groups
    const particleGroups = [];
    const temporaryLights = [];

    
function makeFirework(x, y, z, color, count = 150, size = 0.09) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const particles = [];

  const baseColor = new THREE.Color(color);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 3.2 + Math.random() * 8.5;

    const j = i * 3;

    positions[j] = x;
    positions[j + 1] = y;
    positions[j + 2] = z;

    velocities[j] = speed * Math.sin(phi) * Math.cos(theta);
    velocities[j + 1] = speed * Math.cos(phi);
    velocities[j + 2] = speed * Math.sin(phi) * Math.sin(theta);

    const c = baseColor.clone();
    c.offsetHSL((Math.random() - 0.5) * 0.08, 0, Math.random() * 0.2);

    colors[j] = c.r;
    colors[j + 1] = c.g;
    colors[j + 2] = c.b;

    particles.push({
      life: 1,
      decay: 0.22 + Math.random() * 0.20
    });
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  );

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  particleGroups.push({
    points,
    velocities,
    particles,
    gravity: 2.8
  });

  const light = new THREE.PointLight(color, 35, 24);
  light.position.set(x, y, z);
  scene.add(light);

  temporaryLights.push({
    light,
    life: 1
  });

  return points;
}


function heartFirework(x, y, z) {
  const count = 180;

  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const pink = new THREE.Color("#ff4f9a");

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;

    const hx = 16 * Math.pow(Math.sin(t), 3) / 16;

    const hy = (
      13 * Math.cos(t)
      - 5 * Math.cos(2 * t)
      - 2 * Math.cos(3 * t)
      - Math.cos(4 * t)
    ) / 16;

    const speed = 5 + Math.random() * 1.5;
    const j = i * 3;

    positions[j] = x;
    positions[j + 1] = y;
    positions[j + 2] = z;

    velocities[j] = hx * speed;
    velocities[j + 1] = hy * speed;
    velocities[j + 2] = (Math.random() - 0.5) * 0.7;

    colors[j] = pink.r;
    colors[j + 1] = pink.g;
    colors[j + 2] = pink.b;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  );

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  scene.add(points);

  particleGroups.push({
    points,
    velocities,
    particles: Array.from({ length: count }, () => ({
      life: 1,
      decay: 0.19
    })),
    gravity: 1.1
  });
}

    function burstSky(x, y, z) {
      // Main chrysanthemum: a dense gold core with colorful outer stars.
      makeFirework(x, y, z, "#fff0b0", 260, 0.12);
      makeFirework(x, y, z, "#ffb52e", 230, 0.105);
      makeFirework(x, y, z, "#ff4f94", 150, 0.085);
      makeFirework(x, y, z, "#65eaff", 130, 0.08);

      // Secondary shells bloom at staggered heights like a real display.
      setTimeout(() => heartFirework(x, y, z - 1), 420);
      setTimeout(() => {
        makeFirework(x - 4.2, y - 1.8, z - 3, "#ffd45c", 190, 0.095);
        makeFirework(x - 4.2, y - 1.8, z - 3, "#ff6b36", 90, 0.07);
      }, 850);
      setTimeout(() => {
        makeFirework(x + 4.4, y + 1.2, z - 4, "#ff65b5", 190, 0.095);
        makeFirework(x + 4.4, y + 1.2, z - 4, "#a58aff", 100, 0.07);
      }, 1350);
      setTimeout(() => {
        makeFirework(x, y + 4.2, z - 6, "#fff1c0", 240, 0.1);
      }, 1950);
    }

    // Animation state
    let currentStage = "idle";
    let rocketStart = 0;
    let returnStart = 0;
    let animationFrame;

    const originalTarget = new THREE.Vector3(0, 3, 0);
    const rocketTarget = new THREE.Vector3();
    const burstCameraPosition = new THREE.Vector3();
    const burstCameraTarget = new THREE.Vector3();

    function ignite() {
      if (currentStage !== "idle") return;

      currentStage = "lit";
      flame.visible = true;
      fireLight.intensity = 12;

      setStage("lit");

      matchHead.material.emissive = new THREE.Color("#ff5c26");
      matchHead.material.emissiveIntensity = 1.5;

      setTimeout(() => {
        if (currentStage !== "lit") return;

        currentStage = "launch";
        setStage("launch");

        rocket.position.set(0, 1.8, 0);
        rocket.visible = true;
        lastTrailTime = clock.elapsedTime;
        rocketStart = clock.elapsedTime;
      }, 1300);
    }


function updateParticles(dt) {
  for (let g = particleGroups.length - 1; g >= 0; g--) {
    const group = particleGroups[g];

    const attribute =
      group.points.geometry.attributes.position;

    const positions = attribute.array;
    const velocities = group.velocities;

    for (let i = 0; i < group.particles.length; i++) {
      const p = group.particles[i];
      const j = i * 3;

      positions[j] += velocities[j] * dt;
      positions[j + 1] += velocities[j + 1] * dt;
      positions[j + 2] += velocities[j + 2] * dt;

      velocities[j + 1] -= group.gravity * dt;

      velocities[j] *= 0.993;
      velocities[j + 1] *= 0.993;
      velocities[j + 2] *= 0.993;

      p.life -= p.decay * dt;
    }

    attribute.needsUpdate = true;

    const averageLife =
      group.particles.reduce((sum, p) => sum + Math.max(0, p.life), 0)
      / group.particles.length;

    group.points.material.opacity = averageLife;

    if (group.particles.every(p => p.life <= 0)) {
      scene.remove(group.points);
      group.points.geometry.dispose();
      group.points.material.dispose();

      particleGroups.splice(g, 1);
    }
  }

  for (let i = temporaryLights.length - 1; i >= 0; i--) {
    const item = temporaryLights[i];

    item.life -= dt * 1.2;
    item.light.intensity = Math.max(0, item.life * 35);

    if (item.life <= 0) {
      scene.remove(item.light);
      temporaryLights.splice(i, 1);
    }
  }
}

    function animate() {
      animationFrame = requestAnimationFrame(animate);

      // IMPORTANT: getDelta() advances THREE.Clock. Reading elapsedTime alone
      // does not advance it, which was why the rocket stayed frozen.
      const dt = Math.min(clock.getDelta(), 0.04);
      const elapsed = clock.elapsedTime;

      // Natural flame movement
      if (flame.visible) {
        flame.scale.set(
          1 + Math.sin(elapsed * 18) * 0.06,
          1 + Math.sin(elapsed * 22) * 0.12,
          1 + Math.sin(elapsed * 15) * 0.06
        );

        fireLight.intensity = 9 + Math.sin(elapsed * 18) * 2;
      }

      // Rocket flight and cinematic camera tracking
      if (currentStage === "launch") {
        // A slower 5.5-second ascent gives the rocket time to travel naturally.
        const progress = Math.min((elapsed - rocketStart) / 5.5, 1);

        const eased = progress < 0.78 ? 1 - Math.pow(1 - progress / 0.78, 2.4) : 1;

        rocket.position.y = 1.8 + eased * 14.5;
        rocket.position.x = Math.sin(progress * Math.PI * 1.5) * 0.5;

        rocket.rotation.z = Math.sin(progress * 7) * 0.025;

        rocketFlame.scale.set(0.9 + Math.random() * 0.18, 0.8 + Math.random() * 0.55, 0.9 + Math.random() * 0.18);
        exhaust.intensity = 8 + Math.random() * 5;
        if (elapsed - lastTrailTime > 0.075) {
          emitRocketTrail();
          lastTrailTime = elapsed;
        }

        // Keep the camera back at a comfortable distance instead of flying
        // right alongside the rocket. The rocket gradually recedes in frame.
        camera.position.y = 3.1 + eased * 0.35;
        camera.position.z = 10 + eased * 5.5;
        camera.position.x = THREE.MathUtils.lerp(
          0,
          rocket.position.x * 0.35,
          eased
        );

        // Aim around the rocket body so it stays visible while getting smaller.
        rocketTarget.set(
          rocket.position.x,
          rocket.position.y + 0.45,
          0
        );

        camera.lookAt(rocketTarget);

        if (progress >= 1) {
  rocket.visible = false;

  // Stop the rocket at its final position
  rocket.position.y = 1.8 + 14.5;

  // Launch the complete fireworks sequence
  burstSky(
    rocket.position.x,
    rocket.position.y,
    -5
  );

  burstCameraPosition.copy(camera.position);
  burstCameraTarget.copy(rocketTarget);
  currentStage = "boom";
  setStage("boom");

  returnStart = elapsed;
}
      }

      // Return to the romantic ground-level composition
      if (currentStage === "boom") {
        // Hold the camera on the explosion so the full firework bloom is visible.
        const progress = Math.max(0, Math.min((elapsed - returnStart - 1.8) / 2.8, 1));
        const eased = progress * progress * (3 - 2 * progress);
        camera.position.lerpVectors(burstCameraPosition, initialCamera, eased);
        const target = burstCameraTarget.clone().lerp(originalTarget, eased);
        camera.lookAt(target);

        couple.rotation.y = Math.sin(elapsed * 0.3) * 0.025;

        // Ambient little bursts begin after the camera returns to the couple.
        if (progress >= 1 && Math.random() < 0.012) {
          makeFirework(
            (Math.random() - 0.5) * 15,
            7 + Math.random() * 8,
            -9 - Math.random() * 8,
            ["#ffb84b", "#ff4f94", "#8d78ff", "#61e8ff"][
              Math.floor(Math.random() * 4)
            ],
            70,
            0.07
          );
        }
      }

      updateParticles(dt);

      stars.rotation.y += dt * 0.003;

      renderer.render(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onSkyClick(event) {
      if (currentStage !== "boom") return;

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const direction = raycaster.ray.direction;
      const point = camera.position.clone().add(
        direction.multiplyScalar(24)
      );

      makeFirework(
        point.x,
        point.y,
        point.z,
        ["#ffb84b", "#ff4f94", "#8d78ff", "#61e8ff"][
          Math.floor(Math.random() * 4)
        ],
        130
      );
    }

    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    renderer.domElement.addEventListener("pointerdown", onSkyClick);
    window.addEventListener("resize", resize);

    engineRef.current = {
      ignite,
      reset: () => {
  currentStage = "idle";

  rocket.visible = false;
  flame.visible = false;

  camera.position.copy(initialCamera);
  camera.lookAt(originalTarget);

  for (const group of particleGroups) {
    scene.remove(group.points);
    group.points.geometry.dispose();
    group.points.material.dispose();
  }

  particleGroups.length = 0;

  for (const item of temporaryLights) {
    scene.remove(item.light);
  }

  temporaryLights.length = 0;

  matchHead.material.emissiveIntensity = 0;
  fireLight.intensity = 0;

  setStage("idle");
}
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onSkyClick);

      for (const group of particleGroups) {
        group.points.geometry.dispose();
        group.points.material.dispose();
      }

      renderer.dispose();
      renderer.domElement.remove();
      engineRef.current = null;
    };
  }, []);

  function reset() {
    engineRef.current?.reset();
  }

  return (
    <main className="experience">
      <div ref={mountRef} className="three-scene" />

      {stage === "idle" && (
        <div className="intro">
          <h1>Something is waiting for you</h1>
          <p>Light it up, Juju ❤️</p>
        </div>
      )}

      {stage === "idle" && (
        <button
          className="ignite-button"
          onClick={() => engineRef.current?.ignite()}
        >
          <span className="match-icon">🔥</span>
          Light the match
        </button>
      )}

      {stage === "lit" && (
        <div className="cinema-text">A little light for my love...</div>
      )}

      {stage === "launch" && (
        <div className="cinema-text launch-text">
          Look up, my love...
        </div>
      )}

      {stage === "boom" && (
        <>
          <div className="love-message">
            <h1>Happyyy Diwaliii</h1>
            <h2>My Jujuuuu Babyyyyy</h2>
            <p className="love-line">
              I love you so much, like thisssss 💖
            </p>
            <p className="wish">
              Babyyyyy im missing you soooo muchhhhhh😭😭😭😭😭😭😭😭
            </p>
          </div>

          <div className="tap-message">
            Tap anywhere in the sky for more fireworks ✨
          </div>

          <button className="replay-button" onClick={reset}>
            Light it again ↻
          </button>
        </>
      )}
    </main>
  );
}
