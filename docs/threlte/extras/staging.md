# @threlte/extras - Staging

> Scene preparation components and hooks from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `<Environment>`

Loads an equirectangular texture and sets `scene.environment` and/or `scene.background`.

```svelte
<Environment url="/env.hdr" isBackground />
```

**Supports:** `.exr`, `.hdr`, `.jpg` and others via TextureLoader.

**Props:** `url`, `texture` (pre-loaded), `isBackground`, `scene`, `ground` (boolean | `{ height, radius, resolution }` for skybox with floor).

**Ground projected skybox:**

```svelte
<Environment url="/env.hdr" isBackground ground={{ height: 15, radius: 100 }} bind:skybox />
```

**Suspense:** textures loaded via `url` are suspense-ready.

---

## `<CubeEnvironment>`

Similar to `<Environment>` but uses `CubeTexture` (6 URLs). Order: `[+X, -X, +Y, -Y, +Z, -Z]`.

---

## `<VirtualEnvironment>`

Creates dynamic environment maps via cube camera. Renders internal content as a cubemap.

```svelte
<VirtualEnvironment frames={1} visible={false} resolution={256} />
```

Props: `frames`, `near`, `far`, `resolution`, `visible`, `isBackground`, `scene`.

Exports: `restart()`, `update()`.

---

## `<ContactShadows>`

Contact shadows (port of drei). Faces up (Y+) by default.

```svelte
<ContactShadows
  opacity={1}
  scale={10}
  blur={1}
  far={10}
  resolution={256}
  color="#000000"
/>
```

Props: `blur`, `color`, `depthWrite`, `far`, `frames`, `height`, `opacity`, `resolution`, `scale`, `smooth`, `width`.

Export: `refresh()`.

**Optimization:** Use `frames={1}` for static scenes.

---

## `<SoftShadows>`

Injects PCSS (Percentage-Closer Soft Shadows) into shaders. Mounting/unmounting recompiles shaders.

```svelte
<SoftShadows samples={10} size={25} focus={0} />
```

---

## `<BakeShadows>`

Freezes shadow maps on mount. Static shadows, calculated once.

```svelte
<BakeShadows />
```

---

## `<ShadowAlpha>`

Makes shadows respect the parent material's opacity and alphaMap.

```svelte
<T.Mesh castShadow>
  <T.BoxGeometry />
  <T.MeshStandardMaterial transparent opacity={0.5} />
  <ShadowAlpha />
</T.Mesh>
```

Props: `opacity`, `alphaMap`.

---

## `<Float>`

Makes content float/hover (port of drei).

```svelte
<Float floatIntensity={5} rotationIntensity={2} rotationSpeed={1}>
  <T.Mesh>
    <T.BoxGeometry />
    <T.MeshStandardMaterial color="orange" />
  </T.Mesh>
</Float>
```

Props: `floatingRange`, `floatIntensity`, `rotationIntensity`, `rotationSpeed`, `speed`, `seed`. All accept `number` or `[x, y, z]`.

---

## `<Grid>`

Robust grid with adjustable parameters.

```svelte
<Grid
  type="grid"        // 'grid' | 'lines' | 'circular' | 'polar'
  cellSize={1}
  sectionSize={10}
  cellColor="#000"
  sectionColor="#00e"
  cellThickness={1}
  sectionThickness={2}
  infiniteGrid
  fadeDistance={100}
  fadeStrength={1}
  followCamera={false}
  plane="xz"
/>
```

**Types:** `grid` (default), `lines` (with `axis` prop), `circular`, `polar` (with `maxRadius`, `cellDividers`, `sectionDividers`).

---

## `<Stars>`

Star field with twinkling shader (port of drei).

```svelte
<Stars count={5000} radius={50} depth={50} factor={6} speed={0.5} fade />
```

---

## `<Sky>`

Three.js Sky object rendered as a cubemap for the environment.

```svelte
<Sky elevation={0.5} azimuth={180} turbidity={10} rayleigh={3} />
```

Props: `azimuth`, `cubeMapSize`, `elevation`, `mieCoefficient`, `mieDirectionalG`, `rayleigh`, `scale`, `setEnvironment` (default true), `turbidity`.

---

## `<Sparkles>`

Shader-based particles.

```svelte
<Sparkles count={100} color="yellow" scale={5} size={3} speed={0.4} />
```

Props: `count`, `color`, `size`, `scale`, `speed`, `noise`, `opacity`.

---

## `<BackdropGeometry>`

Studio-style curved plane (for breaking light/shadows).

```svelte
<BackdropGeometry height={1} length={1} width={1} />
```

---

## `<Billboard>`

Rotates content to always face the camera.

```svelte
<Billboard>
  <T.Mesh>
    <T.PlaneGeometry args={[2, 2]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</Billboard>
```

Props: `follow` (boolean | Object3D, default true).

---

## `<CSM>`

Cascaded Shadow Maps for sun shadows over large terrains.

```svelte
<CSM
  enabled
  args={{ lightDirection: new Vector3(1, -1, 1).normalize() }}
>
  <!-- scene -->
</CSM>
```

**Only supports** `MeshStandardMaterial` and `MeshPhongMaterial`. **Do not use** `castShadow` on lights with CSM active.

---

## `<Align>`

Calculates bounding box and aligns children. Accepts `x`, `y`, `z` (-1 to 1 or false to ignore).

```svelte
<Align x={0} y={0} z={false}>
  <T.Mesh position={[-1, 0, 0]}><T.BoxGeometry /><T.MeshStandardMaterial /></T.Mesh>
  <T.Mesh position={[1, 0, -2]}><T.BoxGeometry args={[1, 5, 2]} /><T.MeshStandardMaterial /></T.Mesh>
</Align>
```

Props: `x`, `y`, `z`, `auto`, `precise`. Event: `align`. Export: `align()`.

---

## `<Bounds>`

Automatically centers the camera on children.

```svelte
<Bounds animate={true} margin={1} enabled={true}>
  <!-- objects -->
</Bounds>
```

---

## `<Resize>`

Normalizes children dimensions (scales by max bounding box to 0-1 range).

```svelte
<Resize axis="x">
  <T.Mesh />
</Resize>
```

Props: `auto`, `axis`, `box`, `precise`. Export: `resize()`.

---

## `<Portal>` / `<PortalTarget>`

Renders children at another location in the component tree.

```svelte
<!-- In ComponentA: -->
<T.Object3D>
  <PortalTarget id="trail" />
</T.Object3D>

<!-- In ComponentB: -->
<Portal id="trail">
  <T.Mesh><T.BoxGeometry /><T.MeshStandardMaterial color="red" /></T.Mesh>
</Portal>
```

---

## `<View>`

Multiple scenes in a single canvas using scissor-cut.

```svelte
<View dom={targetElement}>
  <Scene />
</View>
```

---

## `<HUD>`

Heads-up display - a new scene rendered on top of the main one with a separate context.

```svelte
<HUD>
  <Scene />
</HUD>
```

Props: `autoRender`, `stage`, `toneMapping`.

---

## `layers()`

Plugin that provides `layers` inheritance for child `<T>` components.

```svelte
<script>
  import { layers } from '@threlte/extras'
  layers()
</script>

<T.PerspectiveCamera layers={[4, 5]} />
<T.Group layers={4}>
  <T.Mesh> <!-- inherits layer 4 -->
    <T.BoxGeometry /><T.MeshStandardMaterial />
  </T.Mesh>
  <T.Mesh layers="all"> <!-- on all layers -->
    <T.BoxGeometry /><T.MeshStandardMaterial />
  </T.Mesh>
</T.Group>
```

---

## `transitions()`

Experimental plugin that enables Svelte-style transitions on Threlte components.

```svelte
<script>
  import { transitions, createTransition } from '@threlte/extras'
  transitions()

  const fade = createTransition((ref) => {
    if (!ref.transparent) { ref.transparent = true; ref.needsUpdate = true }
    return { tick(t) { ref.opacity = t }, duration: 400 }
  })
</script>

{#if visible}
  <T.MeshStandardMaterial transition={fade} />
{/if}
```

Directions: `in={fade}`, `out={fade}`, `transition={fade}`. Events: `onintrostart`, `onoutrostart`, `onintroend`, `onoutroend`.

**TypeScript:** extend `Threlte.UserProps` with `TransitionsProps` in `app.d.ts`.

---

## `useViewport()`

Returns viewport information in Three.js units.

```svelte
const viewport = useViewport()
// $viewport.width, $viewport.height, $viewport.factor, $viewport.distance
```

Accepts custom origin: `useViewport([1, 0, 1])`.
