# @threlte/core - Quick Reference Guide

> Complete summary of the [Threlte](https://threlte.xyz/) framework core package for Svelte/Three.js.  
> Official source: https://threlte.xyz/docs/reference/core/getting-started/

---

## What is it?

`@threlte/core` is the main package of the Threlte framework. It provides a declarative layer (Svelte components) over [Three.js](https://threejs.org/), allowing you to build 3D scenes using Svelte's component syntax instead of Three.js's imperative API. The other packages in the Threlte ecosystem (rapier, extras, gltf, etc.) depend on this one.

---

## Installation

```bash
npm install @threlte/core three @types/three
```

---

## Basic Architecture

```
<Canvas>          (root - creates WebGLRenderer, provides context)
  └─ <T.Mesh>     (any Three.js class as a component)
       ├─ <T.BoxGeometry />
       └─ <T.MeshStandardMaterial />
```

**Minimal example:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
</script>

<Canvas>
  <Scene />
</Canvas>
```

```svelte
<!-- Scene.svelte -->
<script lang="ts">
  import { T } from '@threlte/core'
</script>

<T.PerspectiveCamera
  position={[10, 10, 10]}
  oncreate={(ref) => ref.lookAt(0, 0, 0)}
  makeDefault
/>

<T.Mesh>
  <T.BoxGeometry args={[1, 1, 1]} />
  <T.MeshBasicMaterial color="red" />
</T.Mesh>
```

---

## Components

### `<Canvas>`

Root component of every Threlte application. Creates the `THREE.WebGLRenderer` and provides context for all children. All other components and hooks must be inside `<Canvas>`.

#### Size

By default, the canvas takes 100% of the parent element's width and height. Set the size through the parent's layout:

```svelte
<div style="width: 600px; height: 400px;">
  <Canvas>
    <Scene />
  </Canvas>
</div>
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `autoRender` | `boolean` | `true` | Automatically renders every frame. `false` for custom pipelines |
| `colorManagementEnabled` | `boolean` | `true` | Three.js color management |
| `colorSpace` | `THREE.ColorSpace` | `srgb` | Color space |
| `createRenderer` | `function` | - | Custom function to create the renderer |
| `dpr` | `number` | `window.devicePixelRatio` | Device pixel ratio |
| `renderMode` | `'always' \| 'on-demand' \| 'manual'` | `'on-demand'` | Render mode |
| `shadows` | `boolean \| ShadowMapType` | `PCFSoftShadowMap` | Enables shadows and shadow type |
| `toneMapping` | `THREE.ToneMapping` | `AgXToneMapping` | Tone mapping |

#### Render Modes

| Mode | Behavior |
|---|---|
| `'on-demand'` | Renders only when necessary (default, best performance). Use `invalidate()` to request a re-render |
| `'always'` | Renders every frame, regardless of changes |
| `'manual'` | No automatic rendering. Use `advance()` to render manually |

---

### `<T>` (Main Component)

The building block of Threlte. Allows using **any Three.js class** as a Svelte component. The entire scene is built with `<T>`.

#### Two ways to use it:

**1. Dot notation (recommended for classes from the `three` namespace):**

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshBasicMaterial />
</T.Mesh>
```

**2. Prop `is` (for external or custom classes):**

```svelte
<script>
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
</script>

<T is={OrbitControls} args={[camera, renderer.domElement]} />
```

Both are **equivalent** and interchangeable.

#### Automatic Behavior

- **Scene graph**: If the class extends `THREE.Object3D`, it is automatically added to the scene
- **Attach**: Materials are attached to the `material` prop, geometries to `geometry`, automatically
- **Dispose**: Disposable objects are disposed when unmounting or when `args` changes

#### Three.js Props

Any property of the Three.js object can be used as a reactive prop:

```svelte
<T.Mesh position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]}>
  <T.MeshStandardMaterial color="red" roughness={0.5} metalness={0.8} />
</T.Mesh>
```

**Pierced props** (update only one coordinate):

```svelte
<T.Mesh position.y={1} rotation.y={Math.PI / 4} />
```

> The type of a prop must remain constant during the component's lifetime.

#### `args` (Constructor Arguments)

The Three.js constructor receives arguments via `args` (array). Avoid changing `args` afterward, as it recreates the instance:

```svelte
<T.BoxGeometry args={[1, 2, 1]} />
<!-- Equivalent to: new THREE.BoxGeometry(1, 2, 1) -->

<T.SphereGeometry args={[radius, 32, 32]} />
<!-- Equivalent to: new THREE.SphereGeometry(radius, 32, 32) -->
```

#### `attach`

Controls how the child object connects to its parent:

```svelte
<!-- Automatic for materials and geometries -->
<T.Mesh>
  <T.MeshStandardMaterial />         <!-- attach="material" automatic -->
  <T.BoxGeometry />                  <!-- attach="geometry" automatic -->
</T.Mesh>

<!-- Explicit -->
<T.MeshStandardMaterial>
  <T is={texture} attach="map" />
</T.MeshStandardMaterial>

<!-- Dot-notated path (nested) -->
<T.DirectionalLight>
  <T.OrthographicCamera args={[-1, 1, 1, -1, 0.1, 100]} attach="shadow.camera" />
</T.DirectionalLight>

<!-- Function (full control) -->
<T.DirectionalLight>
  <T.OrthographicCamera
    attach={({ ref, parent }) => {
      parent.shadow.camera = ref
      return () => { parent.shadow.camera = null }
    }}
  />
</T.DirectionalLight>

<!-- Disable attach -->
<T is={mesh} attach={false} />
```

#### Camera Props

```svelte
<!-- Default rendering camera -->
<T.PerspectiveCamera makeDefault position={[10, 10, 10]} />

<!-- Manual camera (does not update aspect ratio automatically) -->
<T.PerspectiveCamera manual />

<!-- Access camera via snippet to pass to OrbitControls -->
<T.PerspectiveCamera makeDefault>
  {#snippet children({ ref })}
    <T is={OrbitControls} args={[ref, renderer.domElement]} />
  {/snippet}
</T.PerspectiveCamera>
```

> **Common mistake**: Forgetting `makeDefault`. Without it, the scene renders with Threlte's default camera, not yours.

#### Events

**`create` event** (fired when the instance is created):

```svelte
<T.PerspectiveCamera
  oncreate={(ref) => {
    ref.lookAt(0, 0, 0)
    return () => { /* cleanup on unmount */ }
  }}
/>
```

**Three.js object events** (when the object has `addEventListener`):

```svelte
<T is={OrbitControls} onchange={(e) => console.log('change:', e)} />
```

**Interaction events** (click, pointer, etc.) require the `interactivity` plugin from `@threlte/extras`.

#### Bindings

```svelte
<script>
  let camera = $state()
</script>

<T.PerspectiveCamera bind:ref={camera} />
<!-- camera = THREE.PerspectiveCamera -->
```

#### Snippet Props

```svelte
<T.PerspectiveCamera>
  {#snippet children({ ref })}
    <T is={OrbitControls} args={[ref, renderer.domElement]} />
  {/snippet}
</T.PerspectiveCamera>
```

#### Extending the Component Catalog

To use classes that are not from the `three` namespace with dot notation:

```svelte
<script>
  import { extend, T } from '@threlte/core'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

  extend({ OrbitControls })
</script>

<!-- Now available with dot notation -->
<T.OrbitControls args={[camera, renderer.domElement]} />
```

**Custom types** (in `src/app.d.ts`):

```typescript
import type { UserCatalogue } from '@threlte/core'

declare global {
  namespace Threlte {
    interface UserCatalogue {
      OrbitControls: typeof OrbitControls
      CustomMesh: typeof CustomMesh
    }
  }
}

export {}
```

---

## Hooks

### `useThrelte()`

Access to the main Threlte context (renderer, camera, scene, etc.). Must be used inside `<Canvas>`.

```typescript
const {
  dom,                        // HTMLElement - canvas wrapper
  size,                       // Readable<DOMRect> - size
  canvas,                     // HTMLCanvasElement
  camera,                     // CurrentWritable<Camera> - active camera
  scene,                      // Scene
  dpr,                        // CurrentWritable<number> - device pixel ratio
  renderer,                   // WebGLRenderer
  renderMode,                 // CurrentWritable<'always' | 'on-demand' | 'manual'>
  autoRender,                 // CurrentWritable<boolean>
  invalidate,                 // () => void - requests re-render
  advance,                    // () => void - renders manually (mode='manual')
  scheduler,                  // Scheduler
  mainStage,                  // Stage - main stage
  renderStage,                // Stage - render stage
  autoRenderTask,             // Task
  shouldRender,               // () => boolean
  colorManagementEnabled,     // CurrentReadable<boolean>
  colorSpace,                 // CurrentWritable<ColorSpace>
  toneMapping,                // CurrentWritable<ToneMapping>
  shadows                     // CurrentWritable<boolean | ShadowMapType>
} = useThrelte()
```

**Common uses:**

```svelte
<!-- Invalidate frame (on-demand) -->
const { invalidate } = useThrelte()
someMesh.position.x = 5
invalidate()

<!-- Advance manual rendering (manual mode) -->
const { advance } = useThrelte()
advance()

<!-- Access camera and renderer -->
const { camera, renderer } = useThrelte()
console.log($camera, renderer)

<!-- Change tone mapping -->
const { toneMapping } = useThrelte()
toneMapping.set(THREE.LinearToneMapping)
```

---

### `useTask()`

Creates a task that executes code every frame. Part of Threlte's **Task Scheduling System**.

#### Anonymous Task

```svelte
useTask((delta) => {
  // Runs every frame. delta = time since last frame
  mesh.rotation.y += delta * 0.5
})
```

Returns `{ task, started }`.

#### Task with Key

```svelte
const { task, started } = useTask('my-task', (delta) => {
  // Referenceable by key in dependencies
})
```

#### Task in a Specific Stage

```svelte
const { renderStage } = useThrelte()

useTask(
  (delta) => { /* ... */ },
  { stage: renderStage }
)
```

#### Task Dependencies

```svelte
useTask(
  (delta) => { /* runs AFTER otherTask */ },
  { after: otherTask }
)

useTask(
  (delta) => { /* runs BEFORE otherTask */ },
  { before: otherTask }
)

// By key (can be declared in any order)
useTask(
  (delta) => { /* ... */ },
  { after: 'some-task-key' }
)
```

#### Starting/Stopping Tasks

```svelte
let running = $state(false)

useTask(
  (delta) => { /* ... */ },
  { running: () => running }
)

running = true   // starts
running = false  // stops
```

#### useTask and On-Demand Rendering

```svelte
const { invalidate } = useThrelte()

useTask(
  (delta) => {
    // Does not invalidate automatically
    if (someCondition) {
      invalidate()
    }
  },
  { autoInvalidate: false }
)
```

#### Updating Objects (animation)

```svelte
<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import type { Mesh } from 'three'

  let mesh = $state.raw<Mesh>()

  useTask((delta) => {
    if (!mesh) return
    mesh.rotation.y += delta * 0.5
  })
</script>

<T.Mesh bind:ref={mesh}>
  <T.BoxGeometry />
</T.Mesh>
```

#### Custom Render Pipeline / Postprocessing

```svelte
<script>
  import { useTask, useThrelte } from '@threlte/core'
  import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing'

  const { scene, renderer, camera, size, renderStage, autoRender } = useThrelte()

  const composer = new EffectComposer(renderer)

  $effect(() => {
    composer.removeAllPasses()
    composer.addPass(new RenderPass(scene, $camera))
    composer.addPass(new EffectPass($camera, new BloomEffect({ intensity: 1 })))
  })

  $effect(() => composer.setSize($size.width, $size.height))

  // Disable auto-render
  $effect(() => {
    const before = autoRender.current
    autoRender.set(false)
    return () => autoRender.set(before)
  })

  useTask(
    (delta) => composer.render(delta),
    { stage: renderStage, autoInvalidate: false }
  )
</script>
```

> With SvelteKit, add `ssr: { noExternal: ['postprocessing'] }` to `vite.config.js`.

---

### `useStage()`

Creates or retrieves a **stage** (a group of tasks executed in a specific order).

```svelte
const { renderStage } = useThrelte()

// Creates a stage that runs AFTER renderStage
const afterRenderStage = useStage('after-render', {
  after: renderStage
})

// Creates a stage that runs BEFORE mainStage
const beforeMainStage = useStage('before-main', {
  before: mainStage
})
```

#### Stage with Custom Callback

```svelte
const conditionalStage = useStage('conditional', {
  after: renderStage,
  callback: (delta, runTasks) => {
    if (shouldRun) {
      runTasks()            // runs with frame delta
      runTasks(0.005)       // runs with custom delta
    }
  }
})
```

---

### `useLoader()`

Loads assets using any `THREE.Loader` class. Results are **cached** - calls with the same path return the same reference.

#### Instantiating a Loader

```svelte
<script>
  import { useLoader } from '@threlte/core'
  import { TextureLoader } from 'three'

  const { load } = useLoader(TextureLoader)
</script>
```

#### Loader with Args

```svelte
<script>
  import { useLoader, useThrelte } from '@threlte/core'
  import { SplatLoader } from '@pmndrs/vanilla'

  const { renderer } = useThrelte()
  const { load } = useLoader(SplatLoader, { args: [renderer] })
</script>
```

#### Loading an Asset

```svelte
const texture = load('path/to/texture.png')
<!-- texture is an AsyncWritable<Texture> - initially undefined -->
```

#### Await Block

```svelte
{#await load('path/to/texture.png') then map}
  <T.MeshStandardMaterial {map} />
{/await}
```

#### Loading Multiple Assets

```svelte
// Array
const textures = load(['tex1.png', 'tex2.png'])
<!-- $textures = [Texture, Texture] -->

// Map
const textures = load({
  diffuse: 'diffuse.png',
  normal: 'normal.png'
})
<!-- $textures = { diffuse: Texture, normal: Texture } -->
```

#### Transforming the Result

```svelte
const texture = load('texture.png', {
  transform: (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }
})
```

---

### `useThrelteUserContext()`

Custom context store, scoped to `<Canvas>`. Ideal for communication between reusable components.

```svelte
// Define context
const ctx = useThrelteUserContext('my-plugin', () => ({
  foo: 'bar'
}))
```

```svelte
// Consume context
const ctx = useThrelteUserContext('my-plugin')
console.log($ctx) // { foo: 'bar' }
```

```svelte
// Access entire context
const userCtx = useThrelteUserContext()
console.log($userCtx) // { 'my-plugin': { foo: 'bar' }, ... }
```

---

## Task Scheduling System

Threlte has a system of **stages and tasks** to control the order of code execution per frame.

### Default Stages

| Stage | Description |
|---|---|
| `mainStage` | Main stage. Tasks here run every frame |
| `renderStage` | Render stage. Runs when a re-render is needed (on-demand) |

### Execution Flow (per frame)

```
1. mainStage tasks execute (in dependency order)
2. renderStage tasks execute (including rendering)
```

### Execution Order

```
Frame N:
  ┌─ mainStage ─────────────────────┐
  │  task A (before: task B)         │
  │  task B                         │
  │  task C (after: task B)         │
  └─────────────────────────────────┘
  ┌─ renderStage ───────────────────┐
  │  renderScene                    │
  └─────────────────────────────────┘
```

---

## Plugins

### `injectPlugin()`

Adds functionality to all descendant `<T>` components:

```svelte
<script>
  import { injectPlugin } from '@threlte/core'

  injectPlugin('my-plugin', (args) => {
    // args.ref, args.makeDefault, args.args, etc.

    $effect(() => {
      console.log(args.ref)
    })

    return {
      pluginProps: ['myCustomProp']
    }
  })
</script>
```

- Props listed in `pluginProps` are reserved for the plugin (the `<T>` does not act on them)
- Plugins can be overridden by calling `injectPlugin` again with the same name further down the tree

**Custom plugin prop types** (in `src/app.d.ts`):

```typescript
declare global {
  namespace Threlte {
    interface UserProps {
      myCustomProp?: string
    }
  }
}

export {}
```

---

## Utilities

### `watch(store | stores[], callback)`

Watches stores and executes a callback with cleanup:

```svelte
import { watch } from '@threlte/core'

watch(store, (value) => {
  console.log(value)
  return () => { /* cleanup */ }
})

watch([store1, store2], ([v1, v2]) => {
  console.log(v1, v2)
})
```

### `observe(getter, callback)`

Runes-compatible version of `watch`. Uses `$effect` internally, callback runs on the next microtask:

```svelte
import { observe } from '@threlte/core'

let count = $state(0)

observe(() => count, (value) => {
  console.log(value)
})
```

### `asyncWritable(promise)`

Writable store initialized with a promise. Implements `then`/`catch` for use with `await` and `{#await}`:

```svelte
import { asyncWritable } from '@threlte/core'

const store = asyncWritable(loadTexture())

{#await store then texture}
  <T.MeshStandardMaterial map={texture} />
{/await}
```

### `currentWritable(initialValue)`

Writable store with a synchronous `current` property (avoids `get()` in loops):

```svelte
import { currentWritable } from '@threlte/core'

const store = currentWritable(0)

useTask(() => {
  console.log(store.current) // Synchronous access, no overhead
})
```

### `isInstanceOf(object, className)`

Type guard for Three.js classes (uses the `isFoo` property, faster than `instanceof`):

```svelte
import { isInstanceOf } from '@threlte/core'

if (isInstanceOf(obj, 'Object3D')) {
  obj.position.x = 5
}
```

---

## Common Patterns

### Basic Scene with Camera and Lighting

```svelte
<script lang="ts">
  import { T, useTask } from '@threlte/core'
</script>

<T.PerspectiveCamera makeDefault position={[5, 5, 5]}
  oncreate={(ref) => ref.lookAt(0, 0, 0)}
/>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[10, 10, 5]} castShadow />

<T.Mesh castShadow>
  <T.BoxGeometry args={[1, 1, 1]} />
  <T.MeshStandardMaterial color="hotpink" />
</T.Mesh>

<T.Mesh receiveShadow position={[0, -0.5, 0]}>
  <T.BoxGeometry args={[10, 1, 10]} />
  <T.MeshStandardMaterial />
</T.Mesh>
```

### Animation with useTask

```svelte
<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import type { Mesh } from 'three'

  let cube = $state.raw<Mesh>()

  useTask((delta) => {
    if (!cube) return
    cube.rotation.x += delta
    cube.rotation.y += delta * 0.5
  })
</script>

<T.Mesh bind:ref={cube}>
  <T.BoxGeometry />
  <T.MeshStandardMaterial color="cyan" />
</T.Mesh>
```

### Loading a Texture

```svelte
<script lang="ts">
  import { T, useLoader } from '@threlte/core'
  import { TextureLoader } from 'three'

  const { load } = useLoader(TextureLoader)
</script>

{#await load('/texture.png') then map}
  <T.Mesh>
    <T.SphereGeometry />
    <T.MeshStandardMaterial {map} />
  </T.Mesh>
{/await}
```

### OrbitControls

```svelte
<script lang="ts">
  import { T, extend, useThrelte } from '@threlte/core'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

  extend({ OrbitControls })
  const { renderer } = useThrelte()
</script>

<T.PerspectiveCamera makeDefault position={[5, 5, 5]}>
  {#snippet children({ ref })}
    <T.OrbitControls args={[ref, renderer.domElement]} />
  {/snippet}
</T.PerspectiveCamera>
```

### Reactive Props

```svelte
<script>
  let color = $state('red')
</script>

<T.Mesh>
  <T.BoxGeometry />
  <!-- Re-renders automatically when color changes -->
  <T.MeshStandardMaterial color={color} />
</T.Mesh>

<button onclick={() => color = 'blue'}>Blue</button>
<button onclick={() => color = 'green'}>Green</button>
```

### Object Hierarchy

```svelte
<T.Group position={[0, 2, 0]}>
  <T.Group rotation={[0, Math.PI / 4, 0]}>
    <T.Mesh>
      <T.BoxGeometry />
      <T.MeshStandardMaterial color="orange" />
    </T.Mesh>
  </T.Group>
</T.Group>
```

---

## Important Tips

- **`makeDefault` on camera**: Always set `makeDefault` on the camera you want to use, otherwise the scene renders with Threlte's invisible default camera.
- **`invalidate()`**: In `on-demand` mode, always call `invalidate()` after manually modifying objects.
- **Don't change `args`**: Avoid changing `args` after creation, as it recreates the Three.js object instance.
- **Constant types**: The type of a reactive prop must remain constant (don't change from array to number, for example).
- **Extend for external classes**: Use `extend()` to use OrbitControls and other classes from `three/examples/jsm` with dot notation.
- **useLoader cache**: The loader caches results - same paths return the same reference.
- **useTask autoInvalidate**: By default, `useTask` invalidates the frame automatically. Use `autoInvalidate: false` for manual control.
- **Pierced props**: Use `position.y={1}` instead of `position={[0, 1, 0]}` to update only one coordinate (fewer updates).

---

## Useful Links

- Threlte Core official docs: https://threlte.xyz/docs/reference/core/getting-started/
- Three.js Docs: https://threejs.org/docs/
- Threlte Repository: https://github.com/threlte/threlte
