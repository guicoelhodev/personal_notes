# Threlte Extras - Interaction Reference

Complete documentation from https://threlte.xyz/docs/reference/extras/ for all interaction-related modules.

---

# 1. interactivity

https://threlte.xyz/docs/reference/extras/interactivity

To add click, pointer and wheel events to your Threlte app use the `interactivity` plugin.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'
  interactivity()
</script>
```

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
</script>

<div>
  <Canvas>
    <Scene />
  </Canvas>
</div>

<style>
  div {
    height: 100%;
  }
</style>
```

**Show Code - Scene.svelte:**

```svelte
<script lang="ts">
  import type { Vector2Tuple } from 'three'
  import { Grid, interactivity, OrbitControls, useCursor } from '@threlte/extras'
  import { Spring } from 'svelte/motion'
  import { T } from '@threlte/core'

  interactivity()

  const boxPosition = new Spring<Vector2Tuple>([0, 0])
  const random = () => 10 * Math.random() - 5
  const scale = new Spring(1)
  const boxSize = 1
  const positionY = $derived(0.5 * boxSize * scale.current)

  const { onPointerEnter, onPointerLeave } = useCursor()

  const notHoveringColor = '#ffffff'
  const hoveringColor = '#fe3d00'
  let color = $state(notHoveringColor)
</script>

<T.OrthographicCamera
  zoom={40}
  position={10}
  makeDefault
>
  <OrbitControls enableZoom={false} />
</T.OrthographicCamera>

<T.AmbientLight intensity={0.4} />
<T.DirectionalLight position={[1, 2, 5]} />

<T.Mesh
  onclick={() => {
    boxPosition.target = [random(), random()]
  }}
  onpointerenter={() => {
    onPointerEnter()
    scale.target = 2
    color = hoveringColor
  }}
  onpointerleave={() => {
    onPointerLeave()
    scale.target = 1
    color = notHoveringColor
  }}
  scale={scale.current}
  position.x={boxPosition.current[0]}
  position.y={positionY}
  position.z={boxPosition.current[1]}
>
  <T.BoxGeometry args={[boxSize, boxSize, boxSize]} />
  <T.MeshStandardMaterial {color} />
</T.Mesh>

<Grid
  position.y={-1 * 0.5}
  cellColor="#ffffff"
  sectionColor="#ffffff"
  sectionThickness={0}
  fadeDistance={25}
  cellSize={2}
/>
```

All child components can now make use of the new events.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'
  interactivity()
</script>

<T.Mesh
  onclick={() => {
    console.log('clicked')
  }}
>
  <T.BoxGeometry />
  <T.MeshStandardMaterial color="red" />
</T.Mesh>
```

## Available events

The following interaction events are available:

```svelte
<T.Mesh
  onclick={(e) => console.log('click')}
  oncontextmenu={(e) => console.log('context menu')}
  ondblclick={(e) => console.log('double click')}
  onwheel={(e) => console.log('wheel')}
  onpointerup={(e) => console.log('up')}
  onpointerdown={(e) => console.log('down')}
  onpointerover={(e) => console.log('over')}
  onpointerout={(e) => console.log('out')}
  onpointerenter={(e) => console.log('enter')}
  onpointerleave={(e) => console.log('leave')}
  onpointermove={(e) => console.log('move')}
  onpointermissed={(e) => console.log('missed')}
/>
```

## Event data

All interaction events contain the following data:

```typescript
type Event = THREE.Intersection & {
  // Inherited from THREE.Intersection:
  object: THREE.Object3D // The object that was actually hit
  distance: number // Distance from the ray origin to the intersection
  point: THREE.Vector3 // The intersection point in world coordinates
  face: THREE.Face | null // The intersected face
  // ... and other THREE.Intersection properties (uv, normal, instanceId, etc.)

  // Added by interactivity:
  eventObject: THREE.Object3D // The object that registered the event
  intersections: Intersection[] // All intersections, including the eventObject that registered each handler
  camera: THREE.Camera // The camera used for raycasting
  delta: number // Distance in pixels between the pointerdown position and this event's position (0 for non-click events)
  nativeEvent: MouseEvent | PointerEvent | WheelEvent // The native browser event
  pointer: Vector2 // The pointer position in normalized device coordinates
  ray: THREE.Ray // The ray used for raycasting
  stopPropagation: () => void // Stops the event from being delivered to farther objects
  stopImmediatePropagation: () => void // Delegates to the native DOM event, blocking all further listeners (e.g. OrbitControls)
  stopped: boolean // Whether the event propagation has been stopped
}
```

## Event propagation

Propagation works a bit differently to the DOM because objects can occlude each other in 3D. The intersections array in the event data includes all objects intersecting the ray, not just the nearest. Only the first intersection with each object is included. The event is first delivered to the object nearest the camera, and then bubbles up through its ancestors like in the DOM. After that, it is delivered to the next nearest object, and then its ancestors, and so on. This means objects are transparent to pointer events by default, even if the object handles the event.

`event.stopPropagation()` doesn't just stop this event from bubbling up, it also stops it from being delivered to farther objects (objects behind this one). All other objects, nearer or farther, no longer count as being hit while the pointer is over this object. If they were previously delivered pointerover events, they will immediately be delivered pointerout events. If you want an object to block pointer events from objects behind it, it needs to have an event handler as follows:

```svelte
<T.Mesh onclick={(e) => e.stopPropagation()} />
```

even if you don't want this object to respond to the pointer event. If you do want to handle the event as well as using `stopPropagation()`, remember that the `pointerout` events will happen during the `stopPropagation()` call. You probably want your other event handling to happen after this.

## Touch interactions

On touch devices, the browser may cancel `pointermove` events mid-gesture when it decides to use the touch for its own navigation (scrolling, pinch-zoom, swipe-back, etc.). This is controlled by the CSS [`touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) property. When the browser takes over a touch, it fires a [`pointercancel`](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event) event and stops delivering `pointermove` updates — meaning `onpointermove` handlers on your 3D objects will stop receiving events during touch-and-drag interactions.

If your canvas is the primary interaction surface (e.g. a fullscreen 3D experience or a dedicated viewport), you can fix this by setting `touch-action: none` on a parent element wrapping the `<Canvas>` component. This tells the browser not to intercept any touch gestures, ensuring pointer events fire reliably throughout the entire interaction.

App.svelte

```svelte
<div style="touch-action: none;">
  <Canvas>
    <Scene />
  </Canvas>
</div>
```

Only use `touch-action: none` when the canvas is the primary interaction surface. For canvases embedded in scrollable pages, this will prevent users from scrolling past the canvas with touch. In that case, consider more targeted values like `touch-action: pan-y` (allows vertical scrolling but captures horizontal gestures) or handle the trade-off in your application logic.

## Event targets

If no event target is specified, all event handlers listen to events on the `domElement` of the `renderer` (which is the canvas element by default). You can specify a different target by passing a `target` prop to the `interactivity` plugin.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'

  interactivity({
    target: document
  })
</script>
```

It's also possible to change the target at runtime by updating the store `target` returned from the `interactivity` plugin.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'

  const { target } = interactivity()

  $effect(() => {
    target.set(document)
  })
</script>
```

## Compute function

In the event that your event target is not the same size as the canvas, you can pass a `compute` function to the `interactivity` plugin. This function receives the DOM event and the interactivity state and should set the `pointer` property of the state to the pointer position in normalized device coordinates as well as set the raycaster up for raycasting.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'
  import { useThrelte } from '@threlte/core'

  const { camera } = useThrelte()

  interactivity({
    compute: (event, state) => {
      // Update the pointer
      state.pointer.update((p) => {
        p.x = (event.clientX / window.innerWidth) * 2 - 1
        p.y = -(event.clientY / window.innerHeight) * 2 + 1

        return p
      })

      // Update the raycaster
      state.raycaster.setFromCamera(state.pointer.current, $camera)
    }
  })
</script>
```

## Event filtering

You can filter and sort events by passing a `filter` to the `interactivity` plugin. The function receives all hits and the interactivity state and should return the hits that should be delivered to the event handlers in the order they should be delivered.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'

  interactivity({
    filter: (hits, state) => {
      // Only return the first hit
      return hits.slice(0, 1)
    }
  })
</script>
```

## Interactivity state

To access the interactivity state, you can use the `useInteractivity` hook in any child component of the component that implements the `interactivity` plugin as follows:

Child.svelte

```svelte
<script>
  import { useInteractivity } from '@threlte/extras'

  const { pointer, pointerOverTarget } = useInteractivity()

  $inspect($pointer, $pointerOverTarget)
</script>
```

where this is the type of the interactivity state:

```typescript
export type State = {
  enabled: CurrentWritable<boolean>
  target: CurrentWritable<HTMLElement | undefined>
  pointer: CurrentWritable<Vector2>
  pointerOverTarget: CurrentWritable<boolean>
  lastEvent: MouseEvent | WheelEvent | PointerEvent | undefined
  raycaster: Raycaster
  initialClick: [x: number, y: number]
  initialHits: THREE.Object3D[]
  hovered: Map<string, IntersectionEvent<MouseEvent | WheelEvent | PointerEvent>>
  interactiveObjects: THREE.Object3D[]
  compute: ComputeFunction
  filter?: FilterFunction
  clickDistanceThreshold: number
  clickTimeThreshold: number
}
```

`CurrentWritable` is a custom Threlte store. It's a regular writable store that also has a `current` property which is the current value of the store. It's useful for accessing the value of a store in a non-reactive context, such as in loops.

## TypeScript

### Prop types

By default, the `interactivity` plugin does not add any prop types to the `<T>` component. You can however extend the types of the `<T>` component by defining the `Threlte.UserProps` type in your ambient type definitions. In a typical SvelteKit application, you can find these in `src/app.d.ts`. The interactivity plugin exports the `InteractivityProps` type which you can use as shown below:

src/app.d.ts

```typescript
import type { InteractivityProps } from '@threlte/extras'

declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps {}
  }
}

export {}
```

Now all event handlers on `<T>` components will be type safe.

Scene.svelte

```svelte
<script>
  import { interactivity } from '@threlte/extras'
  interactivity()
</script>

<T.Mesh
  onclick={(e) => {
    // e: IntersectionEvent<MouseEvent>
  }}
/>
```

---

# 2. <OrbitControls>

https://threlte.xyz/docs/reference/extras/orbit-controls

`<OrbitControls>` allow the camera to orbit around a target while ensuring a fixed camera up vector. If the camera orbits over the "north" or "south" poles, the camera experiences a "gimbal lock" that forces the scene to rotate until it is rightside up. This type of camera control is commonly used for showing off 3D models of products because it prevents them from ever appearing upside down. For an alternative camera controller, see `<TrackballControls>`.

If placed as a child of a camera component, `<OrbitControls>` will attach to that camera. Otherwise, it attaches to the scene's default camera. A camera can also be passed explicitly via the `camera` prop.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'

  import Scene from './Scene.svelte'
  import Settings from './Settings.svelte'

  let autoRotate = $state(false)
  let enableDamping = $state(true)
  let rotateSpeed = $state(1)
  let zoomToCursor = $state(false)
  let zoomSpeed = $state(1)
  let minPolarAngle = $state(0)
  let maxPolarAngle = $state(Math.PI)
  let enableZoom = $state(true)
</script>

<div>
  <Canvas>
    <Scene
      {enableDamping}
      {autoRotate}
      {rotateSpeed}
      {zoomToCursor}
      {zoomSpeed}
      {minPolarAngle}
      {maxPolarAngle}
      {enableZoom}
    />
  </Canvas>
</div>

<Settings
  bind:enableDamping
  bind:autoRotate
  bind:rotateSpeed
  bind:zoomToCursor
  bind:zoomSpeed
  bind:minPolarAngle
  bind:maxPolarAngle
  bind:enableZoom
/>

<style>
  div {
    position: relative;
    height: 100%;
    width: 100%;
    background-color: rgb(14, 22, 37);
  }
</style>
```

**Show Code - Scene.svelte:**

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { Gizmo, OrbitControls } from '@threlte/extras'

  interface Props {
    autoRotate: boolean
    enableDamping: boolean
    rotateSpeed: number
    zoomToCursor: boolean
    zoomSpeed: number
    minPolarAngle: number
    maxPolarAngle: number
    enableZoom: boolean
  }

  let {
    autoRotate,
    enableDamping,
    rotateSpeed,
    zoomToCursor,
    zoomSpeed,
    minPolarAngle,
    maxPolarAngle,
    enableZoom
  }: Props = $props()
</script>

<T.PerspectiveCamera
  makeDefault
  position={[10, 5, 10]}
  lookAt.y={0.5}
>
  <OrbitControls
    {enableDamping}
    {autoRotate}
    {rotateSpeed}
    {zoomToCursor}
    {zoomSpeed}
    {minPolarAngle}
    {maxPolarAngle}
    {enableZoom}
  >
    <Gizmo />
  </OrbitControls>
</T.PerspectiveCamera>

<T.DirectionalLight
  position.y={10}
  position.z={10}
/>
<T.AmbientLight intensity={0.3} />

<T.GridHelper args={[10, 10]} />

<T.Mesh position.y={1}>
  <T.BoxGeometry args={[2, 2, 2]} />
  <T.MeshStandardMaterial />
</T.Mesh>
```

**Show Code - Settings.svelte:**

```svelte
<script lang="ts">
  import { Checkbox, Pane, ThemeUtils, Slider } from 'svelte-tweakpane-ui'

  interface Props {
    autoRotate: boolean
    enableDamping: boolean
    rotateSpeed: number
    zoomToCursor: boolean
    zoomSpeed: number
    minPolarAngle: number
    maxPolarAngle: number
    enableZoom: boolean
  }

  let {
    autoRotate = $bindable(),
    enableDamping = $bindable(),
    rotateSpeed = $bindable(),
    zoomToCursor = $bindable(),
    zoomSpeed = $bindable(),
    minPolarAngle = $bindable(),
    maxPolarAngle = $bindable(),
    enableZoom = $bindable()
  }: Props = $props()
</script>

<Pane
  theme={ThemeUtils.presets.light}
  position="fixed"
  title="OrbitControls"
>
  <Checkbox
    bind:value={autoRotate}
    label="autoRotate"
  />
  <Checkbox
    bind:value={enableDamping}
    label="enableDamping"
  />
  <Checkbox
    bind:value={enableZoom}
    label="enableZoom"
  />
  <Checkbox
    bind:value={zoomToCursor}
    label="zoomToCursor"
  />
  <Slider
    label="rotateSpeed"
    bind:value={rotateSpeed}
    min={0.1}
    max={2}
    step={0.1}
  />
  <Slider
    label="zoomSpeed"
    bind:value={zoomSpeed}
    min={0.1}
    max={2}
    step={0.1}
  />
  <Slider
    label="minPolarAngle"
    bind:value={minPolarAngle}
    min={0}
    max={Math.PI}
    step={0.1}
  />
  <Slider
    label="maxPolarAngle"
    bind:value={maxPolarAngle}
    min={0}
    max={Math.PI}
    step={0.1}
  />
</Pane>
```

This example shows off just a few of the configurable properties of `<OrbitControls>`. To see all 30+ properties, consult the [Three.js docs](https://threejs.org/docs/#examples/en/controls/OrbitControls).

## Usage

```svelte
<script>
  import { OrbitControls } from '@threlte/extras'
  import { T } from '@threlte/core'
</script>

<T.PerspectiveCamera
  makeDefault
  fov={50}
>
  <OrbitControls enableDamping />
</T.PerspectiveCamera>
```

`<OrbitControls>` is a light wrapper that will use its parent as the target camera (or the default camera if not a child of one) and the DOM element the renderer is rendering to as the DOM element to listen to pointer events.

## Component Signature

`<OrbitControls>` extends `< T . OrbitControls >` and supports all its props, snippets, bindings and events.

### Props

| name | type | required |
| --- | --- | --- |
| camera | `THREE.Camera` | no |

---

# 3. <CameraControls>

https://threlte.xyz/docs/reference/extras/camera-controls

This component is a declarative implementation of the popular [camera-controls](https://github.com/yomotsu/camera-controls) library.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import Scene from './Scene.svelte'
  import { Button, Checkbox, Pane, Separator } from 'svelte-tweakpane-ui'
  import { Canvas } from '@threlte/core'
  import type { CameraControlsRef } from '@threlte/extras'
  import { type Mesh, MathUtils } from 'three'

  let controls = $state.raw<CameraControlsRef>()
  let mesh = $state.raw<Mesh>()

  /**
   * controls.enabled can not be bound to since its not reactive
   */
  let enabled = $state(true)
  $effect(() => {
    if (controls !== undefined) {
      controls.enabled = enabled
    }
  })
</script>

<Pane
  title="Camera Controls"
  position="fixed"
>
  <Button
    title="rotate theta 45deg"
    on:click={() => {
      controls?.rotate(45 * MathUtils.DEG2RAD, 0, true)
    }}
  />
  <Button
    title="rotate theta -90deg"
    on:click={() => {
      controls?.rotate(-90 * MathUtils.DEG2RAD, 0, true)
    }}
  />
  <Button
    title="rotate theta 360deg"
    on:click={() => {
      controls?.rotate(360 * MathUtils.DEG2RAD, 0, true)
    }}
  />
  <Button
    title="rotate phi 20deg"
    on:click={() => {
      controls?.rotate(0, 20 * MathUtils.DEG2RAD, true)
    }}
  />
  <Separator />
  <Button
    title="truck(1, 0)"
    on:click={() => {
      controls?.truck(1, 0, true)
    }}
  />
  <Button
    title="truck(0, 1)"
    on:click={() => {
      controls?.truck(0, 1, true)
    }}
  />
  <Button
    title="truck(-1, -1)"
    on:click={() => {
      controls?.truck(-1, -1, true)
    }}
  />
  <Separator />
  <Button
    title="dolly 1"
    on:click={() => {
      controls?.dolly(1, true)
    }}
  />
  <Button
    title="dolly -1"
    on:click={() => {
      controls?.dolly(-1, true)
    }}
  />
  <Separator />
  <Button
    title="zoom `camera.zoom / 2`"
    on:click={() => {
      controls?.zoom(controls.camera.zoom / 2, true)
    }}
  />
  <Button
    title="zoom `- camera.zoom / 2`"
    on:click={() => {
      controls?.zoom(-controls.camera.zoom / 2, true)
    }}
  />
  <Separator />
  <Button
    title="move to ( 3, 5, 2)"
    on:click={() => {
      controls?.moveTo(3, 5, 2, true)
    }}
  />
  <Button
    title="fit to the bounding box of the mesh"
    on:click={() => {
      if (mesh !== undefined) {
        controls?.fitToBox(mesh, true)
      }
    }}
  />
  <Separator />
  <Button
    title="set position to ( -5, 2, 1 )"
    on:click={() => {
      controls?.setPosition(-5, 2, 1, true)
    }}
  />
  <Button
    title="look at ( 3, 0, -3 )"
    on:click={() => {
      controls?.setTarget(3, 0, -3, true)
    }}
  />
  <Button
    title="move to ( 1, 2, 3 ), look at ( 1, 1, 0 )"
    on:click={() => {
      controls?.setLookAt(1, 2, 3, 1, 1, 0, true)
    }}
  />
  <Separator />
  <Button
    title="move to somewhere between ( -2, 0, 0 ) -> ( 1, 1, 0 ) and ( 0, 2, 5 ) -> ( -1, 0, 0 )"
    on:click={() => {
      controls?.lerpLookAt(-2, 0, 0, 1, 1, 0, 0, 2, 5, -1, 0, 0, Math.random(), true)
    }}
  />
  <Separator />
  <Button
    title="reset"
    on:click={() => {
      controls?.reset(true)
    }}
  />
  <Button
    title="saveState"
    on:click={() => {
      controls?.saveState()
    }}
  />
  <Separator />
  <Checkbox
    bind:value={enabled}
    label="enabled"
  />
</Pane>

<Canvas>
  <Scene
    bind:controls
    bind:mesh
  />
</Canvas>
```

**Show Code - Scene.svelte:**

```svelte
<script lang="ts">
  import { Mesh } from 'three'
  import { T } from '@threlte/core'
  import { Grid, CameraControls, type CameraControlsRef } from '@threlte/extras'

  let {
    controls = $bindable(),
    mesh = $bindable()
  }: {
    controls?: CameraControlsRef
    mesh?: Mesh
  } = $props()
</script>

<CameraControls
  bind:ref={controls}
  oncreate={(ref) => {
    ref.setPosition(5, 5, 5)
  }}
/>

<T.Mesh
  bind:ref={mesh}
  position.y={0.5}
>
  <T.BoxGeometry />
  <T.MeshBasicMaterial
    color="#ff3e00"
    wireframe
  />
</T.Mesh>

<Grid
  sectionColor="#ff3e00"
  sectionThickness={1}
  cellColor="#cccccc"
  gridSize={40}
/>
```

If the controls are set as a child component of a camera, they will attach to that camera.

```svelte
<T.PerspectiveCamera makeDefault>
  <CameraControls />
</T.PerspectiveCamera>
```

A camera can also optionally be passed to the controls as a prop.

```svelte
<CameraControls camera={myPerspectiveCamera} />
```

Finally, if the component is created without an attached camera it will use the scene's default camera as provided by `useThrelte`.

## Examples

### Basic Example

CameraControls.svelte

```svelte
<script lang="ts">
  import { CameraControls, type CameraControlsRef } from '@threlte/extras'

  let controls = $state<CameraControlsRef>()

  $effect.pre(() => {
    controls?.truck(1, 0, true)
  })
</script>

<CameraControls
  bind:ref={controls}
  oncreate={(ref) => ref.setPosition(5, 5, 5)}
/>
```

### Prevent SSR Externalization

If you are using SvelteKit or Vite for building your app, you may need to externalize the `camera-controls` library.

To externalize the `camera-controls` library put the following in your `vite.config.js` or `vite.config.ts`.

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ['camera-controls']
  }
})
```

The camera-controls package features include first-person, third-person, pointer-lock, fit-to-bounding-sphere and much more!

## Component Signature

### Props

| name | type | required |
| --- | --- | --- |
| camera | `THREE.Camera` | no |

---

# 4. <TransformControls>

https://threlte.xyz/docs/reference/extras/transform-controls

This component can be used to transform objects in 3D space by adapting a similar interaction model of DCC tools like Blender. Unlike other controls, it is not intended to transform the scene's camera.

The component `<TransformControls>` needs to be the parent of the component to be transformed.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'

  import Scene from './Scene.svelte'
  import Settings from './Settings.svelte'

  let controls = $state<'<OrbitControls>' | '<TrackballControls>' | '<CameraControls>'>(
    '<OrbitControls>'
  )
  let autoPauseControls = $state(true)
</script>

<div>
  <Canvas>
    <Scene
      {controls}
      {autoPauseControls}
    />
  </Canvas>
</div>

<Settings
  bind:controls
  bind:autoPauseControls
/>

<style>
  div {
    position: relative;
    height: 100%;
    width: 100%;
    background-color: rgb(14, 22, 37);
  }
</style>
```

**Show Code - Scene.svelte:**

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import {
    CameraControls,
    OrbitControls,
    TrackballControls,
    TransformControls
  } from '@threlte/extras'
  import { PerspectiveCamera } from 'three'

  interface Props {
    controls?: '<OrbitControls>' | '<TrackballControls>' | '<CameraControls>'
    autoPauseControls?: boolean
  }

  let { controls = '<OrbitControls>', autoPauseControls = true }: Props = $props()

  let camera = $state.raw<PerspectiveCamera>()
</script>

{#key controls}
  <T.PerspectiveCamera
    makeDefault
    position={[10, 5, 10]}
    bind:ref={camera}
  >
    {#if controls === '<TrackballControls>'}
      <TrackballControls />
    {:else if controls === '<OrbitControls>'}
      <OrbitControls />
    {:else if controls === '<CameraControls>'}
      <CameraControls />
    {/if}
  </T.PerspectiveCamera>
{/key}

<T.DirectionalLight
  position.y={10}
  position.z={10}
/>
<T.AmbientLight intensity={0.3} />

<T.GridHelper args={[10, 10]} />

<TransformControls
  {autoPauseControls}
  translationSnap={1}
  position.y={1}
>
  <T.Mesh>
    <T.BoxGeometry args={[2, 2, 2]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</TransformControls>
```

**Show Code - Settings.svelte:**

```svelte
<script lang="ts">
  import { Pane, List, Checkbox, ThemeUtils } from 'svelte-tweakpane-ui'

  interface Props {
    controls?: '<OrbitControls>' | '<TrackballControls>' | '<CameraControls>'
    autoPauseControls?: boolean
  }

  let { controls = $bindable('<OrbitControls>'), autoPauseControls = $bindable(true) }: Props =
    $props()
</script>

<Pane
  theme={ThemeUtils.presets.light}
  position="fixed"
  title="TransformControls"
>
  <List
    label="Camera Controls"
    bind:value={controls}
    options={{
      '<OrbitControls>': '<OrbitControls>',
      '<TrackballControls>': '<TrackballControls>',
      '<CameraControls>': '<CameraControls>'
    }}
  />
  <Checkbox
    label="autoPauseControls"
    bind:value={autoPauseControls}
  />
</Pane>
```

## Camera Controls

When using camera controls alongside `<TransformControls>`, dragging a transform gizmo would also move the camera. To prevent this, `<TransformControls>` automatically pauses any registered camera controls while dragging.

The following controls are handled automatically (no extra setup needed):

- `<OrbitControls>`
- `<TrackballControls>`
- `<CameraControls>`

You can disable this with `autoPauseControls={false}`.

### Third-party controls

For custom or third-party controls, pass them via the `cameraControls` prop. Any object with an `enabled` property works:

```svelte
<script>
  import { TransformControls } from '@threlte/extras'
  import { MyCustomControls } from './MyCustomControls'

  let customControls = $state()
</script>

<MyCustomControls bind:ref={customControls} />

<TransformControls cameraControls={customControls}>
  <T.Mesh>
    <T.BoxGeometry />
    <T.MeshStandardMaterial />
  </T.Mesh>
</TransformControls>
```

## Examples

### Basic usage

Scene.svelte

```svelte
<script>
  import { T } from '@threlte/core'
  import { TransformControls } from '@threlte/extras'
  import { MeshStandardMaterial, BoxGeometry } from 'three'
</script>

<TransformControls>
  <T.Mesh
    geometry={new BoxGeometry()}
    material={new MeshStandardMaterial()}
  />
</TransformControls>
```

### Transforming an external object

The `<TransformControls>` component can also transform an object passed to it:

Scene.svelte

```svelte
<script>
  import { T } from '@threlte/core'
  import { TransformControls } from '@threlte/extras'
  import { MeshStandardMaterial, BoxGeometry } from 'three'
</script>

<T.Mesh
  geometry={new BoxGeometry()}
  material={new MeshStandardMaterial()}
>
  {#snippet children({ ref })}
    <TransformControls object={ref} />
  {/snippet}
</T.Mesh>

<TransformControls object={someObject} />
```

## Component Signature

The component `<TransformControls>` extends both `<T.TransformControls>` and `<T.Group>`. You may pass any property of either of these components to the component `<TransformControls>`.

### Props

| name | type | required | default |
| --- | --- | --- | --- |
| autoPauseControls | `boolean` | no | `true` |
| cameraControls | `{ enabled: boolean }` | no | |
| object | `THREE.Object3D` | no | |

### Bindings

| name | type |
| --- | --- |
| controls | `THREE.TransformControls` |
| group | `THREE.Group` |

---

# 5. <Gizmo>

https://threlte.xyz/docs/reference/extras/gizmo

A gizmo for snap-to camera controls.

Uses the [Three Viewport Gizmo library](https://fennec-hub.github.io/three-viewport-gizmo/).

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import type { Vector3Tuple } from 'three'
  import { Canvas, T } from '@threlte/core'
  import { Gizmo, type GizmoOptions, OrbitControls } from '@threlte/extras'
  import { Folder, List, Pane, Slider, ThemeUtils } from 'svelte-tweakpane-ui'
  import Scene from './Scene.svelte'

  let type = $state<'sphere' | 'cube' | undefined>('sphere')
  let speed = $state(1)
  let placement = $state<GizmoOptions['placement']>('bottom-left')
  let size = $state(86)
  let left = $state(10)
  let top = $state(10)
  let right = $state(10)
  let bottom = $state(10)
  let center = $state<Vector3Tuple>([0, 0, 0])
</script>

<Pane
  theme={ThemeUtils.presets.light}
  position="fixed"
  title="Gizmo"
>
  <List
    label="type"
    bind:value={type}
    options={{
      sphere: 'sphere',
      cube: 'cube'
    }}
  />
  <Slider
    label="speed"
    bind:value={speed}
    min={0.1}
    max={1}
  />
  <List
    label="placement"
    bind:value={placement}
    options={[
      'top-left',
      'top-center',
      'top-right',
      'center-left',
      'center-center',
      'center-right',
      'bottom-left',
      'bottom-center',
      'bottom-right'
    ]}
  />
  <Slider
    label="size"
    bind:value={size}
    min={20}
    max={350}
    step={1}
  />

  <Folder
    title="offset"
    expanded={false}
  >
    <Slider
      label="top"
      bind:value={top}
      min={0}
      max={50}
      step={1}
    />
    <Slider
      label="left"
      bind:value={left}
      min={0}
      max={50}
      step={1}
    />
    <Slider
      label="right"
      bind:value={right}
      min={0}
      max={50}
      step={1}
    />
    <Slider
      label="bottom"
      bind:value={bottom}
      min={0}
      max={50}
      step={1}
    />
  </Folder>
</Pane>

<div>
  <Canvas>
    <T.PerspectiveCamera
      makeDefault
      position={[20, 20, 20]}
      fov={36}
      target={[0, 0, 0]}
    >
      <OrbitControls
        onchange={(event) => {
          center = event.target.target.toArray()
        }}
      >
        <Gizmo
          {type}
          {speed}
          {placement}
          {size}
          offset={{
            top,
            left,
            bottom,
            right
          }}
        />
      </OrbitControls>
    </T.PerspectiveCamera>

    <Scene {center} />
  </Canvas>
</div>

<style>
  div {
    position: relative;
    height: 100%;
    width: 100%;
    background-color: rgb(14, 22, 37);
  }
</style>
```

**Show Code - Scene.svelte:**

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { Grid } from '@threlte/extras'
  import { BufferAttribute } from 'three'

  type Props = {
    center: [number, number, number]
  }

  let { center }: Props = $props()

  const red = [1, 0, 0]
  const green = [0, 1, 0]
  const blue = [0, 0, 1]

  const colors = new Float32Array([
    ...red,
    ...red,
    ...red,
    ...red,
    ...red,
    ...red,
    ...red,
    ...red,
    ...green,
    ...green,
    ...green,
    ...green,
    ...green,
    ...green,
    ...green,
    ...green,
    ...blue,
    ...blue,
    ...blue,
    ...blue,
    ...blue,
    ...blue,
    ...blue,
    ...blue
  ])
</script>

<T.AxesHelper
  args={[5]}
  renderOrder={1}
/>

<Grid
  sectionSize={0}
  cellColor="#eee"
/>

<T.Mesh position={center}>
  <T.BoxGeometry
    oncreate={(ref) => {
      ref.setAttribute('color', new BufferAttribute(colors, 3))
    }}
  />
  <T.MeshBasicMaterial vertexColors />
</T.Mesh>
```

Three's `OrbitControls` or yomotsu's `CameraControls` can be provided as a `controls` prop.

Alternatively, the `<Gizmo>` can be placed as a child of a controls component.

```svelte
<OrbitControls>
  <!-- Will attach itself to this OrbitControls -->
  <Gizmo />
</OrbitControls>
```

In addition to the props listed below, `<Gizmo>` can accept [any of the options](https://fennec-hub.github.io/three-viewport-gizmo/api.html#gizmooptions) from the underlying Three Viewport Gizmo instance as a prop.

These props cause the gizmo to rebuild itself, so update them sparingly.

## Component Signature

### Props

| name | type | required | description |
| --- | --- | --- | --- |
| controls | `OrbitControls \| CameraControls` | no | |
| renderTask | `TaskOptions` | no | Options for the task to render the gizmo scene in the viewport. By default, this happens after the `autoRenderTask`. |

### Events

| name | payload | description |
| --- | --- | --- |
| start | `Event<'start', ViewportGizmo>` | Triggered when a view change interaction begins. |
| change | `Event<'change', ViewportGizmo>` | Triggered during view changes. |
| end | `Event<'end', ViewportGizmo>` | Triggered when a view change interaction ends. |

---

# 6. useCursor

https://threlte.xyz/docs/reference/extras/use-cursor

A hook that sets the css cursor property according to the hover state of a mesh, so that you can give the user visual feedback.

If a context is present, the cursor property will be set on the DOM element of the renderer, otherwise it will be set on the body element.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
</script>

<div>
  <Canvas>
    <Scene />
  </Canvas>
</div>

<style>
  div {
    height: 100%;
  }
</style>
```

**Show Code - Scene.svelte:**

```svelte
<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { interactivity, Text, useCursor } from '@threlte/extras'
  import { DEG2RAD } from 'three/src/math/MathUtils.js'

  const { hovering, onPointerEnter, onPointerLeave } = useCursor()

  interactivity()

  const { size } = useThrelte()

  const color = $derived($hovering ? '#dddddd' : '#FE3D00')
  const zoom = $derived($size.width / 7)
</script>

<T.OrthographicCamera
  {zoom}
  position={[5, 5, 5]}
  oncreate={(ref) => {
    ref.lookAt(0, 0, 0)
  }}
  makeDefault
/>

<T.DirectionalLight
  position.y={10}
  position.x={5}
/>
<T.AmbientLight intensity={0.2} />

<Text
  text="HOVER"
  interactive
  onpointerenter={onPointerEnter}
  onpointerleave={onPointerLeave}
  fontSize={0.5}
  anchorY="100%"
  anchorX="50%"
  rotation.y={90 * DEG2RAD}
  position.y={1}
  position.x={-1}
  {color}
/>

<T.Mesh
  onpointerenter={onPointerEnter}
  onpointerleave={onPointerLeave}
>
  <T.MeshStandardMaterial {color} />
  <T.BoxGeometry args={[2, 2, 2]} />
</T.Mesh>
```

## Examples

### Simple Usage

Provide arguments to determine the cursor style. The defaults are `'pointer'` for `onPointerOver` and `'auto'` for `onPointerOut`. `useCursor` returns event handlers that you can use to set the hovering state:

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { BoxGeometry, MeshBasicMaterial } from 'three'

  // Set the cursor to 'grab' if the pointer is
  // hovering over the mesh and to 'crosshair'
  // if the pointer is outside the mesh
  const { onPointerEnter, onPointerLeave } = useCursor('grab', 'crosshair')
</script>

<T.Mesh
  onpointerenter={onPointerEnter}
  geometry={new BoxGeometry()}
  material={new MeshBasicMaterial()}
/>
```

### Renaming Event Handlers

You can rename the event handlers to resolve naming conflicts. Additionally Svelte allows binding multiple event handlers to the same event:

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { BoxGeometry, MeshBasicMaterial } from 'three'

  const { onPointerEnter: cursorEnter, onPointerLeave: cursorLeave } = useCursor()

  const onPointerEnter = () => {
    console.log('Pointer entered!')
  }
  const onPointerLeave = () => {
    console.log('Pointer left!')
  }
</script>

<T.Mesh
  onpointerenter={cursorEnter}
  onpointerenter={onPointerEnter}
  geometry={new BoxGeometry()}
  material={new MeshBasicMaterial()}
/>
```

### Store Usage

If you want to implement custom logic, you can use the returned svelte store to set the hovering state:

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { BoxGeometry, MeshBasicMaterial } from 'three'

  const { hovering } = useCursor()
</script>

<T.Mesh
  onpointerenter={() => ($hovering = true)}
  onpointerleave={() => ($hovering = false)}
  geometry={new BoxGeometry()}
  material={new MeshBasicMaterial()}
/>
```

### Change the Cursor Style

Provide svelte stores to change the cursor style also while hovering:

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { BoxGeometry, MeshBasicMaterial } from 'three'
  import { writable } from 'svelte/store'

  const onPointerOverCursor = writable('grab')

  const { onPointerEnter, onPointerLeave } = useCursor(onPointerOverCursor)

  // somewhere in your application …
  onPointerOverCursor.set('grabbing')
</script>

<T.Mesh
  onpointerenter={onPointerEnter}
  geometry={new BoxGeometry()}
  material={new MeshBasicMaterial()}
/>
```

---

# 7. useKeyboard

https://threlte.xyz/docs/reference/extras/use-keyboard

`useKeyboard` provides frame-accurate keyboard state tracking for game-style input. Key presses that happen between frames are collected and applied together at the start of each frame, giving you reliable `justPressed` and `justReleased` states that last exactly one frame — just like `Input.is_action_just_pressed()` in Godot.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
</script>

<div>
  <Canvas>
    <Scene />
  </Canvas>
</div>

<style>
  div {
    height: 100%;
  }
</style>
```

**Show Code - Scene.svelte (full interactive keyboard visualization):**

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { Edges, HTML, Text, useKeyboard } from '@threlte/extras'
  import { fade } from 'svelte/transition'
  import { Spring } from 'svelte/motion'

  const keyboard = useKeyboard()

  const w = keyboard.key('w')
  const a = keyboard.key('a')
  const s = keyboard.key('s')
  const d = keyboard.key('d')
  const space = keyboard.key('Space')

  const trackedKeys = [
    { key: w, label: 'W' },
    { key: a, label: 'A' },
    { key: s, label: 'S' },
    { key: d, label: 'D' },
    { key: space, label: 'Space' }
  ] as const

  const activeColor = '#ff3e00'
  const inactiveColor = '#1a1a1a'
  const activeTextColor = 'white'
  const inactiveTextColor = '#aaaaaa'
  const edgeColor = 'rgba(255, 255, 255, 0.2)'
  const activeEdgeColor = '#ff3e00'

  const dep = -0.1
  const springOpts = { stiffness: 0.3, damping: 0.6 }

  const wZ = Spring.of(() => (w.pressed ? dep : 0), springOpts)
  const aZ = Spring.of(() => (a.pressed ? dep : 0), springOpts)
  const sZ = Spring.of(() => (s.pressed ? dep : 0), springOpts)
  const dZ = Spring.of(() => (d.pressed ? dep : 0), springOpts)
  const spaceZ = Spring.of(() => (space.pressed ? dep : 0), springOpts)
</script>

<T.OrthographicCamera
  zoom={90}
  position={[5, 5, 8]}
  makeDefault
  oncreate={(ref) => {
    ref.lookAt(0, 0, 0)
  }}
/>

<T.AmbientLight intensity={0.6} />
<T.DirectionalLight
  position={[5, 5, 5]}
  intensity={0.8}
/>

<!-- W key -->
<T.Group
  position.x={0}
  position.y={1.15}
  position.z={wZ.current}
>
  <T.Mesh scale.y={0.9}>
    <T.BoxGeometry args={[1, 1, 0.3]} />
    <T.MeshStandardMaterial color={w.pressed ? activeColor : inactiveColor} />
    <Edges color={w.pressed ? activeEdgeColor : edgeColor} />
  </T.Mesh>
  <Text
    text="W"
    fontSize={0.4}
    color={w.pressed ? activeTextColor : inactiveTextColor}
    anchorX="center"
    anchorY="middle"
    position.z={0.16}
  />
</T.Group>

<!-- A key -->
<T.Group
  position.x={-1.1}
  position.y={0}
  position.z={aZ.current}
>
  <T.Mesh scale.y={0.9}>
    <T.BoxGeometry args={[1, 1, 0.3]} />
    <T.MeshStandardMaterial color={a.pressed ? activeColor : inactiveColor} />
    <Edges color={a.pressed ? activeEdgeColor : edgeColor} />
  </T.Mesh>
  <Text
    text="A"
    fontSize={0.4}
    color={a.pressed ? activeTextColor : inactiveTextColor}
    anchorX="center"
    anchorY="middle"
    position.z={0.16}
  />
</T.Group>

<!-- S key -->
<T.Group
  position.x={0}
  position.y={0}
  position.z={sZ.current}
>
  <T.Mesh scale.y={0.9}>
    <T.BoxGeometry args={[1, 1, 0.3]} />
    <T.MeshStandardMaterial color={s.pressed ? activeColor : inactiveColor} />
    <Edges color={s.pressed ? activeEdgeColor : edgeColor} />
  </T.Mesh>
  <Text
    text="S"
    fontSize={0.4}
    color={s.pressed ? activeTextColor : inactiveTextColor}
    anchorX="center"
    anchorY="middle"
    position.z={0.16}
  />
</T.Group>

<!-- D key -->
<T.Group
  position.x={1.1}
  position.y={0}
  position.z={dZ.current}
>
  <T.Mesh scale.y={0.9}>
    <T.BoxGeometry args={[1, 1, 0.3]} />
    <T.MeshStandardMaterial color={d.pressed ? activeColor : inactiveColor} />
    <Edges color={d.pressed ? activeEdgeColor : edgeColor} />
  </T.Mesh>
  <Text
    text="D"
    fontSize={0.4}
    color={d.pressed ? activeTextColor : inactiveTextColor}
    anchorX="center"
    anchorY="middle"
    position.z={0.16}
  />
</T.Group>

<!-- Space key -->
<T.Group
  position.x={0}
  position.y={-1.15}
  position.z={spaceZ.current}
>
  <T.Mesh scale.y={0.9}>
    <T.BoxGeometry args={[3.2, 1, 0.3]} />
    <T.MeshStandardMaterial color={space.pressed ? activeColor : inactiveColor} />
    <Edges color={space.pressed ? activeEdgeColor : edgeColor} />
  </T.Mesh>
  <Text
    text="Space"
    fontSize={0.35}
    color={space.pressed ? activeTextColor : inactiveTextColor}
    anchorX="center"
    anchorY="middle"
    position.z={0.16}
  />
</T.Group>

<!-- Hint text -->
<Text
  text="Press WASD or Space"
  fontSize={0.25}
  color="#666666"
  anchorX="center"
  anchorY="middle"
  position={[0, 2.4, 0]}
/>

<!-- Badge area using HTML for transitions -->
<T.Group position={[0, -2.4, 0]}>
  <HTML
    center
    transform={false}
  >
    <div class="states">
      {#each trackedKeys as { key, label }}
        {#if key.justPressed}
          <span
            class="badge just-pressed"
            out:fade={{ duration: 400 }}>{label} justPressed</span
          >
        {:else if key.justReleased}
          <span
            class="badge just-released"
            out:fade={{ duration: 400 }}>{label} justReleased</span
          >
        {/if}
      {/each}
    </div>
  </HTML>
</T.Group>

<style>
  .states {
    min-height: 24px;
    display: grid;
    justify-items: center;
    font-family: 'Inter', system-ui, sans-serif;
    user-select: none;
    pointer-events: none;
  }

  .badge {
    grid-row: 1;
    grid-column: 1;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    color: white;
    white-space: nowrap;
  }

  .just-pressed {
    background: rgba(0, 200, 80, 0.7);
  }

  .just-released {
    background: rgba(200, 80, 0, 0.7);
  }
</style>
```

**Simple usage example:**

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()

  useTask(
    () => {
      if (keyboard.key('Space').justPressed) {
        console.log('Jump!')
      }

      if (keyboard.key('w').pressed) {
        console.log('Moving forward...')
      }
    },
    { after: keyboard.task }
  )
</script>
```

## Key State

Each key is identified by its `KeyboardEvent.key` value (e.g. `'w'`, `'Space'`, `'ArrowUp'`, `'Shift'`). Matching is case-insensitive, so `'w'` matches both `'w'` and `'W'` (when Shift is held). Call `keyboard.key(name)` to get a `KeyState` object:

| Property | Type | Description |
| --- | --- | --- |
| `pressed` | `boolean` | Whether the key is currently held down |
| `justPressed` | `boolean` | Whether the key was first pressed this frame |
| `justReleased` | `boolean` | Whether the key was released this frame |

The `KeyState` object is stable — calling `keyboard.key('Space')` always returns the same object reference, so you can store it:

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

## Reactivity

`KeyState` properties are reactive, so you can use them directly in your template or in `$derived` expressions without a game loop:

```svelte
<script lang="ts">
  import { useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()
  const space = keyboard.key('Space')
</script>

<p>{space.pressed ? 'Jumping!' : 'On the ground'}</p>
```

## Event Listeners

For immediate (non-polling) reactions, use `on()`. Events fire as soon as the browser delivers them, before frame processing.

```svelte
<script lang="ts">
  import { useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()

  keyboard.on('keydown', (e) => {
    console.log(`Pressed: ${e.key}`)
  })

  const off = keyboard.on('keyup', (e) => {
    console.log(`Released: ${e.key}`)
  })

  // Stop listening:
  // off()
</script>
```

## Task Ordering

`useKeyboard` processes buffered events in a named task (`'useKeyboard'`). To ensure your game logic reads the latest keyboard state, schedule your task **after** it:

```svelte
useTask(
  () => {
    // keyboard state is up to date here
  },
  { after: keyboard.task }
)
```

## Options

### target

The DOM element to listen on. Defaults to `window`, which captures keyboard input globally regardless of focus. Pass a specific element if you want scoped input:

```svelte
import { useThrelte } from '@threlte/core'

const { dom } = useThrelte()
const keyboard = useKeyboard(() => ({ target: dom }))
```

## Focus Handling

When the window loses focus (blur), all pressed keys are automatically released. This prevents stuck keys when the user alt-tabs away while holding a key.

---

# 8. useGamepad

https://threlte.xyz/docs/reference/extras/use-gamepad

`useGamepad` provides frame-accurate gamepad state tracking using the [Standard Gamepad layout](https://w3c.github.io/gamepad/#remapping). Button state is polled each frame, giving you `pressed`, `justPressed`, and `justReleased` on every button — just like `useKeyboard`.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import type { StandardGamepad } from '@threlte/extras'
  import { Pane, Folder, Slider, ButtonGrid } from 'svelte-tweakpane-ui'
  import Scene from './Scene.svelte'

  let gamepadRef = $state<StandardGamepad>()

  const buttonNames = [
    'clusterBottom',
    'clusterRight',
    'clusterLeft',
    'clusterTop',
    'leftBumper',
    'rightBumper',
    'select',
    'start',
    'leftStickButton',
    'rightStickButton',
    'directionalTop',
    'directionalBottom',
    'directionalLeft',
    'directionalRight',
    'center'
  ] as const

  const stickNames = ['leftStick', 'rightStick'] as const

  const buttonLabels = $derived(
    gamepadRef
      ? buttonNames.map((name) => (gamepadRef?.button(name).pressed ? `▶ ${name}` : name))
      : buttonNames.map((name) => name)
  )
</script>

<Pane
  title=""
  position="fixed"
>
  <ButtonGrid
    buttons={buttonLabels}
    columns={2}
    disabled
  />

  {#if gamepadRef}
    <Folder title="Triggers">
      <Slider
        value={gamepadRef.button('leftTrigger').value}
        label="LT"
        min={0}
        max={1}
        disabled
      />
      <Slider
        value={gamepadRef.button('rightTrigger').value}
        label="RT"
        min={0}
        max={1}
        disabled
      />
    </Folder>

    <Folder title="Sticks">
      {#each stickNames as name}
        <Slider
          value={gamepadRef.stick(name).x}
          label="{name}X"
          min={-1}
          max={1}
          disabled
        />
        <Slider
          value={gamepadRef.stick(name).y}
          label="{name}Y"
          min={-1}
          max={1}
          disabled
        />
      {/each}
    </Folder>
  {/if}
</Pane>

<div>
  <Canvas>
    <Scene bind:gamepadRef />
  </Canvas>
</div>

<style>
  div {
    height: 100%;
  }
</style>
```

**Show Code - Scene.svelte (full gamepad visualization with 3D controller model):**

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { Edges, HTML, Text, useGamepad, useTexture } from '@threlte/extras'
  import { fly } from 'svelte/transition'
  import { Spring } from 'svelte/motion'
  import { Color } from 'three'

  let { gamepadRef = $bindable() }: { gamepadRef?: any } = $props()

  const gamepad = useGamepad()
  gamepadRef = gamepad
  const { connected } = gamepad
  const logo = useTexture('/icons/mstile-150x150.png')

  // Buttons and sticks via the new API
  const dUp = gamepad.button('directionalTop')
  const dDown = gamepad.button('directionalBottom')
  const dLeft = gamepad.button('directionalLeft')
  const dRight = gamepad.button('directionalRight')
  const btnA = gamepad.button('clusterBottom')
  const btnB = gamepad.button('clusterRight')
  const btnX = gamepad.button('clusterLeft')
  const btnY = gamepad.button('clusterTop')
  const lt = gamepad.button('leftTrigger')
  const rt = gamepad.button('rightTrigger')
  const sel = gamepad.button('select')
  const btnStart = gamepad.button('start')

  const bodyColor = '#eedbcb'
  const buttonColor = '#111111'
  const activeColor = '#ff3e00'
  const triggerColor = '#555555'
  const activeTextColor = 'white'

  const dep = -0.06
  const springOpts = { stiffness: 0.3, damping: 0.6 }

  // D-pad springs
  const dUpZ = Spring.of(() => (dUp.pressed ? dep : 0), springOpts)
  const dDownZ = Spring.of(() => (dDown.pressed ? dep : 0), springOpts)
  const dLeftZ = Spring.of(() => (dLeft.pressed ? dep : 0), springOpts)
  const dRightZ = Spring.of(() => (dRight.pressed ? dep : 0), springOpts)

  // Action button springs
  const aZ = Spring.of(() => (btnA.pressed ? dep : 0), springOpts)
  const bZ = Spring.of(() => (btnB.pressed ? dep : 0), springOpts)
  const xZ = Spring.of(() => (btnX.pressed ? dep : 0), springOpts)
  const yZ = Spring.of(() => (btnY.pressed ? dep : 0), springOpts)

  // Center button springs
  const selZ = Spring.of(() => (sel.pressed ? dep : 0), springOpts)
  const startZ = Spring.of(() => (btnStart.pressed ? dep : 0), springOpts)

  const trackedButtons = [
    { state: btnA, label: 'A' },
    { state: btnB, label: 'B' },
    { state: btnX, label: 'X' },
    { state: btnY, label: 'Y' },
    { state: lt, label: 'LT' },
    { state: rt, label: 'RT' },
    { state: dUp, label: 'Up' },
    { state: dDown, label: 'Down' },
    { state: dLeft, label: 'Left' },
    { state: dRight, label: 'Right' },
    { state: sel, label: 'Select' },
    { state: btnStart, label: 'Start' }
  ] as const

  // Layout
  const dpadX = -2
  const clusterX = 2
  const padY = 0
  const s = 0.6
  const bh = 0.25
  const bodyDepth = 0.8
  const front = bodyDepth / 2 + bh / 2
  const top = 1.5
  const textZ = bh / 2 + 0.01

  const color1 = new Color()
  const color2 = new Color()
</script>

<!-- ... (full 3D gamepad model code with all buttons, triggers, d-pad, etc.) -->
```

**Simple usage example:**

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useGamepad } from '@threlte/extras'

  const gamepad = useGamepad()
  const jump = gamepad.button('clusterBottom')

  useTask(
    () => {
      if (jump.justPressed) {
        console.log('Jump!')
      }

      const left = gamepad.stick('leftStick')
      console.log(left.x, left.y)
    },
    { after: gamepad.task }
  )
</script>
```

More than one gamepad can be connected at any given time, so an optional `index` can be specified.

```svelte
const gamepad1 = useGamepad({ index: 0 })
const gamepad2 = useGamepad({ index: 1 })
```

## Button State

Call `gamepad.button(name)` to get the state of a button. The returned object is stable — calling `gamepad.button('clusterBottom')` always returns the same reference, so you can store it:

```svelte
const a = gamepad.button('clusterBottom')
const lt = gamepad.button('leftTrigger')

// In a useTask callback:
if (a.justPressed) jump()
if (lt.value > 0.5) accelerate()
```

| Property | Type | Description |
| --- | --- | --- |
| `pressed` | `boolean` | Whether the button is currently held down |
| `justPressed` | `boolean` | Whether the button was first pressed this frame |
| `justReleased` | `boolean` | Whether the button was released this frame |
| `touched` | `boolean` | Whether the button is being touched (if supported) |
| `value` | `number` | Analog value 0–1 (e.g. triggers) |

## Stick State

Call `gamepad.stick(name)` to get a stick's axis values:

```svelte
const left = gamepad.stick('leftStick')
const right = gamepad.stick('rightStick')

console.log(left.x, left.y)
```

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` | Horizontal axis (-1 left, 1 right) |
| `y` | `number` | Vertical axis (-1 up, 1 down) |

## Reactivity

Button and stick properties are reactive, so you can use them directly in your template or in `$derived` expressions:

```svelte
<script lang="ts">
  import { useGamepad } from '@threlte/extras'

  const gamepad = useGamepad()
  const a = gamepad.button('clusterBottom')
  const left = gamepad.stick('leftStick')
</script>

<p>{a.pressed ? 'A pressed!' : 'A not pressed'}</p>
<p>Left stick: ({left.x.toFixed(2)}, {left.y.toFixed(2)})</p>
```

## Event Listeners

Event listeners can be attached to individual buttons, sticks, or the gamepad itself.

```svelte
<script lang="ts">
  import { useGamepad } from '@threlte/extras'

  const gamepad = useGamepad()

  // Listen on a specific button
  const off = gamepad.button('leftTrigger').on('down', (event) => {
    console.log('Left trigger pressed!')
    off() // Unsubscribe after first fire
  })

  // Listen on a stick
  gamepad.stick('leftStick').on('change', (event) => {
    console.log(`Left stick: ${event.value.x}, ${event.value.y}`)
  })

  // Listen on all buttons
  gamepad.on('press', (event) => {
    console.log(`${event.target} pressed: ${event.value}`)
  })
</script>
```

Available events:

| Event | Description |
| --- | --- |
| `down` | Fires when a button press begins |
| `up` | Fires when a button press ends |
| `press` | Fires when a button is pressed (after release) |
| `change` | Fires when a button or stick value changes |
| `touchstart` | Fires when a touch begins (if supported by the gamepad) |
| `touchend` | Fires when a touch ends |
| `touch` | Fires when a touch completes (after release) |

## Task Ordering

`useGamepad` polls gamepad state in a named task (`'useGamepad'`). To ensure your game logic reads the latest state, schedule your task **after** it:

```svelte
useTask(
  () => {
    // gamepad state is up to date here
  },
  { after: gamepad.task }
)
```

## Options

### index

The gamepad index when multiple gamepads are connected. Defaults to `0`.

### axisDeadzone

The minimum axis value before change events fire. Defaults to `0.05`.

```svelte
const gamepad = useGamepad({ axisDeadzone: 0.1 })
```

## Connection Status

The `connected` property is a `currentWritable` that updates when a gamepad connects or disconnects.

```svelte
<script lang="ts">
  import { useGamepad } from '@threlte/extras'

  const gamepad = useGamepad()
  const { connected } = gamepad
</script>

<p>{$connected ? 'Gamepad connected' : 'No gamepad'}</p>
```

The raw unmapped [Gamepad](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad) can be accessed via `gamepad.raw`. This will be `null` unless a gamepad is connected.

Gamepad data is fetched as an immutable snapshot on every frame, so any variable that caches `gamepad.raw` will become stale on the next frame.

## Button Mapping

The gamepad maps 17 standard buttons and 2 sticks:

**Buttons:**

- **Right cluster:** `clusterBottom`, `clusterRight`, `clusterLeft`, `clusterTop`
- **Bumpers and triggers:** `leftBumper`, `rightBumper`, `leftTrigger`, `rightTrigger`
- **Center:** `select`, `start`, `center`
- **Stick buttons:** `leftStickButton`, `rightStickButton`
- **D-pad:** `directionalTop`, `directionalBottom`, `directionalLeft`, `directionalRight`

**Sticks:**

- `leftStick`, `rightStick`

## XR Gamepad

For WebXR controllers with the `xr-standard` layout, set `xr: true`:

```svelte
const left = useGamepad({ xr: true, hand: 'left' })
const right = useGamepad({ xr: true, hand: 'right' })

left.button('trigger').on('change', (event) => console.log(event))
right.button('trigger').on('change', (event) => console.log(event))
```

**XR Buttons:** `trigger`, `squeeze`, `touchpadButton`, `thumbstickButton`, `clusterBottom`, `clusterTop`

**XR Sticks:** `touchpad`, `thumbstick`

---

# 9. useInputMap

https://threlte.xyz/docs/reference/extras/use-input-map

`useInputMap` provides an action mapping system that abstracts physical inputs into named actions. Define actions like `"jump"` or `"moveLeft"` once, bind them to keyboard keys and gamepad buttons, then query them by name. This decouples game logic from specific input devices.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { Pane, List, Text } from 'svelte-tweakpane-ui'
  import Scene from './Scene.svelte'

  const sprintKeyOptions = {
    Shift: 'Shift',
    Space: 'Space',
    e: 'e'
  }
  let sprintKey: keyof typeof sprintKeyOptions = $state('Shift')
  let activeDevice = $state('keyboard')
</script>

<Pane
  title="Input"
  position="fixed"
>
  <List
    bind:value={sprintKey}
    options={sprintKeyOptions}
    label="sprint key"
  />
  <Text
    value={activeDevice}
    label="device"
    disabled
  />
</Pane>

<div>
  <Canvas>
    <Scene
      {sprintKey}
      bind:activeDevice
    />
  </Canvas>
</div>

<style>
  div {
    height: 100%;
  }
</style>
```

**Show Code - Scene.svelte (full character movement example):**

```svelte
<script lang="ts">
  import { MathUtils } from 'three'
  import { T, useTask } from '@threlte/core'
  import { useInputMap, useGamepad, useKeyboard, Grid, HTML } from '@threlte/extras'
  import Character from './Character.svelte'

  let {
    sprintKey = 'Shift',
    activeDevice = $bindable('keyboard')
  }: { sprintKey?: string; activeDevice?: string } = $props()

  const keyboard = useKeyboard()
  const gamepad = useGamepad()

  const input = useInputMap(
    ({ key, gamepadAxis, gamepadButton }) => ({
      moveLeft: [key('a'), key('ArrowLeft'), gamepadAxis('leftStick', 'x', -1)],
      moveRight: [key('d'), key('ArrowRight'), gamepadAxis('leftStick', 'x', 1)],
      moveForward: [key('w'), key('ArrowUp'), gamepadAxis('leftStick', 'y', -1)],
      moveBack: [key('s'), key('ArrowDown'), gamepadAxis('leftStick', 'y', 1)],
      sprint: [key(sprintKey), gamepadButton('leftBumper')]
    }),
    { keyboard, gamepad }
  )

  // Prevent arrow keys from scrolling the page
  keyboard.on('keydown', (e) => {
    if (e.key.startsWith('Arrow')) e.preventDefault()
  })

  $effect(() => {
    activeDevice = input.activeDevice.current
  })

  const sprinting = $derived(input.action('sprint').pressed)
  const moveX = $derived(input.axis('moveLeft', 'moveRight'))
  const moveY = $derived(input.axis('moveForward', 'moveBack'))
  const moving = $derived(moveX !== 0 || moveY !== 0)
  const action = $derived<'idle' | 'run' | 'walk'>(moving ? (sprinting ? 'run' : 'walk') : 'idle')

  let x = $state(0)
  let z = $state(0)
  let rotation = $state(0)
  let targetRotation = 0

  const rotationSpeed = 10
  const sprintSpeed = 4
  const walkSpeed = 2

  useTask(
    (delta) => {
      const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
      const speed = sprinting ? sprintSpeed : walkSpeed

      x += move.x * speed * delta
      z += move.y * speed * delta

      // Smoothly rotate character to face movement direction
      if (moving) {
        targetRotation = Math.atan2(move.x, move.y)
      }

      // Lerp rotation using shortest path around the circle
      let diff = targetRotation - rotation
      // Wrap to [-PI, PI] so we always take the shortest turn
      diff = MathUtils.euclideanModulo(diff + Math.PI, Math.PI * 2) - Math.PI
      rotation += diff * Math.min(1, rotationSpeed * delta)
    },
    { after: input.task }
  )
</script>

<T.PerspectiveCamera
  position={[0, 4, 5]}
  oncreate={(ref) => ref.lookAt(0, 1, 0)}
  makeDefault
  fov={50}
/>

<T.DirectionalLight
  position={[5, 10, 5]}
  intensity={1.5}
  castShadow
/>
<T.AmbientLight intensity={0.4} />

<Grid
  cellColor="#444444"
  sectionColor="#ff3e00"
  sectionSize={5}
  cellSize={1}
  gridSize={[20, 20]}
  fadeDistance={25}
/>

<T.Mesh
  rotation.x={-Math.PI / 2}
  position.y={-0.01}
  receiveShadow
>
  <T.CircleGeometry args={[15, 72]} />
  <T.MeshStandardMaterial color="white" />
</T.Mesh>

<T.Group
  position.x={x}
  position.z={z}
  rotation.y={rotation}
>
  <Character {action} />
</T.Group>

<T.Group
  position.x={x}
  position.y={2.5}
  position.z={z}
>
  <HTML
    center
    transform={false}
  >
    <div class="overlay">
      {#if input.activeDevice.current === 'keyboard'}
        <p class="hint">WASD / Arrows to move, {sprintKey} to sprint</p>
      {:else}
        <p class="hint">Left Stick to move, LB to sprint</p>
      {/if}

      <div class="info">
        <span class="label">vector</span>
        <span class="value">({moveX.toFixed(2)}, {moveY.toFixed(2)})</span>
      </div>

      <div
        class="badge"
        class:sprint={sprinting}
        class:walk={moving && !sprinting}
      >
        {action}
      </div>
    </div>
  </HTML>
</T.Group>

<style>
  .overlay {
    font-family: 'Inter', system-ui, sans-serif;
    color: white;
    text-align: center;
    user-select: none;
    pointer-events: none;
    width: 260px;
  }

  .hint {
    font-size: 12px;
    opacity: 0.6;
    margin: 0 0 8px;
  }

  .info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
  }

  .label {
    opacity: 0.5;
    font-weight: 600;
  }

  .value {
    font-family: 'JetBrains Mono', monospace;
  }

  .badge {
    display: inline-block;
    margin-top: 6px;
    font-size: 11px;
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.15);
  }

  .sprint {
    background: rgba(255, 62, 0, 0.8);
  }

  .walk {
    background: rgba(74, 144, 217, 0.8);
  }
</style>
```

**Simple usage example:**

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useInputMap, useKeyboard, useGamepad } from '@threlte/extras'

  const keyboard = useKeyboard()
  const gamepad = useGamepad()

  const input = useInputMap(
    ({ key, gamepadButton, gamepadAxis }) => ({
      jump: [key('Space'), gamepadButton('clusterBottom')],
      moveLeft: [key('a'), gamepadAxis('leftStick', 'x', -1)],
      moveRight: [key('d'), gamepadAxis('leftStick', 'x', 1)],
      moveForward: [key('w'), gamepadAxis('leftStick', 'y', -1)],
      moveBack: [key('s'), gamepadAxis('leftStick', 'y', 1)]
    }),
    { keyboard, gamepad }
  )

  useTask(
    () => {
      if (input.action('jump').justPressed) {
        player.jump()
      }

      const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
      player.velocity.x = move.x * speed
      player.velocity.z = move.y * speed
    },
    { after: input.task }
  )
</script>
```

## Reactive Definitions

The definitions are passed as a function, so you can reactively update bindings at runtime — for example, when the user remaps controls in a settings screen:

```svelte
<script lang="ts">
  import { useInputMap, useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()
  let jumpKey = $state('Space')

  const input = useInputMap(
    ({ key }) => ({
      jump: [key(jumpKey)]
    }),
    { keyboard }
  )

  // Later, when the user remaps:
  jumpKey = 'j'
</script>
```

## Bindings

Each action maps to an array of bindings. Any active binding triggers the action. Three binding helpers are passed to the definitions callback:

### key(key)

Binds a keyboard key by its `KeyboardEvent.key` value. Matching is case-insensitive, so `'w'` matches both `'w'` and `'W'` (when Shift is held).

```svelte
key('Space') // spacebar
key('w') // W key
key('ArrowUp') // up arrow
key('Shift') // either shift key
```

### gamepadButton(button)

Binds a standard gamepad button. Uses the same button names as `useGamepad`.

```svelte
gamepadButton('clusterBottom') // A / Cross
gamepadButton('clusterRight') // B / Circle
gamepadButton('leftTrigger') // LT / L2
gamepadButton('leftBumper') // LB / L1
```

### gamepadAxis(stick, axis, direction, threshold?)

Binds a gamepad stick axis in a specific direction. The `threshold` parameter controls the minimum axis value before the binding activates (default `0.1`).

```svelte
gamepadAxis('leftStick', 'x', 1) // right on left stick
gamepadAxis('leftStick', 'x', -1) // left on left stick
gamepadAxis('leftStick', 'y', -1) // up on left stick (y is inverted)
gamepadAxis('leftStick', 'y', 1) // down on left stick
gamepadAxis('rightStick', 'x', 1, 0.2) // right on right stick, 0.2 deadzone
```

## Action State

Call `input.action(name)` to get the current state of an action:

| Property | Type | Description |
| --- | --- | --- |
| `pressed` | `boolean` | Whether any binding for this action is active |
| `justPressed` | `boolean` | Whether the action became active this frame |
| `justReleased` | `boolean` | Whether the action became inactive this frame |
| `strength` | `number` | Analog strength 0–1. Digital inputs produce 0 or 1. |

```svelte
const jump = input.action('jump')

if (jump.justPressed) startJump()
if (jump.pressed) holdJump()
if (jump.justReleased) releaseJump()
```

`strength` is useful for analog inputs like gamepad triggers, where you might want partial values. For keyboard keys, strength is always 0 or 1.

Action state properties are reactive, so you can use them directly in your template:

```svelte
<p>{input.action('sprint').pressed ? 'Sprinting!' : 'Walking'}</p>
```

## Axes and Vectors

### axis(negative, positive)

Combines two actions into a signed axis value from -1 to 1. This is equivalent to Godot's `Input.get_axis()`.

```svelte
const horizontal = input.axis('moveLeft', 'moveRight') // -1 to 1
const vertical = input.axis('moveBack', 'moveForward') // -1 to 1
```

### vector(negativeX, positiveX, negativeY, positiveY)

Combines four actions into a 2D vector, clamped to a unit circle (magnitude <= 1). This is equivalent to Godot's `Input.get_vector()` and handles diagonal normalization automatically.

```svelte
const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
// move.x: -1 to 1
// move.y: -1 to 1
// magnitude is clamped to 1 (no faster diagonal movement)
```

`vector()` returns the same object reference each call to avoid allocations in the game loop. Don't store it across frames — read the values immediately.

## Active Device

`input.activeDevice.current` is a reactive property that returns `'keyboard'` or `'gamepad'`, based on whichever device most recently provided input. Can be used, for example, to show context-sensitive button prompts:

```svelte
{#if input.activeDevice.current === 'keyboard'}
  <p>Press Space to jump</p>
{:else}
  <p>Press A to jump</p>
{/if}
```

## Options

### keyboard

A `useKeyboard` instance for resolving keyboard bindings.

```svelte
import { useKeyboard, useInputMap } from '@threlte/extras'

const keyboard = useKeyboard()

const input = useInputMap(
  ({ key }) => ({
    jump: [key('Space')]
  }),
  { keyboard }
)
```

### gamepad

Pass a `useGamepad` return value to enable gamepad bindings. Only required if any action uses `gamepadButton()` or `gamepadAxis()`.

```svelte
import { useKeyboard, useGamepad, useInputMap } from '@threlte/extras'

const keyboard = useKeyboard()
const gamepad = useGamepad()

const input = useInputMap(
  ({ key, gamepadButton }) => ({
    jump: [key('Space'), gamepadButton('clusterBottom')]
  }),
  { keyboard, gamepad }
)
```

## Task Ordering

`useInputMap` runs its processing task after the internal keyboard task. Schedule your game logic after `input.task`:

```svelte
useTask(
  () => {
    // All action states are up to date here
  },
  { after: input.task }
)
```

## Keyboard-Only Example

If you don't need gamepad support, just use `key()` bindings:

```svelte
<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { useInputMap, useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()

  const input = useInputMap(
    ({ key }) => ({
      jump: [key('Space')],
      moveLeft: [key('a'), key('ArrowLeft')],
      moveRight: [key('d'), key('ArrowRight')],
      moveForward: [key('w'), key('ArrowUp')],
      moveBack: [key('s'), key('ArrowDown')],
      sprint: [key('Shift')]
    }),
    { keyboard }
  )

  let x = $state(0)
  let z = $state(0)

  useTask(
    (delta) => {
      const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
      const speed = input.action('sprint').pressed ? 10 : 5

      x += move.x * speed * delta
      z += move.y * speed * delta
    },
    { after: input.task }
  )
</script>

<T.Mesh
  position.x={x}
  position.z={z}
>
  <T.BoxGeometry />
  <T.MeshStandardMaterial color="orange" />
</T.Mesh>
```

---

# 10. bvh

https://threlte.xyz/docs/reference/extras/bvh

A plugin that uses `three-mesh-bvh` to speed up raycasting and enable spatial queries against Three.js objects. Any Mesh, BatchedMesh, or Points that are created in the component and child component where this plugin is called are patched with BVH raycasting methods.

**Show Code - App.svelte:**

```svelte
<script lang="ts">
  import Scene from './Scene.svelte'
  import { Canvas } from '@threlte/core'
  import { type BVHOptions, BVHSplitStrategy } from '@threlte/extras'
  import { Pane, Checkbox, List, Slider } from 'svelte-tweakpane-ui'

  let options = $state<Required<BVHOptions> & { helper: boolean }>({
    enabled: true,
    helper: true,
    strategy: BVHSplitStrategy.SAH,
    indirect: false,
    verbose: false,
    maxDepth: 20,
    maxLeafTris: 10,
    setBoundingBox: true
  })
</script>

<Pane
  title="bvh"
  position="fixed"
>
  <Checkbox
    label="enabled"
    bind:value={options.enabled}
  />
  <Checkbox
    label="helper"
    bind:value={options.helper}
  />
  <Checkbox
    label="setBoundingBox"
    bind:value={options.setBoundingBox}
  />
  <List
    bind:value={options.strategy}
    label="strategy"
    options={{
      SAH: BVHSplitStrategy.SAH,
      CENTER: BVHSplitStrategy.CENTER,
      AVERAGE: BVHSplitStrategy.AVERAGE
    }}
  />
  <Slider
    label="maxDepth"
    bind:value={options.maxDepth}
    step={1}
  />
  <Slider
    label="maxLeafTris"
    bind:value={options.maxLeafTris}
    step={1}
  />
</Pane>

<Canvas>
  <Scene {...options} />
</Canvas>
```

**Show Code - Scene.svelte (full BVH raycasting visualization on Stanford Bunny):**

```svelte
<script lang="ts">
  import {
    OrbitControls,
    Grid,
    useGltf,
    Environment,
    Wireframe,
    bvh,
    interactivity,
    type BVHOptions
  } from '@threlte/extras'
  import { T, useTask } from '@threlte/core'
  import { BufferAttribute, DynamicDrawUsage, Mesh, Vector3, type Face } from 'three'

  let { ...rest }: BVHOptions = $props()

  const { raycaster } = interactivity()
  raycaster.firstHitOnly = true

  bvh(() => rest)

  const gltf = useGltf('/models/stanford_bunny.glb')
  const mesh = $derived($gltf ? ($gltf.nodes['Object_2'] as Mesh) : undefined)

  $effect(() => {
    if (mesh) {
      const array = new Float32Array(3 * mesh.geometry.getAttribute('position').count).fill(1)
      const attribute = new BufferAttribute(array, 3).setUsage(DynamicDrawUsage)
      mesh.geometry.setAttribute('color', attribute)
    }
  })

  const faces = new Set<Face>()

  useTask(() => {
    const attribute = mesh?.geometry.getAttribute('color')

    if (!attribute) {
      return
    }

    for (const face of faces) {
      let gb = attribute.getY(face.a)

      gb += 0.01

      if (gb >= 1) {
        gb = 1
        faces.delete(face)
      }

      attribute.setXYZ(face.a, 1, gb, gb)
      attribute.setXYZ(face.b, 1, gb, gb)
      attribute.setXYZ(face.c, 1, gb, gb)

      attribute.needsUpdate = true
    }
  })
</script>

<T.PerspectiveCamera
  makeDefault
  position.x={-1.3}
  position.y={1.8}
  position.z={1.8}
  fov={50}
  oncreate={(ref) => ref.lookAt(0, 0.6, 0)}
>
  <OrbitControls
    enableDamping
    enableZoom={false}
    enablePan={false}
    target={[0, 0.6, 0]}
  />
</T.PerspectiveCamera>

{#if $gltf}
  <T
    is={$gltf.nodes['Object_2'] as Mesh}
    scale={10}
    rotation.x={-Math.PI / 2}
    position.y={-0.35}
    onpointermove={({ face }) => {
      const attribute = mesh?.geometry.getAttribute('color')

      if (face && attribute) {
        attribute.setXYZ(face.a, 1, 0, 0)
        attribute.setXYZ(face.b, 1, 0, 0)
        attribute.setXYZ(face.c, 1, 0, 0)
        faces.add(face)
      }
    }}
  >
    <T.MeshStandardMaterial
      roughness={0.1}
      metalness={0.4}
      vertexColors
    />
    <Wireframe />
  </T>
{/if}

<T.DirectionalLight />

<Environment url="/textures/equirectangular/hdr/shanghai_riverside_1k.hdr" />

<Grid
  sectionThickness={1}
  infiniteGrid
  cellColor="#dddddd"
  sectionColor="#ffffff"
  sectionSize={1}
  cellSize={0.5}
  type="circular"
  fadeOrigin={new Vector3()}
  fadeDistance={20}
  fadeStrength={10}
/>
```

### Basic example

The plugin can be configured by passing a function that returns an object or `$state` rune as an argument. The following options are available and will be set for every Three.js object.

```svelte
<script lang="ts">
  import { T } from '@threlte/core'
  import { bvh, interactivity, BVHSplitStrategy, type BVHOptions } from '@threlte/extras'

  // Usually, you'll also want to call the interactivity plugin.
  const { raycaster } = interactivity()

  // This option is usually set with three-mesh-bvh,
  // unless you need multiple hits.
  raycaster.firstHitOnly = true

  // These are the default options.
  const options = $state<BVHOptions>({
    enabled: true,
    helper: false,
    strategy: BVHSplitStrategy.SAH,
    indirect: false,
    verbose: false,
    maxDepth: 20,
    maxLeafTris: 10,
    setBoundingBox: true
  })

  bvh(() => options)
</script>
```

Setting options at a per object level is possible with the `bvh` prop.

```svelte
<T.Mesh bvh={{ maxDepth: 10 }}>
  <T.TorusGeometry />
  <T.MeshStandardMaterial >
</T.Mesh>
```

If you want this prop to be typesafe, you can extend `Threlte.UserProps` like so:

```typescript
import type { InteractivityProps, BVHProps } from '@threlte/extras'

declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps, BVHProps {}
  }
}
```

### Points

The `bvh` plugin will shapecast against points, attempting to match Three.js' raycasting behavior with added `three-mesh-bvh` optimizations.

**Show Code - Points example (App.svelte):**

```svelte
<script lang="ts">
  import Scene from './Scene.svelte'
  import { Canvas } from '@threlte/core'
  import { type BVHOptions, BVHSplitStrategy } from '@threlte/extras'
  import { Pane, Checkbox, List, Slider } from 'svelte-tweakpane-ui'

  const options = $state<Required<BVHOptions> & { helper: boolean; firstHitOnly: boolean }>({
    enabled: true,
    strategy: BVHSplitStrategy.SAH,
    indirect: false,
    verbose: false,
    maxDepth: 40,
    maxLeafTris: 20,
    setBoundingBox: true,

    firstHitOnly: false,
    helper: false
  })
</script>

<Pane
  title="bvh"
  position="fixed"
>
  <Checkbox
    label="enabled"
    bind:value={options.enabled}
  />
  <Checkbox
    label="helper"
    bind:value={options.helper}
  />
  <Checkbox
    label="firstHitOnly"
    bind:value={options.firstHitOnly}
  />
  <Checkbox
    label="setBoundingBox"
    bind:value={options.setBoundingBox}
  />
  <List
    bind:value={options.strategy}
    label="strategy"
    options={{
      SAH: BVHSplitStrategy.SAH,
      CENTER: BVHSplitStrategy.CENTER,
      AVERAGE: BVHSplitStrategy.AVERAGE
    }}
  />
  <Slider
    label="maxDepth"
    bind:value={options.maxDepth}
    step={1}
  />
  <Slider
    label="maxLeafTris"
    bind:value={options.maxLeafTris}
    step={1}
  />
</Pane>

<Canvas>
  <Scene {...options} />
</Canvas>
```

**Show Code - Points example (Scene.svelte):**

```svelte
<script lang="ts">
  import {
    OrbitControls,
    useGltf,
    bvh,
    interactivity,
    type BVHOptions,
    PointsMaterial
  } from '@threlte/extras'
  import { T, useTask } from '@threlte/core'
  import { BufferAttribute, DynamicDrawUsage, Points, type Vector3Tuple } from 'three'

  let { ...rest }: BVHOptions & { firstHitOnly: boolean } = $props()

  const { raycaster } = interactivity()
  raycaster.params.Points.threshold = 0.5

  $effect(() => {
    raycaster.firstHitOnly = rest.firstHitOnly
  })

  bvh(() => rest)

  const gltf = useGltf('/models/stairs.glb')

  const points = $derived.by(() => {
    if (!$gltf) {
      return
    }

    const results = $gltf.nodes['Object'] as Points
    const array = new Float32Array(3 * results.geometry.getAttribute('position').count).fill(1)
    const attribute = new BufferAttribute(array, 3).setUsage(DynamicDrawUsage)
    results.geometry.setAttribute('color', attribute)

    return results
  })

  useTask(() => {
    if (!points) return

    const attribute = points.geometry.getAttribute('color')

    const indices = points.userData.indices as Set<number>
    if (indices.size > 0) {
      for (const index of indices) {
        let gb = attribute.getY(index)

        gb += 0.005

        if (gb >= 1) {
          gb = 1
          indices.delete(index)
        }

        attribute.setXYZ(index, 1, gb, gb)
      }

      attribute.needsUpdate = true
    }
  })

  let visible = $state(false)
  let point = $state.raw<Vector3Tuple>([0, 0, 0])
</script>

<T.PerspectiveCamera
  makeDefault
  position.x={20}
  position.y={20}
  position.z={-20}
  fov={50}
>
  <OrbitControls
    enableDamping
    enableZoom={false}
    enablePan={false}
  />
</T.PerspectiveCamera>

{#if points}
  <T
    is={points}
    rotation.x={-Math.PI / 2}
    userData.indices={new Set<number>()}
    onpointerenter={() => {
      visible = true
    }}
    onpointerleave={() => {
      visible = false
    }}
    onpointermove={(event) => {
      point = event.point.toArray()
      if (event.index) {
        points.geometry.getAttribute('color').setXYZ(event.index, 1, 0, 0)
        points.userData.indices.add(event.index)
      }
    }}
  >
    <PointsMaterial
      size={0.2}
      vertexColors
      transparent
      toneMapped={false}
      opacity={0.75}
    />
  </T>
{/if}

<T.Mesh
  position={point}
  renderOrder={1}
  {visible}
  bvh={{ enabled: false }}
>
  <T.SphereGeometry args={[0.5]} />
  <T.MeshBasicMaterial
    color="red"
    depthTest={false}
    transparent
    opacity={0.5}
  />
</T.Mesh>

<T.DirectionalLight />
```

### Limitations

To avoid unnecessary bounds tree computations, the plugin will **not** recompute bounds trees when geometry changes occur. The plugin is set to recompute only if a reference to a mesh changes. So, if you want to recompute a bounds tree based on a geometry change, you'll have to regenerate the mesh as well.

```svelte
{#key geometry}
  <T.Mesh>
    <T is={geometry} />
    <T.MeshStandardMaterial />
  </T.Mesh>
{/key}
```
