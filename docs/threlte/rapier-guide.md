# @threlte/rapier - Quick Reference Guide

> Summary of the [Rapier](https://rapier.rs/) physics engine integration with the [Threlte](https://threlte.xyz/) framework for Svelte/Three.js.  
> Official source: https://threlte.xyz/docs/reference/rapier/getting-started/

---

## What is it?

`@threlte/rapier` is a package that integrates the **Rapier** physics engine (written in Rust, compiled to WASM) into the **Threlte** ecosystem. It provides Svelte components and hooks for 3D physics simulation (collisions, gravity, forces, joints) in a declarative way, directly within your Svelte components.

---

## Installation

```bash
npm install @threlte/rapier @dimforge/rapier3d-compat
```

Requires `@threlte/core` to be installed.

---

## Basic Architecture

The required structure involves three layers:

```
<Canvas>              (from @threlte/core)
  └─ <World>          (from @threlte/rapier - physics context)
       └─ <RigidBody> (rigid body)
            └─ <Collider> or <AutoColliders>  (collision geometric shape)
                 └─ <T.Mesh>  (Three.js visual mesh)
```

**Minimal example:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { World, RigidBody, Collider } from '@threlte/rapier'
</script>

<Canvas>
  <World>
    <RigidBody type="dynamic">
      <Collider shape="cuboid" args={[0.5, 0.5, 0.5]} />
      <T.Mesh>
        <T.BoxGeometry args={[1, 1, 1]} />
        <T.MeshStandardMaterial />
      </T.Mesh>
    </RigidBody>
  </World>
</Canvas>
```

---

## Components

### `<World>`

- Root context for all physics. Loads the Rapier WASM module.
- All physics components must be children of this component.
- Supports a **`fallback` slot** in case the WASM fails to load.
- Only **one instance** of `<World>` is supported per application.

| Main Prop | Type | Default | Description |
|---|---|---|---|
| `gravity` | `Position` | `{ y: -9.81 }` | World gravity |
| `framerate` | `number \| "varying"` | `"varying"` | Simulation FPS (see Framerate section) |

```svelte
<World gravity={{ y: -9.81 }}>
  <!-- ... -->
  {#snippet fallback()}
    <FallbackScene />
  {/snippet}
</World>
```

---

### `<RigidBody>`

- Defines a rigid body that is affected by forces, gravity, and contacts.
- **Types:**
  - `dynamic` (default) - affected by gravity and forces
  - `fixed` - static, does not move (ideal for ground, walls)
  - `kinematicPosition` - controlled via code, other bodies collide with it
  - `kinematicVelocity` - controlled via velocity

| Main Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | `'dynamic'` | Rigid body type |
| `linearVelocity` | `Position` | `{}` | Initial linear velocity |
| `angularVelocity` | `Rotation` | `{}` | Initial angular velocity |
| `gravityScale` | `number` | `1` | Gravity scale |
| `linearDamping` | `number` | `0` | Linear damping |
| `angularDamping` | `number` | `0` | Angular damping |
| `lockRotations` | `boolean` | `false` | Freeze rotation |
| `lockTranslations` | `boolean` | `false` | Freeze translation |
| `canSleep` | `boolean` | `true` | Allow the body to sleep |
| `ccd` | `boolean` | `false` | Continuous Collision Detection |

**Main events:**

| Event | Payload |
|---|---|
| `oncollisionenter` | `targetCollider`, `targetRigidBody`, `manifold` |
| `oncollisionexit` | `targetCollider`, `targetRigidBody` |
| `oncontact` | `targetCollider`, `manifold`, `totalForceMagnitude` |
| `onsensorenter` | `targetCollider`, `targetRigidBody` |
| `onsensorexit` | `targetCollider`, `targetRigidBody` |
| `onsleep` / `onwake` | `void` |

**Binding:**

```svelte
<RigidBody bind:rigidBody={myBody} />
<!-- myBody: RAPIER.RigidBody - direct access to the Rapier API -->
```

---

### `<Collider>`

- Defines the geometric shape for collision detection.
- **Must be a child of `<RigidBody>`** for the body to receive contact forces.
- Can be **standalone** (without a `<RigidBody>` parent) - participates in collisions but is not affected by forces (good for static environment).
- Can function as a **sensor** (detects presence without generating contact forces).

| Main Prop | Type | Description |
|---|---|---|
| `shape` | `string` (required) | Shape: `ball`, `cuboid`, `capsule`, `cylinder`, `cone`, `trimesh`, `convexHull`, `convexMesh`, `heightfield`, etc. |
| `args` | `array` (required) | Shape arguments (e.g.: cuboid = [hx, hy, hz]) |
| `sensor` | `boolean` | Sensor mode (detection without contact) |
| `friction` | `number` | Friction |
| `restitution` | `number` | Elasticity (bounce) |
| `density` | `number` | Density (mass = density x volume) |
| `mass` | `number` | Direct mass |
| `contactForceEventThreshold` | `number` | Threshold for firing contact events |

**Common shapes and args:**

| Shape | Args | Example |
|---|---|---|
| `ball` | `[radius]` | `args={[0.5]}` |
| `cuboid` | `[hx, hy, hz]` | `args={[1, 1, 1]}` |
| `capsule` | `[half-height, radius]` | `args={[0.5, 0.25]}` |
| `cylinder` | `[half-height, radius]` | `args={[1, 0.5]}` |
| `cone` | `[half-height, radius]` | `args={[1, 0.5]}` |

---

### `<AutoColliders>`

- Automatically generates colliders based on child meshes.
- Available shapes: `cuboid`, `ball`, `capsule`, `trimesh`, `convexHull` (default: `convexHull`).
- Ideal for loaded GLTF models where the exact geometry is not known.

```svelte
<RigidBody>
  <AutoColliders shape="convexHull">
    <T.Mesh geometry={$helmet.geometry} material={$helmet.material} />
  </AutoColliders>
</RigidBody>
```

| Shape | Description |
|---|---|
| `convexHull` | Convex hull of the geometry (recommended for models) |
| `trimesh` | Exact polygon mesh (more accurate, heavier) |
| `cuboid` | Bounding box as a cube |
| `ball` | Bounding box as a sphere |
| `capsule` | Bounding box as a capsule |

---

### `<CollisionGroups>`

- Controls which colliders interact with each other via a group system (32 groups available).
- Similar to collision "layers" in game engines.

---

### `<Attractor>`

- Applies attraction forces (e.g.: point gravity) on nearby rigid bodies.

---

### `<Debug>`

- Visually renders all colliders in the scene for debugging.

```svelte
<Debug />
```

---

## Hooks

### `useRapier()`

- Direct access to the physics world `RAPIER.World` and context functions.

```typescript
const {
  rapier,                          // RAPIER module
  world,                           // RAPIER.World
  colliderObjects,                 // Map<number, Object3D>
  rigidBodyObjects,                // Map<number, Object3D>
  addColliderToContext,            // registers collider in the event system
  removeColliderFromContext,
  addRigidBodyToContext,
  removeRigidBodyFromContext
} = useRapier()
```

**Common usage - changing gravity:**

```svelte
const { world } = useRapier()
world.gravity = { x: 0, y: 0, z: 0 }
```

---

### `useRigidBody()`

- Returns the `RAPIER.RigidBody` of the parent `<RigidBody>`. `undefined` if there is no parent.

```typescript
const rigidBody = useRigidBody() // RAPIER.RigidBody | undefined
```

---

### `usePhysicsTask(callback)`

- Similar to Threlte's `useTask`, but executed **before** the physics step.
- In the `simulation` stage, ensures your code runs before physics advances.
- With a fixed framerate, receives the fixed delta (e.g.: `1/200 = 0.005`).

```svelte
usePhysicsTask((delta) => {
  // manipulate state before the physics step
  rigidBody?.setNextKinematicTranslation({ x: 1, y: 2, z: 3 })
})
```

---

### `useCollisionGroups()`

- Reactively manages collision groups.

---

## Joints

Joints restrict the relative movement between two rigid bodies. Implemented as **hooks** (not components), since two RigidBodies are not necessarily in the same component tree.

| Joint | Hook | Description |
|---|---|---|
| **Fixed** | `useFixedJoint()` | Bodies locked together, no relative movement |
| **Revolute** | `useRevoluteJoint()` | Rotation on one axis (e.g.: hinge) |
| **Prismatic** | `usePrismaticJoint()` | Translation on one axis (e.g.: piston) |
| **Spherical** | `useSphericalJoint()` | Free rotation (e.g.: shoulder, ball-in-socket) |
| **Rope** | `useRopeJoint()` | Distance constraint (e.g.: rope) |

```svelte
<script>
  import { useFixedJoint } from '@threlte/rapier'
  const { joint } = useFixedJoint(bodyA, bodyB, params)
</script>
```

---

## Physics Framerate

Controlled by the `<World>` prop `framerate`:

### `framerate="varying"` (default)

- Physics advances using the real delta from `requestAnimationFrame`.
- Simple, but **non-deterministic** (results may vary between runs).
- Recommended for most applications.

### `framerate={number}` (e.g.: `framerate={60}`)

- Advances the simulation N times per second with a fixed delta.
- **Deterministic** - the same simulation always produces the same result.
- Threlte "runs physics ahead" and then interpolates visually to maintain smoothness.
- Ideal for games or scenarios that require reproducibility.

---

## Common Patterns

### Dynamic Body with Manual Collision

```svelte
<RigidBody type="dynamic">
  <Collider shape="ball" args={[0.5]} restitution={0.8} />
  <T.Mesh>
    <T.SphereGeometry args={[0.5]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</RigidBody>
```

### Static Ground

```svelte
<RigidBody type="fixed">
  <AutoColliders shape="cuboid">
    <T.Mesh>
      <T.BoxGeometry args={[20, 1, 20]} />
      <T.MeshStandardMaterial />
    </T.Mesh>
  </AutoColliders>
</RigidBody>
```

### Kinematic Platform

```svelte
<script>
  import { useTask } from '@threlte/core'
  let body = $state()
  useTask(() => {
    body?.setNextKinematicTranslation({
      x: Math.sin(Date.now() / 1000) * 3,
      y: 2, z: 0
    })
  })
</script>

<RigidBody type="kinematicPosition" bind:rigidBody={body} lockRotations>
  <AutoColliders shape="ball">
    <T.Mesh><T.SphereGeometry /><T.MeshStandardMaterial /></T.Mesh>
  </AutoColliders>
</RigidBody>
```

### Area Sensor (no physical contact)

```svelte
<Collider
  sensor
  shape="cuboid"
  args={[2, 2, 2]}
  onsensorenter={() => (playerInside = true)}
  onsensorexit={() => (playerInside = false)}
/>
```

### GLTF Model with Physics

```svelte
<RigidBody>
  <AutoColliders shape="convexHull">
    <T.Mesh geometry={$model.geometry} material={$model.material} />
  </AutoColliders>
</RigidBody>
```

### Standalone Collider (environment without forces)

```svelte
<Collider shape="cuboid" args={[1, 1, 1]} />
<!-- Not a child of RigidBody - participates in collisions but is not affected by gravity -->
```

---

## Important Tips

- **WASM**: Rapier is compiled as a WASM module. Always provide a `fallback` in `<World>`.
- **Single instance**: Only one `<World>` per Threlte application.
- **Unstable API**: The package is under active development, the API may change.
- **Automatic mass**: If you don't provide `density`, `mass`, or `massProperties`, Rapier calculates it automatically.
- **Trimesh vs ConvexHull**: `trimesh` is more accurate for concave geometries but is computationally heavier. `convexHull` is more performant and recommended for most cases.
- **usePhysicsTask vs useTask**: Use `usePhysicsTask` when you need to modify physics state before the step. Use `useTask` for rendering logic.

---

## Useful Links

- Official Threlte Rapier docs: https://threlte.xyz/docs/reference/rapier/getting-started/
- Rapier docs: https://rapier.rs/docs/
- Threlte repository: https://github.com/threlte/threlte
