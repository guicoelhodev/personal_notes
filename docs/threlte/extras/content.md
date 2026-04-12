# @threlte/extras - Content

> Components and hooks for loading and rendering content from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `<GLTF>`

Loads a glTF/glb model. The `url` prop is reactive.

```svelte
<script>
  import { GLTF, useDraco, useKtx2, useMeshopt } from '@threlte/extras'
</script>

<GLTF url="/models/helmet/DamagedHelmet.gltf" />
```

**Compression:**

```svelte
<script>
  const dracoLoader = useDraco()       // DRACO (default: Google CDN)
  const ktx2Loader = useKtx2('path')   // KTX2 textures
  const meshoptDecoder = useMeshopt()  // Meshopt
</script>

<GLTF url="/model.glb" {dracoLoader} />
```

**Props:** `url`, `dracoLoader`, `ktx2Loader`, `meshoptDecoder`

**Bindings:** `gltf`, `scene`, `animations`, `asset`, `cameras`, `scenes`, `materials`, `nodes`

**Events:** `load`, `unload`, `error`

---

## `useGltf()`

Hook for loading glTF and accessing nodes/materials individually. Returns `AsyncWritable` (suspense-ready).

```svelte
<script lang="ts">
  import { useGltf } from '@threlte/extras'
  import type { Mesh, MeshStandardMaterial } from 'three'

  const gltf = useGltf<{
    nodes: { MeshA: Mesh; MeshB: Mesh }
    materials: { MaterialA: MeshStandardMaterial }
  }>('/model.glb')
</script>

{#if $gltf}
  <T is={$gltf.nodes.MeshA} />
{/if}
```

Supports DRACO, KTX2, and Meshopt (same hooks as `<GLTF>`).

---

## `useGltfAnimations()`

Hook for controlling animations of a GLTF model.

```svelte
<script>
  import { useGltf, useGltfAnimations } from '@threlte/extras'

  const gltf = useGltf('/model.glb')
  const { actions, mixer } = useGltfAnimations<'Walk' | 'Idle'>(gltf)

  $effect(() => { $actions['Walk']?.play() })
  mixer.timeScale = 0.5
</script>
```

Can be used with `<GLTF>` (no arguments, bind `gltf`) or with `useGltf` (passing the store). Accepts an optional second argument to apply animations to a different root.

---

## `useTexture()`

Convenience hook that returns `AsyncWritable<Texture>`. Automatically assigns the renderer's `colorSpace`.

```svelte
<script>
  import { useTexture } from '@threlte/extras'
  import { RepeatWrapping } from 'three'

  const texture = useTexture('texture.png', {
    transform: (tex) => {
      tex.wrapS = RepeatWrapping
      tex.wrapT = RepeatWrapping
      tex.repeat.set(4, 4)
      return tex
    }
  })
</script>

{#await texture then map}
  <T.Mesh>
    <T.SphereGeometry />
    <T.MeshBasicMaterial {map} />
  </T.Mesh>
{/await}
```

---

## `<HTML>`

Binds HTML content to any scene object. Automatically projects to the object's position.

```svelte
<HTML transform>
  <h1>Hello World</h1>
</HTML>
```

**Main props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `transform` | `boolean` | `false` | Applies CSS matrix3d |
| `center` | `boolean` | `false` | Adds CSS transform -50%/-50% (only without transform) |
| `occlude` | `boolean \| Object3D[] \| 'blending'` | `false` | Hides HTML behind geometry |
| `sprite` | `boolean` | `false` | Renders as sprite (with transform) |
| `portal` | `HTMLElement` | - | Mounts content in another element |
| `pointerEvents` | `string` | `'auto'` | Pointer events control |
| `autoRender` | `boolean` | `true` | Pauses render task |
| `distanceFactor` | `number` | - | Scales based on camera distance |
| `fullscreen` | `boolean` | `false` | Fullscreen |
| `zIndexRange` | `[number, number]` | `[16777271, 0]` | z-index range |

**Blending occlusion** requires `pointer-events: none` on the canvas.

**Manual rendering:**

```svelte
<HTML autoRender={false} bind:this={html}>
  <h1>Hello</h1>
</HTML>
```

`html.render()` to manually render a frame.

> **Alternative:** Use [threlte-uikit](https://github.com/threlte/threlte-uikit) for XR sessions where `<HTML>` doesn't work.

---

## `<SVG>`

Renders SVG using Three.js SVGLoader.

```svelte
<SVG src="/icon.svg" scale={0.005} position.x={-1} />
```

**Props:** `src` (URL or SVG data), `fillMaterialProps`, `fillMeshProps`, `skipFill`, `skipStrokes`, `strokeMaterialProps`, `strokeMeshProps`

---

## `<Text>`

Renders 2D text using troika-three-text. **Suspense-ready**.

```svelte
<Text text="Hello World" color="white" fontSize={1} anchorX="50%" anchorY="100%" />
```

Main props: `text`, `fontSize`, `color`, `font`, `anchorX`, `anchorY`, `textAlign`, `maxWidth`, `letterSpacing`, `lineHeight`, `outlineWidth`, `outlineColor`, `strokeWidth`, `strokeColor`, `characters` (for preload), `whiteSpace`, `direction`, `depthOffset`, `curveRadius`, `overflowWrap`.

---

## `<Text3DGeometry>`

Renders 3D text as extruded geometry (Three.js TextGeometry). **Suspense-ready**.

```svelte
<T.Mesh>
  <Text3DGeometry text="Hello World" font="/fonts/custom.blob" />
  <T.MeshStandardMaterial />
</T.Mesh>
```

**Props:** `font` (Font or path), `text`, `size`, `depth`/`height`, `bevelEnabled`, `bevelSize`, `bevelThickness`, `bevelOffset`, `bevelSegments`, `curveSegments`, `smooth`, `extrudePath`, `steps`.

**Centering text:**

```svelte
<Align>
  {#snippet children({ align })}
    <T.Mesh>
      <Text3DGeometry text="Hello!" oncreate={align} />
      <T.MeshStandardMaterial />
    </T.Mesh>
  {/snippet}
</Align>
```

---

## `<Decal>`

Applies a decal (projected texture) onto geometry.

---

## `<RoundedBoxGeometry>`

Box geometry with rounded corners.
