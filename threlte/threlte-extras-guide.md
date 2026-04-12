# @threlte/extras - Guia de Referencia Rapido

> Resumo completo do pacote extras do framework [Threlte](https://threlte.xyz/) para Svelte/Three.js.
> Fonte oficial: https://threlte.xyz/docs/reference/extras/getting-started/

---

## O que e?

`@threlte/extras` fornece componentes, hooks e plugins utilitarios para aplicacoes Threlte. Os componentes sao abstracoes de um ou mais `<T>` components que encaminham props e eventos. O plugin mais notavel e `interactivity`, que permite interacao com a cena via eventos (click, pointer, etc.).

---

## Instalacao

```bash
npm install @threlte/extras
```

Requer `@threlte/core` instalado.

---

## Indice por Categoria

- **Audio:** `<Audio>`, `<AudioListener>`, `<PositionalAudio>`, `useAudioListener`, `useThrelteAudio`
- **Content:** `<Decal>`, `<GLTF>`, `<HTML>`, `<RoundedBoxGeometry>`, `<SVG>`, `<Text>`, `<Text3DGeometry>`, `useGltf`, `useGltfAnimations`, `useTexture`
- **Interaction:** `<CameraControls>`, `<Gizmo>`, `<OrbitControls>`, `<TrackballControls>`, `<TransformControls>`, `bvh`, `interactivity`, `useCursor`, `useGamepad`, `useInputMap`, `useKeyboard`, `useTrailTexture`
- **Loading:** `<Suspense>`, `onReveal`, `onSuspend`, `useProgress`, `useSuspense`
- **Performance:** `<BakeShadows>`, `<Detailed>`, `<Instance>`, `<InstancedMesh>`, `<InstancedMeshes>`, `<InstancedSprite>`, `<PerfMonitor>`, `meshBounds`
- **Staging:** `<Align>`, `<BackdropGeometry>`, `<Billboard>`, `<Bounds>`, `<ContactShadows>`, `<CSM>`, `<CubeEnvironment>`, `<Environment>`, `<Float>`, `<Grid>`, `<HUD>`, `<Portal>`, `<PortalTarget>`, `<Resize>`, `<ShadowAlpha>`, `<Sky>`, `<SoftShadows>`, `<Stars>`, `<View>`, `<VirtualEnvironment>`, `layers`, `transitions`, `useViewport`
- **Visual Effects:** `<AnimatedSpriteMaterial>`, `<AsciiRenderer>`, `<CubeCamera>`, `<Edges>`, `<FakeGlowMaterial>`, `<ImageMaterial>`, `<LinearGradientTexture>`, `<Mask>`, `<MeshDiscardMaterial>`, `<MeshLineGeometry>`, `<MeshLineMaterial>`, `<MeshRefractionMaterial>`, `<Outlines>`, `<PointsMaterial>`, `<RadialGradientTexture>`, `<ShadowMaterial>`, `<Sparkles>`, `<UvMaterial>`, `<Wireframe>`, `useFBO`

---

## Interaction

### `interactivity()`

Plugin que registra um listener global no `<canvas>` e encaminha eventos de interacao para os componentes `<T>`. **Deve ser invocado no nivel raiz** (tipicamente `Scene.svelte`).

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

Suporta: `onclick`, `onpointerdown`, `onpointerup`, `onpointermove`, `onpointerover`, `onpointerout`, `onpointerenter`, `onpointerleave`, `oncontextmenu`, `onwheel`, etc.

---

### `<OrbitControls>`

Controle de orbita da camera. **Deve ser filho direto de uma camera com `makeDefault`.**

```svelte
<T.PerspectiveCamera makeDefault position={[5, 5, 5]}>
  <OrbitControls enableDamping />
</T.PerspectiveCamera>
```

Encaminha todos os props e eventos do Three.js OrbitControls. Suporta `onchange`, `onstart`, `onend`, etc.

---

### `<CameraControls>`

Controle de camera mais avancado (baseado em three-camera-controls). Suporta zoom, rotacao, pan e transicoes suaves.

```svelte
<T.PerspectiveCamera makeDefault position={[5, 5, 5]}>
  <CameraControls />
</T.PerspectiveCamera>
```

---

### `<TransformControls>`

Gizmo de transformacao (translacao, rotacao, escala) para objetos.

```svelte
<T.Mesh bind:ref={mesh}>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
</T.Mesh>
<TransformControls object={mesh} mode="translate" />
```

`mode`: `'translate' | 'rotate' | 'scale' | 'size'`

---

### `<Gizmo>`

Gizmo visual para ajudar a posicionar e orientar objetos na cena.

---

### `<TrackballControls>`

Controle de camera estilo trackball (rotacao livre sem constraint de eixo).

---

### `useCursor()`

Hook para gerenciar o cursor do mouse baseado em interacao com objetos 3D.

---

### `useKeyboard()`

Hook para acessar estado de teclas do teclado.

```svelte
const { getKey, getPressedKeys } = useKeyboard()
```

---

### `useGamepad()`

Hook para acessar estado de gamepads conectados.

---

### `useInputMap()`

Hook para mapear acoes a inputs (teclado + gamepad).

```svelte
const { getInput, isDown, isUp } = useInputMap({
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
})
```

---

### `bvh`

Plugin que otimiza raycasting usando Bounding Volume Hierarchy (BVH). Requer `three-mesh-bvh`.

---

### `useTrailTexture()`

Hook que cria uma textura canvas-based de trilha movida por eventos de pointer.

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

Opcoes: `size`, `maxAge`, `radius`, `intensity`, `interpolate`, `smoothing`, `minForce`, `blend`, `ease`. Retorna `{ texture, onPointerMove, setTrail }`.

---

## Content

### `<GLTF>`

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

### `useGltf()`

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

### `useGltfAnimations()`

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

### `useTexture()`

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

### `<HTML>`

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

### `<SVG>`

Renderiza SVG usando Three.js SVGLoader.

```svelte
<SVG src="/icon.svg" scale={0.005} position.x={-1} />
```

**Props:** `src` (URL ou dados SVG), `fillMaterialProps`, `fillMeshProps`, `skipFill`, `skipStrokes`, `strokeMaterialProps`, `strokeMeshProps`

---

### `<Text>`

Renderiza texto 2D usando troika-three-text. **Suspense-ready**.

```svelte
<Text text="Hello World" color="white" fontSize={1} anchorX="50%" anchorY="100%" />
```

Props principais: `text`, `fontSize`, `color`, `font`, `anchorX`, `anchorY`, `textAlign`, `maxWidth`, `letterSpacing`, `lineHeight`, `outlineWidth`, `outlineColor`, `strokeWidth`, `strokeColor`, `characters` (para preload), `whiteSpace`, `direction`, `depthOffset`, `curveRadius`, `overflowWrap`.

---

### `<Text3DGeometry>`

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

### `<Decal>`

Aplica decalque (textura projetada) sobre geometria.

---

### `<RoundedBoxGeometry>`

Geometria de caixa com cantos arredondados.

---

## Audio

### `<AudioListener>`

Componente de listener de audio. **Deve ser montado antes** de `<Audio>` e `<PositionalAudio>`.

```svelte
<T.PerspectiveCamera makeDefault>
  <AudioListener />
</T.PerspectiveCamera>
```

---

### `<Audio>`

Audio global (nao-posicional). Usa Web Audio API.

```svelte
<Audio src="/audio/track.mp3" autoplay loop volume={0.5} />
```

Props: `src`, `autoplay`, `loop`, `volume`, `playbackRate`, `detune`, `id`.

---

### `<PositionalAudio>`

Audio posicional (3D). Afetado pela posicao do listener e do objeto.

```svelte
<T.Mesh>
  <PositionalAudio src="/sound.mp3" autoplay loop />
  <T.SphereGeometry />
</T.Mesh>
```

---

### `useThrelteAudio()`

Retorna o contexto de audio Threlte: `{ audioListeners, getAudioListener, addAudioListener, removeAudioListener }`.

---

### `useAudioListener()`

Retorna `THREE.AudioListener` existente ou permite operar nele via callback.

---

## Loading

### `<Suspense>`

Orquestra o carregamento de recursos em componentes filhos. Segue conceito do React Suspense.

```svelte
<script>
  import { Suspense } from '@threlte/extras'
</script>

<Suspense>
  <Model />

  {#snippet fallback()}
    <p>Loading...</p>
  {/snippet}
</Suspense>
```

**Props:** `final` (boolean) - impede re-suspensao.

**Events:** `load`, `suspend`, `error`.

**Error boundary:** tambem atua como error boundary. Use snippet `error`:

```svelte
<Suspense>
  <Model />
  {#snippet fallback()}<p>Loading...</p>{/snippet}
  {#snippet error(e)}<p>Error: {e.message}</p>{/snippet}
</Suspense>
```

---

### `useSuspense()`

Marca recursos para uso em `<Suspense>`. Retorna funcao `suspend(promise)` e store `suspended`.

```svelte
<script>
  import { useSuspense, useTexture } from '@threlte/extras'

  const suspend = useSuspense()
  const texture = suspend(useTexture('/texture.png'))
</script>
```

---

### `useProgress()`

Hook que envolve `THREE.DefaultLoadingManager`.

```svelte
const {
  active,       // boolean - se esta carregando
  item,         // string - item atual
  loaded,       // number - itens carregados
  total,        // number - total de itens
  errors,       // string[] - erros
  progress,     // number - progresso normalizado (0-1)
  finishedOnce  // boolean - se ja completou uma vez
} = useProgress()
```

---

### `onReveal(callback)`

Invoca callback quando o componente e revelado (nao mais suspenso). Funciona como `onMount` dentro de `<Suspense>`.

```svelte
onReveal(() => {
  console.log('revealed')
  return () => { /* cleanup ao suspender ou desmontar */ }
})
```

---

### `onSuspend(callback)`

Invoca callback quando o componente se torna suspenso.

---

## Performance

### `<Instance>` + `<InstancedMesh>`

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

### `<InstancedMeshes>`

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

### `<InstancedSprite>`

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

### `<Detailed>`

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

### `<PerfMonitor>`

Monitor de performance (three-perf). Drop-in child de `<Canvas>`.

```svelte
<Canvas>
  <PerfMonitor anchorX="right" logsPerSecond={30} />
  <Scene />
</Canvas>
```

Props: `anchorX`, `anchorY`, `logsPerSecond`, `visible`, `enabled`, `showGraph`, `memory`, `scale`, `guiVisible`, `actionToCallUI`.

---

### `meshBounds`

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

---

## Staging

### `<Environment>`

Carrega textura equirectangular e define `scene.environment` e/ou `scene.background`.

```svelte
<Environment url="/env.hdr" isBackground />
```

**Suporta:** `.exr`, `.hdr`, `.jpg` e outros via TextureLoader.

**Props:** `url`, `texture` (pre-loaded), `isBackground`, `scene`, `ground` (boolean | `{ height, radius, resolution }` para skybox com chao).

**Ground projected skybox:**

```svelte
<Environment url="/env.hdr" isBackground ground={{ height: 15, radius: 100 }} bind:skybox />
```

**Suspense:** texturas carregadas via `url` sao suspense-ready.

---

### `<CubeEnvironment>`

Similar a `<Environment>` mas usa `CubeTexture` (6 URLs). Ordem: `[+X, -X, +Y, -Y, +Z, -Z]`.

---

### `<VirtualEnvironment>`

Cria environment maps dinamicos via cube camera. Renderiza conteudo interno como cubemap.

```svelte
<VirtualEnvironment frames={1} visible={false} resolution={256} />
```

Props: `frames`, `near`, `far`, `resolution`, `visible`, `isBackground`, `scene`.

Exports: `restart()`, `update()`.

---

### `<ContactShadows>`

Sombras de contato (port de drei). Face para cima (Y+) por default.

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

**Otimizacao:** Use `frames={1}` para cenas estaticas.

---

### `<SoftShadows>`

Injeta PCSS (Percentage-Closer Soft Shadows) nos shaders. Montar/desmontar recompila shaders.

```svelte
<SoftShadows samples={10} size={25} focus={0} />
```

---

### `<BakeShadows>`

Congela shadow maps ao montar. Sombras estaticas, calculadas uma vez.

```svelte
<BakeShadows />
```

---

### `<ShadowAlpha>`

Faz sombras respeitarem opacidade e alphaMap do material pai.

```svelte
<T.Mesh castShadow>
  <T.BoxGeometry />
  <T.MeshStandardMaterial transparent opacity={0.5} />
  <ShadowAlpha />
</T.Mesh>
```

Props: `opacity`, `alphaMap`.

---

### `<Float>`

Faz conteudo flutuar/hover (port de drei).

```svelte
<Float floatIntensity={5} rotationIntensity={2} rotationSpeed={1}>
  <T.Mesh>
    <T.BoxGeometry />
    <T.MeshStandardMaterial color="orange" />
  </T.Mesh>
</Float>
```

Props: `floatingRange`, `floatIntensity`, `rotationIntensity`, `rotationSpeed`, `speed`, `seed`. Todos aceitam `number` ou `[x, y, z]`.

---

### `<Grid>`

Grid robusto com parametros ajustaveis.

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

**Tipos:** `grid` (default), `lines` (com prop `axis`), `circular`, `polar` (com `maxRadius`, `cellDividers`, `sectionDividers`).

---

### `<Stars>`

Campo estelar com shader de piscar (port de drei).

```svelte
<Stars count={5000} radius={50} depth={50} factor={6} speed={0.5} fade />
```

---

### `<Sky>`

Objeto Three.js Sky renderizado como cubemap para environment.

```svelte
<Sky elevation={0.5} azimuth={180} turbidity={10} rayleigh={3} />
```

Props: `azimuth`, `cubeMapSize`, `elevation`, `mieCoefficient`, `mieDirectionalG`, `rayleigh`, `scale`, `setEnvironment` (default true), `turbidity`.

---

### `<Sparkles>`

Particulas baseadas em shader.

```svelte
<Sparkles count={100} color="yellow" scale={5} size={3} speed={0.4} />
```

Props: `count`, `color`, `size`, `scale`, `speed`, `noise`, `opacity`.

---

### `<BackdropGeometry>`

Plano curvo estilo estudio (para quebrar luz/sombras).

```svelte
<BackdropGeometry height={1} length={1} width={1} />
```

---

### `<Billboard>`

Rotaciona conteudo para sempre encarar a camera.

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

### `<CSM>`

Cascaded Shadow Maps para sombras de sol em terrenos vastos.

```svelte
<CSM
  enabled
  args={{ lightDirection: new Vector3(1, -1, 1).normalize() }}
>
  <!-- cena -->
</CSM>
```

**Apenas suporta** `MeshStandardMaterial` e `MeshPhongMaterial`. **Nao use** `castShadow` em luzes com CSM ativo.

---

### `<Align>`

Calcula bounding box e alinha filhos. Aceita `x`, `y`, `z` (-1 a 1 ou false para ignorar).

```svelte
<Align x={0} y={0} z={false}>
  <T.Mesh position={[-1, 0, 0]}><T.BoxGeometry /><T.MeshStandardMaterial /></T.Mesh>
  <T.Mesh position={[1, 0, -2]}><T.BoxGeometry args={[1, 5, 2]} /><T.MeshStandardMaterial /></T.Mesh>
</Align>
```

Props: `x`, `y`, `z`, `auto`, `precise`. Event: `align`. Export: `align()`.

---

### `<Bounds>`

Centraliza a camera automaticamente nos filhos.

```svelte
<Bounds animate={true} margin={1} enabled={true}>
  <!-- objetos -->
</Bounds>
```

---

### `<Resize>`

Normaliza dimensoes dos filhos (escala pelo bounding box maximo para range 0-1).

```svelte
<Resize axis="x">
  <T.Mesh />
</Resize>
```

Props: `auto`, `axis`, `box`, `precise`. Export: `resize()`.

---

### `<Portal>` / `<PortalTarget>`

Renderiza filhos em outro local da arvore de componentes.

```svelte
<!-- Em ComponentA: -->
<T.Object3D>
  <PortalTarget id="trail" />
</T.Object3D>

<!-- Em ComponentB: -->
<Portal id="trail">
  <T.Mesh><T.BoxGeometry /><T.MeshStandardMaterial color="red" /></T.Mesh>
</Portal>
```

---

### `<View>`

Multiplas cenas em um canvas usando scissor-cut.

```svelte
<View dom={targetElement}>
  <Scene />
</View>
```

---

### `<HUD>`

Heads-up display - nova cena renderizada sobre a principal com contexto separado.

```svelte
<HUD>
  <Scene />
</HUD>
```

Props: `autoRender`, `stage`, `toneMapping`.

---

### `layers()`

Plugin que fornece heranca de `layers` para componentes `<T>` filhos.

```svelte
<script>
  import { layers } from '@threlte/extras'
  layers()
</script>

<T.PerspectiveCamera layers={[4, 5]} />
<T.Group layers={4}>
  <T.Mesh> <!-- herda layer 4 -->
    <T.BoxGeometry /><T.MeshStandardMaterial />
  </T.Mesh>
  <T.Mesh layers="all"> <!-- em todas as layers -->
    <T.BoxGeometry /><T.MeshStandardMaterial />
  </T.Mesh>
</T.Group>
```

---

### `transitions()`

Plugin experimental que habilita transicoes estilo Svelte em componentes Threlte.

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

Direcoes: `in={fade}`, `out={fade}`, `transition={fade}`. Events: `onintrostart`, `onoutrostart`, `onintroend`, `onoutroend`.

**TypeScript:** estenda `Threlte.UserProps` com `TransitionsProps` em `app.d.ts`.

---

### `useViewport()`

Retorna informacoes da tela em unidades Three.js.

```svelte
const viewport = useViewport()
// $viewport.width, $viewport.height, $viewport.factor, $viewport.distance
```

Aceita origin customizado: `useViewport([1, 0, 1])`.

---

## Visual Effects

### `<Edges>`

Exibe arestas da geometria do pai (EdgesGeometry). Arestas visiveis quando angulo entre faces excede `thresholdAngle`.

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Edges color="black" thresholdAngle={20} scale={1.01} />
</T.Mesh>
```

---

### `<Wireframe>`

Wireframe anti-aliased baseado em shader (usa coordenadas baricentricas).

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Wireframe thickness={0.7} stroke="red" fill="green" fillOpacity={0.5} />
</T.Mesh>
```

**Converte geometrias indexed para non-indexed automaticamente.**

Props: `thickness`, `stroke`, `strokeOpacity`, `fill`, `fillOpacity`, `fillMix`, `squeeze`, `squeezeMin`, `squeezeMax`, `dash`, `dashInvert`, `dashLength`, `dashRepeats`, `colorBackfaces`, `backfaceStroke`, `simplify`.

---

### `<Outlines>`

Outline ornamental via inverted-hull. Suporta Mesh, SkinnedMesh e InstancedMesh.

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Outlines color="black" thickness={0.05} />
</T.Mesh>
```

Props: `color`, `thickness`, `angle`, `opacity`, `screenspace` (espessura independente do zoom), `polygonOffset`, `renderOrder`, `toneMapped`.

---

### `<AsciiRenderer>`

Renderiza a cena como ASCII (porta de Three.js AsciiEffect).

```svelte
<AsciiRenderer characters=" .:-+*=%@#" fgColor="#ff2400" bgColor="#000" />
```

Props: `characters`, `fgColor`, `bgColor`, `options` ({ alpha, block, color, invert, resolution, scale }), `autoRender`, `scene`, `camera`.

Exports: `start()`, `stop()`, `getEffect()`.

---

### `<CubeCamera>`

Wrapper de Three.js CubeCamera com controle de updates.

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

### `<FakeGlowMaterial>`

Outline de brilho usando shader customizado (sem post-processing).

```svelte
<T.Mesh>
  <FakeGlowMaterial glowColor="red" falloff={0.1} glowSharpness={1} glowInternalRadius={6} />
  <T.IcosahedronGeometry args={[4, 4]} />
</T.Mesh>
```

**Requer mesh suave.** Para meshes sharp, use esfera como substituto.

---

### `<ImageMaterial>`

Material de imagem com auto-cover e processamento de cor.

```svelte
<T.Mesh>
  <T.PlaneGeometry />
  <ImageMaterial url="photo.jpg" transparent side={DoubleSide} zoom={1.1} radius={0.1} />
</T.Mesh>
```

**Processamento de cor:** `brightness`, `contrast`, `hue` (0-1), `saturation`, `lightness`, `negative`, `monochromeColor`, `monochromeStrength`, `colorProcessingTexture` (canais RGBA controlam HSLA).

---

### `<MeshRefractionMaterial>`

Material de refracao (vidro/diamante). Requer `npm install three-mesh-bvh`.

```svelte
<T.Mesh>
  <MeshRefractionMaterial envMap={texture} ior={2.4} bounces={2} fresnel={0} />
  <T.IcosahedronGeometry args={[4, 0]} />
</T.Mesh>
```

Props: `envMap`, `ior`, `bounces`, `fresnel`, `aberrationStrength`, `color`, `fastChrome`.

---

### `<MeshDiscardMaterial>`

Material que renderiza nada (descarta fragmentos). Diferente de `visible={false}`: sombras e filhos continuam visiveis.

```svelte
<T.Mesh castShadow>
  <MeshDiscardMaterial />
  <T.BoxGeometry />
</T.Mesh>
```

---

### `<ShadowMaterial>`

Material barato que imita sombra sem luzes. Baseado em CanvasTexture.

---

### `<Mask>`

Mascara de stencil para efeitos de revelacao.

---

### `<UvMaterial>`

Material que visualiza UVs de uma geometria.

---

### `<PointsMaterial>`

Material para pontos/particulas.

---

### `<AnimatedSpriteMaterial>`

Material para sprites animados.

---

### `<MeshLineGeometry>` / `<MeshLineMaterial>`

Geometria e material para linhas 3D baseadas em mesh (suave, grossa).

---

### `<LinearGradientTexture>` / `<RadialGradientTexture>`

Texturas de gradiente (linear e radial).

---

### `useFBO()`

Cria `WebGLRenderTarget` (Framebuffer Object). Util para postprocessing.

```svelte
const target = useFBO({ size: { width: 512, height: 512 }, depth: true })
```

Se `size` nao fornecido, acompanha tamanho do canvas. `depth`: boolean, objeto `{ width, height }`, ou `DepthTexture`.

---

## Dicas Importantes

- **Plugins** (como `interactivity`, `layers`, `transitions`) devem ser invocados no nivel raiz da aplicacao, tipicamente em `Scene.svelte`
- **Componentes extras** extendem `<T>` internamente e encaminham props/eventos do Three.js
- **Suspense-ready** significa que o componente pode ser usado dentro de `<Suspense>` para gerenciar carregamento
- **Use `useDraco()`, `useKtx2()`, `useMeshopt()`** para descompressao de modelos glTF
- **`<HTML>` nao funciona em XR** - use [threlte-uikit](https://github.com/threlte/threlte-uikit) como alternativa
- **`<InstancedMesh>`** e ideias para renderizar muitos objetos identicos - reduz draw calls drasticamente
- **`<BakeShadows>`** para cenas estaticas complexas - sombras calculadas uma vez
- **`<ContactShadows frames={1}`** para objetos estaticos - economia de performance
- **`meshBounds`** como alternativa de raycast mais rapida para geometrias complexas

---

## Links Uteis

- Docs oficiais @threlte/extras: https://threlte.xyz/docs/reference/extras/getting-started/
- Repositorio Threlte: https://github.com/threlte/threlte
- three-mesh-bvh (requerido para MeshRefractionMaterial): https://github.com/gkjohnson/three-mesh-bvh
- threlte-uikit (alternativa ao HTML para XR): https://github.com/threlte/threlte-uikit
