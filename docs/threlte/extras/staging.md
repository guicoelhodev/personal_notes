# @threlte/extras - Staging

> Componentes e hooks de preparacao de cena do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `<Environment>`

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

## `<CubeEnvironment>`

Similar a `<Environment>` mas usa `CubeTexture` (6 URLs). Ordem: `[+X, -X, +Y, -Y, +Z, -Z]`.

---

## `<VirtualEnvironment>`

Cria environment maps dinamicos via cube camera. Renderiza conteudo interno como cubemap.

```svelte
<VirtualEnvironment frames={1} visible={false} resolution={256} />
```

Props: `frames`, `near`, `far`, `resolution`, `visible`, `isBackground`, `scene`.

Exports: `restart()`, `update()`.

---

## `<ContactShadows>`

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

## `<SoftShadows>`

Injeta PCSS (Percentage-Closer Soft Shadows) nos shaders. Montar/desmontar recompila shaders.

```svelte
<SoftShadows samples={10} size={25} focus={0} />
```

---

## `<BakeShadows>`

Congela shadow maps ao montar. Sombras estaticas, calculadas uma vez.

```svelte
<BakeShadows />
```

---

## `<ShadowAlpha>`

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

## `<Float>`

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

## `<Grid>`

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

## `<Stars>`

Campo estelar com shader de piscar (port de drei).

```svelte
<Stars count={5000} radius={50} depth={50} factor={6} speed={0.5} fade />
```

---

## `<Sky>`

Objeto Three.js Sky renderizado como cubemap para environment.

```svelte
<Sky elevation={0.5} azimuth={180} turbidity={10} rayleigh={3} />
```

Props: `azimuth`, `cubeMapSize`, `elevation`, `mieCoefficient`, `mieDirectionalG`, `rayleigh`, `scale`, `setEnvironment` (default true), `turbidity`.

---

## `<Sparkles>`

Particulas baseadas em shader.

```svelte
<Sparkles count={100} color="yellow" scale={5} size={3} speed={0.4} />
```

Props: `count`, `color`, `size`, `scale`, `speed`, `noise`, `opacity`.

---

## `<BackdropGeometry>`

Plano curvo estilo estudio (para quebrar luz/sombras).

```svelte
<BackdropGeometry height={1} length={1} width={1} />
```

---

## `<Billboard>`

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

## `<CSM>`

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

## `<Align>`

Calcula bounding box e alinha filhos. Aceita `x`, `y`, `z` (-1 a 1 ou false para ignorar).

```svelte
<Align x={0} y={0} z={false}>
  <T.Mesh position={[-1, 0, 0]}><T.BoxGeometry /><T.MeshStandardMaterial /></T.Mesh>
  <T.Mesh position={[1, 0, -2]}><T.BoxGeometry args={[1, 5, 2]} /><T.MeshStandardMaterial /></T.Mesh>
</Align>
```

Props: `x`, `y`, `z`, `auto`, `precise`. Event: `align`. Export: `align()`.

---

## `<Bounds>`

Centraliza a camera automaticamente nos filhos.

```svelte
<Bounds animate={true} margin={1} enabled={true}>
  <!-- objetos -->
</Bounds>
```

---

## `<Resize>`

Normaliza dimensoes dos filhos (escala pelo bounding box maximo para range 0-1).

```svelte
<Resize axis="x">
  <T.Mesh />
</Resize>
```

Props: `auto`, `axis`, `box`, `precise`. Export: `resize()`.

---

## `<Portal>` / `<PortalTarget>`

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

## `<View>`

Multiplas cenas em um canvas usando scissor-cut.

```svelte
<View dom={targetElement}>
  <Scene />
</View>
```

---

## `<HUD>`

Heads-up display - nova cena renderizada sobre a principal com contexto separado.

```svelte
<HUD>
  <Scene />
</HUD>
```

Props: `autoRender`, `stage`, `toneMapping`.

---

## `layers()`

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

## `transitions()`

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

## `useViewport()`

Retorna informacoes da tela em unidades Three.js.

```svelte
const viewport = useViewport()
// $viewport.width, $viewport.height, $viewport.factor, $viewport.distance
```

Aceita origin customizado: `useViewport([1, 0, 1])`.
