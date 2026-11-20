export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  depth: number;
}

export type GeometricShapeKind = 'octahedron' | 'diamond' | 'prism' | 'octagram';

export interface FloatingHeroShape {
  id: string;
  kind: GeometricShapeKind;
  /** Normalized viewport anchor (0..1) */
  anchorX: number;
  anchorY: number;
  /** Base radius in CSS px */
  radius: number;
  /** Local 3D vertices normalized to ~[-1, 1] */
  vertices: Vec3[];
  /** Edge pairs indexing into vertices */
  edges: [number, number][];
  /** Initial Euler angles (rad) */
  rotX: number;
  rotY: number;
  rotZ: number;
  /** Angular speeds (rad/s) */
  speedX: number;
  speedY: number;
  speedZ: number;
  /** Floating bob phase & amplitude */
  floatPhase: number;
  floatAmp: number;
  /** Parallax weight */
  depthWeight: number;
  strokeColor: string;
  fillColor: string;
  opacity: number;
}

export interface HeroLightParticle {
  id: number;
  /** Normalized X & Y (0..1) */
  x: number;
  y: number;
  /** Depth 0.25 (far) .. 1.0 (near) */
  z: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  color: string;
}

export function buildOctahedronGeometry(): { vertices: Vec3[]; edges: [number, number][] } {
  const vertices: Vec3[] = [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
  ];
  const edges: [number, number][] = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2],
  ];
  return { vertices, edges };
}

export function buildHexPrismGeometry(): { vertices: Vec3[]; edges: [number, number][] } {
  const vertices: Vec3[] = [];
  const edges: [number, number][] = [];
  const sides = 6;
  const halfH = 0.62;
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    vertices.push({ x, y: halfH, z });
    vertices.push({ x, y: -halfH, z });
  }
  for (let i = 0; i < sides; i++) {
    const top = i * 2;
    const bot = i * 2 + 1;
    const nextTop = ((i + 1) % sides) * 2;
    const nextBot = ((i + 1) % sides) * 2 + 1;
    edges.push([top, nextTop]);
    edges.push([bot, nextBot]);
    edges.push([top, bot]);
  }
  return { vertices, edges };
}

export function buildOctagramStarGeometry(): { vertices: Vec3[]; edges: [number, number][] } {
  // Subtle Islamic 8-point Rub el Hizb double-square prism in 3D space
  const vertices: Vec3[] = [];
  const edges: [number, number][] = [];
  const depth = 0.24;

  const pushSquare = (offsetAngle: number) => {
    const base = vertices.length;
    for (let i = 0; i < 4; i++) {
      const a = offsetAngle + (i * Math.PI) / 2;
      vertices.push({ x: Math.cos(a), y: Math.sin(a), z: depth });
      vertices.push({ x: Math.cos(a), y: Math.sin(a), z: -depth });
    }
    for (let i = 0; i < 4; i++) {
      const f = base + i * 2;
      const b = base + i * 2 + 1;
      const nf = base + ((i + 1) % 4) * 2;
      const nb = base + ((i + 1) % 4) * 2 + 1;
      edges.push([f, nf]);
      edges.push([b, nb]);
      edges.push([f, b]);
    }
  };

  pushSquare(0);
  pushSquare(Math.PI / 4);
  return { vertices, edges };
}

export function buildDiamondCrystalGeometry(): { vertices: Vec3[]; edges: [number, number][] } {
  const vertices: Vec3[] = [
    { x: 0, y: 1.25, z: 0 },
    { x: 0, y: -1.25, z: 0 },
    { x: 0.72, y: 0.15, z: 0.72 },
    { x: -0.72, y: 0.15, z: 0.72 },
    { x: -0.72, y: 0.15, z: -0.72 },
    { x: 0.72, y: 0.15, z: -0.72 },
  ];
  const edges: [number, number][] = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 3], [3, 4], [4, 5], [5, 2],
  ];
  return { vertices, edges };
}

export function createHeroShapes(): FloatingHeroShape[] {
  const octagram = buildOctagramStarGeometry();
  const octahedron = buildOctahedronGeometry();
  const prism = buildHexPrismGeometry();
  const diamond = buildDiamondCrystalGeometry();

  return [
    {
      id: 'hero-octagram-center',
      kind: 'octagram',
      anchorX: 0.52,
      anchorY: 0.48,
      radius: 108,
      ...octagram,
      rotX: 0.35,
      rotY: 0.4,
      rotZ: 0.15,
      speedX: 0.11,
      speedY: 0.17,
      speedZ: 0.05,
      floatPhase: 0,
      floatAmp: 11,
      depthWeight: 18,
      strokeColor: 'rgba(240, 201, 94, 0.34)', // Maharat Imperial Laurel Gold
      fillColor: 'rgba(25, 47, 100, 0.16)',
      opacity: 0.85,
    },
    {
      id: 'hero-octahedron-left',
      kind: 'octahedron',
      anchorX: 0.09,
      anchorY: 0.28,
      radius: 64,
      ...octahedron,
      rotX: 0.6,
      rotY: 0.2,
      rotZ: 0.1,
      speedX: -0.14,
      speedY: 0.21,
      speedZ: 0.08,
      floatPhase: 1.4,
      floatAmp: 9,
      depthWeight: 24,
      strokeColor: 'rgba(14, 165, 183, 0.42)', // Maharat Peacock Teal
      fillColor: 'rgba(0, 90, 110, 0.14)',
      opacity: 0.82,
    },
    {
      id: 'hero-prism-right-top',
      kind: 'prism',
      anchorX: 0.91,
      anchorY: 0.22,
      radius: 58,
      ...prism,
      rotX: 0.45,
      rotY: 0.9,
      rotZ: -0.2,
      speedX: 0.13,
      speedY: -0.18,
      speedZ: 0.06,
      floatPhase: 2.7,
      floatAmp: 10,
      depthWeight: 22,
      strokeColor: 'rgba(240, 201, 94, 0.36)',
      fillColor: 'rgba(25, 47, 100, 0.12)',
      opacity: 0.78,
    },
    {
      id: 'hero-diamond-bottom-left',
      kind: 'diamond',
      anchorX: 0.34,
      anchorY: 0.84,
      radius: 46,
      ...diamond,
      rotX: 0.2,
      rotY: 0.5,
      rotZ: 0.3,
      speedX: 0.16,
      speedY: 0.24,
      speedZ: -0.09,
      floatPhase: 4.1,
      floatAmp: 8,
      depthWeight: 16,
      strokeColor: 'rgba(94, 234, 212, 0.34)',
      fillColor: 'rgba(0, 90, 110, 0.12)',
      opacity: 0.76,
    },
    {
      id: 'hero-octahedron-bottom-right',
      kind: 'octahedron',
      anchorX: 0.86,
      anchorY: 0.82,
      radius: 54,
      ...octahedron,
      rotX: 0.8,
      rotY: 0.3,
      rotZ: -0.15,
      speedX: -0.12,
      speedY: -0.19,
      speedZ: 0.07,
      floatPhase: 5.2,
      floatAmp: 9,
      depthWeight: 20,
      strokeColor: 'rgba(229, 185, 76, 0.32)',
      fillColor: 'rgba(25, 47, 100, 0.12)',
      opacity: 0.74,
    },
  ];
}

/** Deterministic PRNG (Mulberry32) so particle distribution is balanced and repeatable */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createLightParticles(count = 46, seed = 140630): HeroLightParticle[] {
  const rand = mulberry32(seed);
  const palette = [
    'rgba(240, 201, 94, 0.78)', // Laurel Gold
    'rgba(94, 234, 212, 0.64)', // Luminous Teal
    'rgba(186, 230, 253, 0.56)', // Soft Sky
    'rgba(229, 185, 76, 0.68)', // Warm Gold
  ];
  const particles: HeroLightParticle[] = [];
  for (let i = 0; i < count; i++) {
    const z = 0.25 + rand() * 0.75;
    particles.push({
      id: i,
      x: rand(),
      y: rand(),
      z,
      vx: (rand() - 0.5) * 0.012 * z,
      vy: -(0.006 + rand() * 0.014) * z, // gentle upward drift
      radius: 1.1 + z * 2.1,
      phase: rand() * Math.PI * 2,
      color: palette[i % palette.length],
    });
  }
  return particles;
}

export function rotatePoint3D(p: Vec3, rx: number, ry: number, rz: number): Vec3 {
  // Rotate around X
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = p.y * cosX - p.z * sinX;
  const z1 = p.y * sinX + p.z * cosX;

  // Rotate around Y
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x2 = p.x * cosY + z1 * sinY;
  const z2 = -p.x * sinY + z1 * cosY;

  // Rotate around Z
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const x3 = x2 * cosZ - y1 * sinZ;
  const y3 = x2 * sinZ + y1 * cosZ;

  return { x: x3, y: y3, z: z2 };
}

export function projectPoint3D(
  p: Vec3,
  cx: number,
  cy: number,
  radius: number,
  cameraDistance = 4.2
): ProjectedPoint {
  const depth = Math.max(0.8, cameraDistance - p.z);
  const scale = cameraDistance / depth;
  return {
    x: cx + p.x * radius * scale,
    y: cy + p.y * radius * scale,
    scale,
    depth: p.z,
  };
}

export function stepParticles(
  particles: HeroLightParticle[],
  dtSeconds: number
): HeroLightParticle[] {
  const clampedDt = Math.min(Math.max(dtSeconds, 0), 0.1);
  return particles.map((p) => {
    let nx = p.x + p.vx * clampedDt;
    let ny = p.y + p.vy * clampedDt;
    if (nx < -0.02) nx = 1.02;
    if (nx > 1.02) nx = -0.02;
    if (ny < -0.03) ny = 1.03;
    if (ny > 1.03) ny = -0.03;
    return { ...p, x: nx, y: ny };
  });
}

export function computeEffectiveDpr(rawDpr: number, maxDpr = 1.5): number {
  if (!Number.isFinite(rawDpr) || rawDpr <= 0) return 1;
  return Math.min(rawDpr, maxDpr);
}
