# @threlte/extras - Visual Effects

> Visual effect components and hooks from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `<Edges>`

Displays edges of the parent geometry (EdgesGeometry). Edges are visible when the angle between faces exceeds `thresholdAngle`.

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Edges color="black" thresholdAngle={20} scale={1.01} />
</T.Mesh>
```

---

## `<Wireframe>`

Anti-aliased shader-based wireframe (uses barycentric coordinates).

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Wireframe thickness={0.7} stroke="red" fill="green" fillOpacity={0.5} />
</T.Mesh>
```

**Automatically converts indexed geometries to non-indexed.**

Props: `thickness`, `stroke`, `strokeOpacity`, `fill`, `fillOpacity`, `fillMix`, `squeeze`, `squeezeMin`, `squeezeMax`, `dash`, `dashInvert`, `dashLength`, `dashRepeats`, `colorBackfaces`, `backfaceStroke`, `simplify`.

---

## `<Outlines>`

Ornamental outline via inverted-hull. Supports Mesh, SkinnedMesh, and InstancedMesh.

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Outlines color="black" thickness={0.05} />
</T.Mesh>
```

Props: `color`, `thickness`, `angle`, `opacity`, `screenspace` (zoom-independent thickness), `polygonOffset`, `renderOrder`, `toneMapped`.

---

## `<AsciiRenderer>`

Renders the scene as ASCII (port of Three.js AsciiEffect).

```svelte
<AsciiRenderer characters=" .:-+*=%@#" fgColor="#ff2400" bgColor="#000" />
```

Props: `characters`, `fgColor`, `bgColor`, `options` ({ alpha, block, color, invert, resolution, scale }), `autoRender`, `scene`, `camera`.

Exports: `start()`, `stop()`, `getEffect()`.

---

## `<CubeCamera>`

Three.js CubeCamera wrapper with update control.

```svelte
<CubeCamera resolution={256} frames={Infinity} near={0.1}>
  {#snippet children({ renderTarget })}
    <T.Mesh>
      <T.SphereGeometry />
      <T.MeshStandardMaterial envMap={renderTarget.texture} metalness={1} roughness={0} />
    </T.Mesh>
  {/snippet}
</CubeCamera>
```

Props: `resolution`, `frames`, `near`, `far`, `background`, `fog`, `autoStart`, `onupdatestart`, `onupdatestop`.

Exports: `update()`, `restart()`.

---

## `<FakeGlowMaterial>`

Glow outline using a custom shader (no post-processing).

```svelte
<T.Mesh>
  <FakeGlowMaterial glowColor="red" falloff={0.1} glowSharpness={1} glowInternalRadius={6} />
  <T.IcosahedronGeometry args={[4, 4]} />
</T.Mesh>
```

**Requires a smooth mesh.** For sharp meshes, use a sphere as a substitute.

---

## `<ImageMaterial>`

Image material with auto-cover and color processing.

```svelte
<T.Mesh>
  <T.PlaneGeometry />
  <ImageMaterial url="photo.jpg" transparent side={DoubleSide} zoom={1.1} radius={0.1} />
</T.Mesh>
```

**Color processing:** `brightness`, `contrast`, `hue` (0-1), `saturation`, `lightness`, `negative`, `monochromeColor`, `monochromeStrength`, `colorProcessingTexture` (RGBA channels control HSLA).

---

## `<MeshRefractionMaterial>`

Refraction material (glass/diamond). Requires `npm install three-mesh-bvh`.

```svelte
<T.Mesh>
  <MeshRefractionMaterial envMap={texture} ior={2.4} bounces={2} fresnel={0} />
  <T.IcosahedronGeometry args={[4, 0]} />
</T.Mesh>
```

Props: `envMap`, `ior`, `bounces`, `fresnel`, `aberrationStrength`, `color`, `fastChrome`.

---

## `<MeshDiscardMaterial>`

Material that renders nothing (discards fragments). Unlike `visible={false}`: shadows and children remain visible.

```svelte
<T.Mesh castShadow>
  <MeshDiscardMaterial />
  <T.BoxGeometry />
</T.Mesh>
```

---

## `<ShadowMaterial>`

Cheap material that mimics shadows without lights. Based on CanvasTexture.

---

## `<Mask>`

Stencil mask for reveal effects.

---

## `<UvMaterial>`

Material that visualizes the UVs of a geometry.

---

## `<PointsMaterial>`

Material for points/particles.

---

## `<AnimatedSpriteMaterial>`

Material for animated sprites.

---

## `<MeshLineGeometry>` / `<MeshLineMaterial>`

Geometry and material for mesh-based 3D lines (smooth, thick).

---

## `<LinearGradientTexture>` / `<RadialGradientTexture>`

Gradient textures (linear and radial).

---

## `useFBO()`

Creates a `WebGLRenderTarget` (Framebuffer Object). Useful for post-processing.

```svelte
const target = useFBO({ size: { width: 512, height: 512 }, depth: true })
```

If `size` is not provided, it follows the canvas size. `depth`: boolean, `{ width, height }` object, or `DepthTexture`.
