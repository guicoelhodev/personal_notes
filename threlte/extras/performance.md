# @threlte/extras - Performance

> Componentes e hooks de otimizacao de performance do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `<Instance>` + `<InstancedMesh>`

Renderizacao instanciada para muitos objetos com mesma geometria e material. Reduz draw calls.

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

**`<Instance>` props:** `color`, `id`. Suporta transform e interatividade.

**Multiplos InstancedMesh:**

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

Cria `InstancedMesh` automaticamente para cada `THREE.Mesh` passado (util com `useGltf`).

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

Sprites animados instanciados (early version). Requer metadata de spritesheet.

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

Hook: `useInstancedSprite()` retorna `{ updatePosition, count, animationMap, sprite }`.

---

## `<Detailed>`

Abstracao de Three.js LOD. Troca modelos por versoes de menor detalhe com base na distancia.

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

Filhos aceitam `distance` e `hysteresis` props.

---

## `<PerfMonitor>`

Monitor de performance (three-perf). Drop-in child de `<Canvas>`.

```svelte
<Canvas>
  <PerfMonitor anchorX="right" logsPerSecond={30} />
  <Scene />
</Canvas>
```

Props: `anchorX`, `anchorY`, `logsPerSecond`, `visible`, `enabled`, `showGraph`, `memory`, `scale`, `guiVisible`, `actionToCallUI`.

---

## `meshBounds`

Funcao de raycast otimizada (bounding sphere + box). Melhora performance trocando precisao.

```svelte
<T.Mesh raycast={meshBounds}>
  <T.BoxGeometry />
</T.Mesh>
```

Pode ser aplicado via plugin global:

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
