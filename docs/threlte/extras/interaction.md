# @threlte/extras - Interaction

> Interaction components and hooks from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `interactivity()`

Plugin that registers a global listener on the `<canvas>` and forwards interaction events to `<T>` components. **Must be invoked at the root level** (typically `Scene.svelte`).

```svelte
<script>
  import { interactivity } from '@threlte/extras'
  interactivity()
</script>

<T.Mesh onclick={() => console.log('clicked')}>
  <T.BoxGeometry />
  <T.MeshBasicMaterial color="red" />
</T.Mesh>
```

### Available Events

```svelte
<T.Mesh
  onclick={(e) => {}}
  oncontextmenu={(e) => {}}
  ondblclick={(e) => {}}
  onwheel={(e) => {}}
  onpointerup={(e) => {}}
  onpointerdown={(e) => {}}
  onpointerover={(e) => {}}
  onpointerout={(e) => {}}
  onpointerenter={(e) => {}}
  onpointerleave={(e) => {}}
  onpointermove={(e) => {}}
  onpointermissed={(e) => {}}
/>
```

### Event Data

All interaction events contain:

```typescript
type Event = THREE.Intersection & {
  object: THREE.Object3D           // Hit object
  distance: number                 // Distance from ray origin
  point: THREE.Vector3             // Intersection point (world)
  face: THREE.Face | null          // Hit face
  eventObject: THREE.Object3D      // Object that registered the handler
  intersections: Intersection[]    // All intersections
  camera: THREE.Camera             // Camera used
  delta: number                    // Pixels since pointerdown (0 for non-click)
  nativeEvent: MouseEvent | PointerEvent | WheelEvent
  pointer: Vector2                 // Pointer in NDC
  ray: THREE.Ray                   // Ray used
  stopPropagation: () => void      // Stops propagation + blocks objects behind
  stopImmediatePropagation: () => void  // Delegates to DOM
  stopped: boolean
}
```

### Event Propagation

Objects are transparent to pointer events by default. The event is delivered to the closest object, bubbles up through ancestors, then to the next object, etc. Use `stopPropagation()` to block objects behind:

```svelte
<T.Mesh onclick={(e) => e.stopPropagation()} />
```

### Touch Interactions

On touch devices, the browser may cancel `pointermove` mid-gesture. Use `touch-action: none` on the canvas wrapper:

```svelte
<div style="touch-action: none;">
  <Canvas><Scene /></Canvas>
</div>
```

### Custom Event Target

```svelte
interactivity({ target: document })

// Or reactive:
const { target } = interactivity()
$effect(() => { target.set(document) })
```

### Compute Function

When the target is not the same size as the canvas:

```svelte
interactivity({
  compute: (event, state) => {
    state.pointer.update((p) => {
      p.x = (event.clientX / window.innerWidth) * 2 - 1
      p.y = -(event.clientY / window.innerHeight) * 2 + 1
      return p
    })
    state.raycaster.setFromCamera(state.pointer.current, $camera)
  }
})
```

### Filter Function

Filters and sorts hits before delivery:

```svelte
interactivity({
  filter: (hits, state) => hits.slice(0, 1)
})
```

### Interactivity State

```svelte
const { pointer, pointerOverTarget } = useInteractivity()
```

```typescript
type State = {
  enabled: CurrentWritable<boolean>
  target: CurrentWritable<HTMLElement | undefined>
  pointer: CurrentWritable<Vector2>
  pointerOverTarget: CurrentWritable<boolean>
  lastEvent: MouseEvent | WheelEvent | PointerEvent | undefined
  raycaster: Raycaster
  initialClick: [x: number, y: number]
  initialHits: THREE.Object3D[]
  hovered: Map<string, IntersectionEvent<...>>
  interactiveObjects: THREE.Object3D[]
  compute: ComputeFunction
  filter?: FilterFunction
  clickDistanceThreshold: number
  clickTimeThreshold: number
}
```

### TypeScript

```typescript
import type { InteractivityProps } from '@threlte/extras'

declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps {}
  }
}
export {}
```

---

## `<OrbitControls>`

Camera orbit controls. **Must be a direct child of a camera with `makeDefault`.**

```svelte
<T.PerspectiveCamera makeDefault position={[5, 5, 5]}>
  <OrbitControls enableDamping autoRotate rotateSpeed={1} zoomToCursor />
</T.PerspectiveCamera>
```

Extends `<T.OrbitControls>`. Supports all 30+ Three.js props: `enableDamping`, `autoRotate`, `rotateSpeed`, `zoomSpeed`, `zoomToCursor`, `minPolarAngle`, `maxPolarAngle`, `enableZoom`, etc.

| Prop | Type | Description |
|---|---|---|
| `camera` | `THREE.Camera` | Explicit camera (optional, uses parent or default) |

---

## `<CameraControls>`

Advanced camera controls (based on [camera-controls](https://github.com/yomotsu/camera-controls)). Supports zoom, rotation, pan, smooth transitions, fit-to-box, first-person, etc.

```svelte
<T.PerspectiveCamera makeDefault>
  <CameraControls bind:ref={controls} oncreate={(ref) => ref.setPosition(5, 5, 5)} />
</T.PerspectiveCamera>
```

### API (via `CameraControlsRef`)

```svelte
const controls = $state<CameraControlsRef>()

controls?.rotate(theta, phi, enableTransition)
controls?.truck(x, y, enableTransition)
controls?.dolly(scale, enableTransition)
controls?.zoom(zoomStep, enableTransition)
controls?.moveTo(x, y, z, enableTransition)
controls?.fitToBox(meshOrBox, enableTransition)
controls?.setPosition(x, y, z, enableTransition)
controls?.setTarget(x, y, z, enableTransition)
controls?.setLookAt(x, y, z, tx, ty, tz, enableTransition)
controls?.lerpLookAt(...args, t, enableTransition)
controls?.reset(enableTransition)
controls?.saveState()
```

### Props

| Prop | Type | Description |
|---|---|---|
| `camera` | `THREE.Camera` | Explicit camera (optional) |

### SSR Externalization (SvelteKit)

```typescript
// vite.config.ts
export default defineConfig({
  ssr: { noExternal: ['camera-controls'] }
})
```

---

## `<TransformControls>`

Transform gizmo (translation, rotation, scale) for 3D objects. Based on Three.js TransformControls.

### Basic Usage (child of the object)

```svelte
<TransformControls translationSnap={1}>
  <T.Mesh>
    <T.BoxGeometry args={[2, 2, 2]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</TransformControls>
```

### Transforming an External Object

```svelte
<T.Mesh bind:ref={mesh}>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
</T.Mesh>

<T.TransformControls object={mesh} />
```

Or via snippet:

```svelte
<T.Mesh>
  {#snippet children({ ref })}
    <TransformControls object={ref} />
  {/snippet}
</T.Mesh>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `autoPauseControls` | `boolean` | `true` | Pauses camera controls when dragging |
| `cameraControls` | `{ enabled: boolean }` | - | Custom third-party controls |
| `object` | `THREE.Object3D` | - | Object to transform |

### Bindings

| Name | Type |
|---|---|
| `controls` | `THREE.TransformControls` |
| `group` | `THREE.Group` |

Auto-pauses `<OrbitControls>`, `<TrackballControls>`, and `<CameraControls>` automatically. Disable with `autoPauseControls={false}`.

---

## `<Gizmo>`

Visual snap-to gizmo for camera controls. Uses [Three Viewport Gizmo](https://fennec-hub.github.io/three-viewport-gizmo/).

```svelte
<OrbitControls>
  <Gizmo type="sphere" placement="bottom-left" size={86} />
</OrbitControls>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `controls` | `OrbitControls \| CameraControls` | Explicit controls |
| `renderTask` | `TaskOptions` | Render task options |

Accepts any option from [Three Viewport Gizmo](https://fennec-hub.github.io/three-viewport-gizmo/api.html#gizmooptions).

---

## `<TrackballControls>`

Trackball-style camera controls (free rotation without axis constraint).

---

## `useCursor()`

Hook that sets the CSS cursor based on the hover state of a mesh.

```svelte
<script>
  import { useCursor } from '@threlte/extras'

  const { hovering, onPointerEnter, onPointerLeave } = useCursor('grab', 'crosshair')
</script>

<T.Mesh onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <T.BoxGeometry />
  <T.MeshBasicMaterial />
</T.Mesh>
```

- Arguments: `onPointerOverCursor = 'pointer'`, `onPointerOutCursor = 'auto'`
- Accepts stores as arguments to change the cursor dynamically
- `hovering` is a reactive store
- Rename handlers to avoid conflicts: `const { onPointerEnter: cursorEnter } = useCursor()`

---

## `useKeyboard()`

Frame-accurate key tracking (Godot-style `Input.is_action_just_pressed()`). Collects key presses between frames and applies them all at the start of each frame.

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()
  const space = keyboard.key('Space')
  const w = keyboard.key('w')

  useTask(
    () => {
      if (space.justPressed) jump()
      if (w.pressed) moveForward()
    },
    { after: keyboard.task }
  )
</script>
```

### Key State

Each key is identified by `KeyboardEvent.key` (e.g.: `'w'`, `'Space'`, `'ArrowUp'`, `'Shift'`). Case-insensitive.

| Property | Type | Description |
|---|---|---|
| `pressed` | `boolean` | Key is pressed |
| `justPressed` | `boolean` | First frame pressed |
| `justReleased` | `boolean` | First frame released |

The `KeyState` object is stable -- `keyboard.key('Space')` always returns the same reference.

### Reactivity

Properties are reactive, usable in templates or `$derived`:

```svelte
<p>{space.pressed ? 'Jumping!' : 'On the ground'}</p>
```

### Event Listeners

For immediate reactions (non-polling):

```svelte
keyboard.on('keydown', (e) => { console.log(`Pressed: ${e.key}`) })
const off = keyboard.on('keyup', (e) => { /* ... */ })
// off() to stop listening
```

### Task Ordering

Schedule tasks **after** `keyboard.task`:

```svelte
useTask(() => { /* updated state */ }, { after: keyboard.task })
```

### Options

```svelte
import { useThrelte } from '@threlte/core'
const { dom } = useThrelte()
const keyboard = useKeyboard(() => ({ target: dom }))
```

Default: `window` (global). When the window loses focus (blur), all pressed keys are automatically released.

---

## `useGamepad()`

Frame-accurate gamepad tracking using the [Standard Gamepad layout](https://w3c.github.io/gamepad/#remapping).

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useGamepad } from '@threlte/extras'

  const gamepad = useGamepad()
  const jump = gamepad.button('clusterBottom')

  useTask(
    () => {
      if (jump.justPressed) console.log('Jump!')
      const left = gamepad.stick('leftStick')
      console.log(left.x, left.y)
    },
    { after: gamepad.task }
  )
</script>
```

### Multiple Gamepads

```svelte
const gamepad1 = useGamepad({ index: 0 })
const gamepad2 = useGamepad({ index: 1 })
```

### Button State

```svelte
const a = gamepad.button('clusterBottom')
const lt = gamepad.button('leftTrigger')
if (a.justPressed) jump()
if (lt.value > 0.5) accelerate()
```

| Property | Type | Description |
|---|---|---|
| `pressed` | `boolean` | Button is pressed |
| `justPressed` | `boolean` | First frame pressed |
| `justReleased` | `boolean` | First frame released |
| `touched` | `boolean` | Button is being touched (if supported) |
| `value` | `number` | Analog value 0-1 (e.g.: triggers) |

### Stick State

```svelte
const left = gamepad.stick('leftStick')
console.log(left.x, left.y) // x: -1 to 1, y: -1 to 1
```

### Event Listeners

```svelte
const off = gamepad.button('leftTrigger').on('down', (event) => { /* ... */ })
gamepad.stick('leftStick').on('change', (event) => { /* ... */ })
gamepad.on('press', (event) => { /* ... */ })
```

| Event | Description |
|---|---|
| `down` | Start of press |
| `up` | End of press |
| `press` | Complete press (after release) |
| `change` | Value changed |
| `touchstart` / `touchend` / `touch` | Touch events |

### Options

| Option | Default | Description |
|---|---|---|
| `index` | `0` | Gamepad index |
| `axisDeadzone` | `0.05` | Minimum to trigger change events |

### Connection

```svelte
const { connected } = gamepad
<p>{$connected ? 'Gamepad connected' : 'No gamepad'}</p>
const raw = gamepad.raw // Native Gamepad or null
```

### Button Mapping

**Buttons:** `clusterBottom`, `clusterRight`, `clusterLeft`, `clusterTop`, `leftBumper`, `rightBumper`, `leftTrigger`, `rightTrigger`, `select`, `start`, `center`, `leftStickButton`, `rightStickButton`, `directionalTop`, `directionalBottom`, `directionalLeft`, `directionalRight`

**Sticks:** `leftStick`, `rightStick`

### XR Gamepad

```svelte
const left = useGamepad({ xr: true, hand: 'left' })
const right = useGamepad({ xr: true, hand: 'right' })
```

XR Buttons: `trigger`, `squeeze`, `touchpadButton`, `thumbstickButton`, `clusterBottom`, `clusterTop`
XR Sticks: `touchpad`, `thumbstick`

---

## `useInputMap()`

Action mapping system that abstracts physical inputs into named actions. Decouples game logic from specific devices.

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useInputMap, useKeyboard, useGamepad } from '@threlte/extras'

  const keyboard = useKeyboard()
  const gamepad = useGamepad()

  const input = useInputMap(
    ({ key, gamepadButton, gamepadAxis }) => ({
      jump: [key('Space'), gamepadButton('clusterBottom')],
      moveLeft: [key('a'), key('ArrowLeft'), gamepadAxis('leftStick', 'x', -1)],
      moveRight: [key('d'), key('ArrowRight'), gamepadAxis('leftStick', 'x', 1)],
      moveForward: [key('w'), key('ArrowUp'), gamepadAxis('leftStick', 'y', -1)],
      moveBack: [key('s'), key('ArrowDown'), gamepadAxis('leftStick', 'y', 1)],
      sprint: [key('Shift'), gamepadButton('leftBumper')]
    }),
    { keyboard, gamepad }
  )

  useTask(
    (delta) => {
      if (input.action('jump').justPressed) player.jump()
      const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
      player.velocity.x = move.x * speed
      player.velocity.z = move.y * speed
    },
    { after: input.task }
  )
</script>
```

### Reactive Definitions

Passing as a function allows runtime remapping:

```svelte
let jumpKey = $state('Space')
const input = useInputMap(
  ({ key }) => ({ jump: [key(jumpKey)] }),
  { keyboard }
)
// Later: jumpKey = 'j'
```

### Binding Helpers

| Helper | Description |
|---|---|
| `key('w')` | Key by `KeyboardEvent.key` (case-insensitive) |
| `gamepadButton('clusterBottom')` | Gamepad button |
| `gamepadAxis('leftStick', 'x', 1, threshold?)` | Stick axis with direction (default threshold 0.1) |

### Action State

```svelte
const jump = input.action('jump')
if (jump.justPressed) startJump()
if (jump.pressed) holdJump()
if (jump.justReleased) releaseJump()
```

| Property | Type | Description |
|---|---|---|
| `pressed` | `boolean` | Any binding is active |
| `justPressed` | `boolean` | First frame active |
| `justReleased` | `boolean` | First frame inactive |
| `strength` | `number` | Analog strength 0-1 |

### Axes and Vectors

```svelte
const horizontal = input.axis('moveLeft', 'moveRight')   // -1 to 1
const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
// move.x: -1 to 1, move.y: -1 to 1
// magnitude clamped to 1 (no faster diagonal movement)
```

### Active Device

```svelte
input.activeDevice.current // 'keyboard' | 'gamepad'
```

Reactive -- reflects the last device that provided input.

---

## `bvh`

Plugin that uses `three-mesh-bvh` to accelerate raycasting and enable spatial queries. Works with Mesh, BatchedMesh, and Points.

```svelte
<script lang="ts">
  import { bvh, interactivity, BVHSplitStrategy, type BVHOptions } from '@threlte/extras'

  const { raycaster } = interactivity()
  raycaster.firstHitOnly = true

  bvh(() => ({
    enabled: true,
    strategy: BVHSplitStrategy.SAH,
    indirect: false,
    verbose: false,
    maxDepth: 20,
    maxLeafTris: 10,
    setBoundingBox: true
  }))
</script>
```

### Per-object config

```svelte
<T.Mesh bvh={{ maxDepth: 10 }}>
  <T.TorusGeometry />
  <T.MeshStandardMaterial />
</T.Mesh>
```

### Options

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Enables BVH |
| `strategy` | `SAH` | `SAH`, `CENTER`, or `AVERAGE` |
| `indirect` | `false` | Indirect |
| `verbose` | `false` | Verbose logging |
| `maxDepth` | `20` | Maximum depth |
| `maxLeafTris` | `10` | Maximum triangles per leaf |
| `setBoundingBox` | `true` | Auto-set bounding box |

### Limitation

BVH does not recompute when geometry changes -- use `{#key}` to force recomputation:

```svelte
{#key geometry}
  <T.Mesh><T is={geometry} /><T.MeshStandardMaterial /></T.Mesh>
{/key}
```

### TypeScript

```typescript
import type { InteractivityProps, BVHProps } from '@threlte/extras'
declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps, BVHProps {}
  }
}
export {}
```

---

## `useTrailTexture()`

Hook that creates a canvas-based trail texture driven by pointer events.

```svelte
<script>
  import { interactivity, useTrailTexture } from '@threlte/extras'
  interactivity()

  const { texture, onPointerMove } = useTrailTexture(() => ({
    size: 512, radius: 0.3, maxAge: 750, intensity: 0.4
  }))
</script>

<T.Mesh onpointermove={onPointerMove}>
  <T.PlaneGeometry args={[3, 3, 128, 128]} />
  <T.MeshStandardMaterial displacementMap={texture} displacementScale={0.3} />
</T.Mesh>
```

Options: `size`, `maxAge`, `radius`, `intensity`, `interpolate`, `smoothing`, `minForce`, `blend`, `ease`. Returns `{ texture, onPointerMove, setTrail }`.
