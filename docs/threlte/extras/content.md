# @threlte/extras - Content

> Componentes e hooks para carregamento e renderizacao de conteudo do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `<GLTF>`

Carrega um modelo glTF/glb. A prop `url` e reativa.

```svelte
<script>
  import { GLTF, useDraco, useKtx2, useMeshopt } from '@threlte/extras'
</script>

<GLTF url="/models/helmet/DamagedHelmet.gltf" />
```

**Compressao:**

```svelte
<script>
  const dracoLoader = useDraco()       // DRACO (default: CDN Google)
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

Hook para carregar glTF e acessar nodes/materials individualmente. Retorna `AsyncWritable` (suspense-ready).

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

Suporta DRACO, KTX2 e Meshopt (mesmos hooks do `<GLTF>`).

---

## `useGltfAnimations()`

Hook para controlar animacoes de um modelo GLTF.

```svelte
<script>
  import { useGltf, useGltfAnimations } from '@threlte/extras'

  const gltf = useGltf('/model.glb')
  const { actions, mixer } = useGltfAnimations<'Walk' | 'Idle'>(gltf)

  $effect(() => { $actions['Walk']?.play() })
  mixer.timeScale = 0.5
</script>
```

Pode ser usado com `<GLTF>` (sem argumentos, bind `gltf`) ou com `useGltf` (passando o store). Aceita um segundo argumento opcional para aplicar animacoes a uma root diferente.

---

## `useTexture()`

Hook conveniente que retorna `AsyncWritable<Texture>`. Atribui automaticamente o `colorSpace` do renderer.

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

Vincula conteudo HTML a qualquer objeto da cena. Projeta automaticamente para a posicao do objeto.

```svelte
<HTML transform>
  <h1>Hello World</h1>
</HTML>
```

**Props principais:**

| Prop | Tipo | Default | Descricao |
|---|---|---|---|
| `transform` | `boolean` | `false` | Aplica matrix3d CSS |
| `center` | `boolean` | `false` | Adiciona CSS transform -50%/-50% (somente sem transform) |
| `occlude` | `boolean \| Object3D[] \| 'blending'` | `false` | Oculta HTML atras de geometria |
| `sprite` | `boolean` | `false` | Renderiza como sprite (com transform) |
| `portal` | `HTMLElement` | - | Monta conteudo em outro elemento |
| `pointerEvents` | `string` | `'auto'` | Controle de pointer events |
| `autoRender` | `boolean` | `true` | Pausa task de render |
| `distanceFactor` | `number` | - | Escala baseada na distancia da camera |
| `fullscreen` | `boolean` | `false` | Tela cheia |
| `zIndexRange` | `[number, number]` | `[16777271, 0]` | Range de z-index |

**Oclusao blending** requer `pointer-events: none` no canvas.

**Render manual:**

```svelte
<HTML autoRender={false} bind:this={html}>
  <h1>Hello</h1>
</HTML>
```

`html.render()` para renderizar um frame manualmente.

> **Alternativa:** Use [threlte-uikit](https://github.com/threlte/threlte-uikit) para sessoes XR onde `<HTML>` nao funciona.

---

## `<SVG>`

Renderiza SVG usando Three.js SVGLoader.

```svelte
<SVG src="/icon.svg" scale={0.005} position.x={-1} />
```

**Props:** `src` (URL ou dados SVG), `fillMaterialProps`, `fillMeshProps`, `skipFill`, `skipStrokes`, `strokeMaterialProps`, `strokeMeshProps`

---

## `<Text>`

Renderiza texto 2D usando troika-three-text. **Suspense-ready**.

```svelte
<Text text="Hello World" color="white" fontSize={1} anchorX="50%" anchorY="100%" />
```

Props principais: `text`, `fontSize`, `color`, `font`, `anchorX`, `anchorY`, `textAlign`, `maxWidth`, `letterSpacing`, `lineHeight`, `outlineWidth`, `outlineColor`, `strokeWidth`, `strokeColor`, `characters` (para preload), `whiteSpace`, `direction`, `depthOffset`, `curveRadius`, `overflowWrap`.

---

## `<Text3DGeometry>`

Renderiza texto 3D como geometria extrudada (Three.js TextGeometry). **Suspense-ready**.

```svelte
<T.Mesh>
  <Text3DGeometry text="Hello World" font="/fonts/custom.blob" />
  <T.MeshStandardMaterial />
</T.Mesh>
```

**Props:** `font` (Font ou path), `text`, `size`, `depth`/`height`, `bevelEnabled`, `bevelSize`, `bevelThickness`, `bevelOffset`, `bevelSegments`, `curveSegments`, `smooth`, `extrudePath`, `steps`.

**Centralizar texto:**

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

Aplica decalque (textura projetada) sobre geometria.

---

## `<RoundedBoxGeometry>`

Geometria de caixa com cantos arredondados.
