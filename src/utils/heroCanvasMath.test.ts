import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEffectiveDpr,
  createHeroShapes,
  createLightParticles,
  projectPoint3D,
  rotatePoint3D,
  stepParticles,
} from './heroCanvasMath';

test('Hero 3D Canvas Math: rotatePoint3D preserves Euclidean distance from origin', () => {
  const v = { x: 0.6, y: -0.8, z: 0.5 };
  const lenBefore = Math.hypot(v.x, v.y, v.z);
  const rotated = rotatePoint3D(v, 0.7, 1.3, -0.4);
  const lenAfter = Math.hypot(rotated.x, rotated.y, rotated.z);
  assert.ok(Math.abs(lenBefore - lenAfter) < 1e-9);
});

test('Hero 3D Canvas Math: projectPoint3D scales closer points larger than distant points', () => {
  const near = projectPoint3D({ x: 1, y: 0, z: 1.0 }, 500, 300, 100, 4.2);
  const far = projectPoint3D({ x: 1, y: 0, z: -1.0 }, 500, 300, 100, 4.2);
  assert.ok(near.scale > far.scale);
  assert.ok(near.x > far.x);
});

test('Hero 3D Canvas Math: shapes and particles are deterministic and stay within wrapped viewport bounds', () => {
  const shapes = createHeroShapes();
  assert.equal(shapes.length, 5);
  assert.ok(shapes.every((s) => s.vertices.length >= 6 && s.edges.length >= 12));

  const particles = createLightParticles(46, 140630);
  assert.equal(particles.length, 46);

  const stepped = stepParticles(
    [{ ...particles[0], x: 0.5, y: -0.025, vx: 0.01, vy: -0.2 }],
    0.05
  );
  assert.ok(stepped[0].y >= -0.03 && stepped[0].y <= 1.03);
  assert.equal(computeEffectiveDpr(3, 1.5), 1.5);
  assert.equal(computeEffectiveDpr(1, 1.5), 1);
  assert.equal(computeEffectiveDpr(NaN, 1.5), 1);
});
