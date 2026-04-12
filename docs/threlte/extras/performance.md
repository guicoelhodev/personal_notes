# @threlte/extras - Performance

> Performance optimization components and hooks from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `<Instance>` + `<InstancedMesh>`

Instanced rendering for many objects with the same geometry and material. Reduces draw calls.

```svelte
<InstancedMesh limit={10000}>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />

  <Instance position.x={-2} color="red" />
  <Instance position.x={0} />
  <Instance position.x={2} scale={1.5} />
</InstancedMesh>
```

**`<InstancedMesh>` props:** `id`, `limit` (default 1000), `range`, `update`.

**`<Instance>` props:** `color`, `id`. Supports transforms and interactivity.

**Multiple InstancedMesh:**

```svelte
<InstancedMesh id="tree">
  <T is={treeGeometry} />
  <T.MeshStandardMaterial map={treeTexture} />
  <InstancedMesh id="leaf">
    <T is={leafGeometry} />
    <T.MeshStandardMaterial map={leafTexture} />
    <T.Group position.x={1}>
      <Instance id="tree" />
      <Instance id="leaf" />
    </T.Group>
  </InstancedMesh>
</InstancedMesh>
```

---

## `<InstancedMeshes>`

Automatically creates `InstancedMesh` for each `THREE.Mesh` passed (useful with `useGltf`).

```svelte
<script>
  import { useGltf, InstancedMeshes } from '@threlte/extras'
  const gltf = useGltf('model.gltf')
</script>

{#if $gltf}
  <InstancedMeshes meshes={$gltf.nodes}>
    {#snippet children({ components: { Cube } })}
      <Cube position.y={2} />
    {/snippet}
  </InstancedMeshes>
{/if}
```

---

## `<InstancedSprite>`

Instanced animated sprites (early version). Requires spritesheet metadata.

```svelte
<InstancedSprite {spritesheet} count={500} fps={9} billboarding>
  {#snippet children({ Instance })}
    {#each { length: 500 } as _, i}
      <Instance id={i} position={[Math.random()*100, Math.random()*100, 0]} />
    {/each}
  {/snippet}
</InstancedSprite>
```

Props: `count`, `spritesheet`, `fps`, `playmode` (`'FORWARD'|'REVERSE'|'PAUSE'|'PINGPONG'`), `billboarding`, `randomPlaybackOffset`, `transparent`, `alphaTest`, `autoUpdate`.

Hook: `useInstancedSprite()` returns `{ updatePosition, count, animationMap, sprite }`.

---

## `<Detailed>`

Three.js LOD abstraction. Swaps models for lower-detail versions based on distance.

```svelte
<Detailed>
  <T.Mesh> <!-- Alta resolucao, distancia 0 -->
    <T.SphereGeometry args={[1, 64, 64]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
  <T.Mesh distance={10}> <!-- Baixa resolucao, distancia 10+ -->
    <T.SphereGeometry args={[1, 8, 8]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</Detailed>
```

Children accept `distance` and `hysteresis` props.

---

## `<PerfMonitor>`

Performance monitor (three-perf). Drop-in child of `<Canvas>`.

```svelte
<Canvas>
  <PerfMonitor anchorX="right" logsPerSecond={30} />
  <Scene />
</Canvas>
```

Props: `anchorX`, `anchorY`, `logsPerSecond`, `visible`, `enabled`, `showGraph`, `memory`, `scale`, `guiVisible`, `actionToCallUI`.

---

## `meshBounds`

Optimized raycast function (bounding sphere + box). Improves performance by trading precision.

```svelte
<T.Mesh raycast={meshBounds}>
  <T.BoxGeometry />
</T.Mesh>
```

Can be applied via a global plugin:

```svelte
<script>
  import { injectPlugin, isInstanceOf } from '@threlte/core'
  import { meshBounds } from '@threlte/extras'

  injectPlugin('mesh-bounds', (args) => {
    if (isInstanceOf(args.ref, 'Mesh')) {
      args.ref.raycast = meshBounds
    }
  })
</script>
```
