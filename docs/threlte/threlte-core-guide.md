# @threlte/core - Guia de Referencia Rapido

> Resumo completo do pacote core do framework [Threlte](https://threlte.xyz/) para Svelte/Three.js.  
> Fonte oficial: https://threlte.xyz/docs/reference/core/getting-started/

---

## O que e?

`@threlte/core` e o pacote principal do framework Threlte. Ele fornece uma camada declarativa (componentes Svelte) sobre o [Three.js](https://threejs.org/), permitindo construir cenas 3D usando a sintaxe de componentes do Svelte em vez da API imperativa do Three.js. Os outros pacotes do ecossistema Threlte (rapier, extras, gltf, etc.) dependem deste.

---

## Instalacao

```bash
npm install @threlte/core three @types/three
```

---

## Arquitetura Basica

```
<Canvas>          (raiz - cria WebGLRenderer, fornece contexto)
  └─ <T.Mesh>     (qualquer classe Three.js como componente)
       ├─ <T.BoxGeometry />
       └─ <T.MeshStandardMaterial />
```

**Exemplo minimo:**

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

## Componentes

### `<Canvas>`

Componente raiz de toda aplicacao Threlte. Cria o `THREE.WebGLRenderer` e fornece contexto para todos os filhos. Todos os outros componentes e hooks devem estar dentro de `<Canvas>`.

#### Tamanho

Por padrao, o canvas ocupa 100% da largura e altura do elemento pai. Defina o tamanho pelo layout do pai:

```svelte
<div style="width: 600px; height: 400px;">
  <Canvas>
    <Scene />
  </Canvas>
</div>
```

#### Props

| Prop | Tipo | Default | Descricao |
|---|---|---|---|
| `autoRender` | `boolean` | `true` | Renderiza automaticamente a cada frame. `false` para pipelines customizados |
| `colorManagementEnabled` | `boolean` | `true` | Gerenciamento de cor do Three.js |
| `colorSpace` | `THREE.ColorSpace` | `srgb` | Espaco de cor |
| `createRenderer` | `function` | - | Funcao customizada para criar o renderer |
| `dpr` | `number` | `window.devicePixelRatio` | Device pixel ratio |
| `renderMode` | `'always' \| 'on-demand' \| 'manual'` | `'on-demand'` | Modo de renderizacao |
| `shadows` | `boolean \| ShadowMapType` | `PCFSoftShadowMap` | Habilita sombras e tipo |
| `toneMapping` | `THREE.ToneMapping` | `AgXToneMapping` | Tone mapping |

#### Render Modes

| Mode | Comportamento |
|---|---|
| `'on-demand'` | Renderiza apenas quando necessario (default, melhor performance). Use `invalidate()` para solicitar re-render |
| `'always'` | Renderiza a cada frame, independentemente de mudancas |
| `'manual'` | Nenhuma renderizacao automatica. Use `advance()` para renderizar manualmente |

---

### `<T>` (Componente Principal)

O building block do Threlte. Permite usar **qualquer classe Three.js** como componente Svelte. Toda a cena e construida com `<T>`.

#### Duas formas de uso:

**1. Dot notation (recomendado para classes do namespace `three`):**

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshBasicMaterial />
</T.Mesh>
```

**2. Prop `is` (para classes externas ou customizadas):**

```svelte
<script>
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
</script>

<T is={OrbitControls} args={[camera, renderer.domElement]} />
```

Ambas sao **equivalentes** e intercambiaveis.

#### Comportamento automatico

- **Scene graph**: Se a classe estende `THREE.Object3D`, e automaticamente adicionada a cena
- **Attach**: Materiais sao anexados a prop `material`, geometrias a `geometry`, automaticamente
- **Dispose**: Objetos disposable sao descartados ao desmontar ou quando `args` muda

#### Props do Three.js

Qualquer propriedade do objeto Three.js pode ser usada como prop reativa:

```svelte
<T.Mesh position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]}>
  <T.MeshStandardMaterial color="red" roughness={0.5} metalness={0.8} />
</T.Mesh>
```

**Pierced props** (atualizar apenas uma coordenada):

```svelte
<T.Mesh position.y={1} rotation.y={Math.PI / 4} />
```

> O tipo de uma prop deve ser constante durante a vida do componente.

#### `args` (Argumentos do Construtor)

Construtor do Three.js recebe argumentos via `args` (array). Evite mudar `args` depois, pois recria a instancia:

```svelte
<T.BoxGeometry args={[1, 2, 1]} />
<!-- Equivalente a: new THREE.BoxGeometry(1, 2, 1) -->

<T.SphereGeometry args={[radius, 32, 32]} />
<!-- Equivalente a: new THREE.SphereGeometry(radius, 32, 32) -->
```

#### `attach`

Controla como o objeto filho se conecta ao pai:

```svelte
<!-- Automatico para materiais e geometrias -->
<T.Mesh>
  <T.MeshStandardMaterial />         <!-- attach="material" automatico -->
  <T.BoxGeometry />                  <!-- attach="geometry" automatico -->
</T.Mesh>

<!-- Explicito -->
<T.MeshStandardMaterial>
  <T is={texture} attach="map" />
</T.MeshStandardMaterial>

<!-- Dot-notated path (aninhado) -->
<T.DirectionalLight>
  <T.OrthographicCamera args={[-1, 1, 1, -1, 0.1, 100]} attach="shadow.camera" />
</T.DirectionalLight>

<!-- Funcao (controle total) -->
<T.DirectionalLight>
  <T.OrthographicCamera
    attach={({ ref, parent }) => {
      parent.shadow.camera = ref
      return () => { parent.shadow.camera = null }
    }}
  />
</T.DirectionalLight>

<!-- Desativar attach -->
<T is={mesh} attach={false} />
```

#### Props de Camera

```svelte
<!-- Camera padrao de renderizacao -->
<T.PerspectiveCamera makeDefault position={[10, 10, 10]} />

<!-- Camera manual (nao atualiza aspect ratio automaticamente) -->
<T.PerspectiveCamera manual />

<!-- Acessar camera via snippet para passar ao OrbitControls -->
<T.PerspectiveCamera makeDefault>
  {#snippet children({ ref })}
    <T is={OrbitControls} args={[ref, renderer.domElement]} />
  {/snippet}
</T.PerspectiveCamera>
```

> **Erro comum**: Esquecer `makeDefault`. Sem ele, a cena renderiza com a camera padrao do Threlte, nao com a sua.

#### Eventos

**Evento `create`** (disparado ao criar a instancia):

```svelte
<T.PerspectiveCamera
  oncreate={(ref) => {
    ref.lookAt(0, 0, 0)
    return () => { /* cleanup ao desmontar */ }
  }}
/>
```

**Eventos do objeto Three.js** (quando o objeto tem `addEventListener`):

```svelte
<T is={OrbitControls} onchange={(e) => console.log('change:', e)} />
```

**Eventos de interacao** (click, pointer, etc.) requerem o plugin `interactivity` de `@threlte/extras`.

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

#### Extendendo o Catalogo de Componentes

Para usar classes que nao sao do namespace `three` com dot notation:

```svelte
<script>
  import { extend, T } from '@threlte/core'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

  extend({ OrbitControls })
</script>

<!-- Agora disponivel com dot notation -->
<T.OrbitControls args={[camera, renderer.domElement]} />
```

**Tipos customizados** (em `src/app.d.ts`):

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

Acesso ao contexto principal do Threlte (renderer, camera, scene, etc.). Deve ser usado dentro de `<Canvas>`.

```typescript
const {
  dom,                        // HTMLElement - wrapper do canvas
  size,                       // Readable<DOMRect> - tamanho
  canvas,                     // HTMLCanvasElement
  camera,                     // CurrentWritable<Camera> - camera ativa
  scene,                      // Scene
  dpr,                        // CurrentWritable<number> - device pixel ratio
  renderer,                   // WebGLRenderer
  renderMode,                 // CurrentWritable<'always' | 'on-demand' | 'manual'>
  autoRender,                 // CurrentWritable<boolean>
  invalidate,                 // () => void - solicita re-render
  advance,                    // () => void - renderiza manualmente (mode='manual')
  scheduler,                  // Scheduler
  mainStage,                  // Stage - etapa principal
  renderStage,                // Stage - etapa de renderizacao
  autoRenderTask,             // Task
  shouldRender,               // () => boolean
  colorManagementEnabled,     // CurrentReadable<boolean>
  colorSpace,                 // CurrentWritable<ColorSpace>
  toneMapping,                // CurrentWritable<ToneMapping>
  shadows                     // CurrentWritable<boolean | ShadowMapType>
} = useThrelte()
```

**Usos comuns:**

```svelte
<!-- Invalidar frame (on-demand) -->
const { invalidate } = useThrelte()
someMesh.position.x = 5
invalidate()

<!-- Avancar renderizacao manual (manual mode) -->
const { advance } = useThrelte()
advance()

<!-- Acessar camera e renderer -->
const { camera, renderer } = useThrelte()
console.log($camera, renderer)

<!-- Alterar tone mapping -->
const { toneMapping } = useThrelte()
toneMapping.set(THREE.LinearToneMapping)
```

---

### `useTask()`

Cria uma task que executa codigo a cada frame. Parte do **Task Scheduling System** do Threlte.

#### Task Anonima

```svelte
useTask((delta) => {
  // Executa a cada frame. delta = tempo desde o ultimo frame
  mesh.rotation.y += delta * 0.5
})
```

Retorna `{ task, started }`.

#### Task com Key

```svelte
const { task, started } = useTask('my-task', (delta) => {
  // Referenciavel por key em dependencias
})
```

#### Task em Stage Especifica

```svelte
const { renderStage } = useThrelte()

useTask(
  (delta) => { /* ... */ },
  { stage: renderStage }
)
```

#### Dependencias entre Tasks

```svelte
useTask(
  (delta) => { /* roda DEPOIS de otherTask */ },
  { after: otherTask }
)

useTask(
  (delta) => { /* roda ANTES de otherTask */ },
  { before: otherTask }
)

// Por key (podem ser declaradas em qualquer ordem)
useTask(
  (delta) => { /* ... */ },
  { after: 'some-task-key' }
)
```

#### Iniciar/Parar Tasks

```svelte
let running = $state(false)

useTask(
  (delta) => { /* ... */ },
  { running: () => running }
)

running = true   // inicia
running = false  // para
```

#### useTask e On-Demand Rendering

```svelte
const { invalidate } = useThrelte()

useTask(
  (delta) => {
    // Nao invalida automaticamente
    if (someCondition) {
      invalidate()
    }
  },
  { autoInvalidate: false }
)
```

#### Atualizar Objetos (animacao)

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

  // Desativar auto-render
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

> Com SvelteKit, adicione `ssr: { noExternal: ['postprocessing'] }` ao `vite.config.js`.

---

### `useStage()`

Cria ou recupera um **stage** (grupo de tasks executadas em ordem especifica).

```svelte
const { renderStage } = useThrelte()

// Cria stage que roda DEPOIS do renderStage
const afterRenderStage = useStage('after-render', {
  after: renderStage
})

// Cria stage que roda ANTES do mainStage
const beforeMainStage = useStage('before-main', {
  before: mainStage
})
```

#### Stage com Callback Customizado

```svelte
const conditionalStage = useStage('conditional', {
  after: renderStage,
  callback: (delta, runTasks) => {
    if (shouldRun) {
      runTasks()            // roda com delta do frame
      runTasks(0.005)       // roda com delta customizado
    }
  }
})
```

---

### `useLoader()`

Carrega assets usando qualquer classe `THREE.Loader`. Resultados sao **cacheados** - chamadas com o mesmo path retornam a mesma referencia.

#### Instanciar Loader

```svelte
<script>
  import { useLoader } from '@threlte/core'
  import { TextureLoader } from 'three'

  const { load } = useLoader(TextureLoader)
</script>
```

#### Loader com Args

```svelte
<script>
  import { useLoader, useThrelte } from '@threlte/core'
  import { SplatLoader } from '@pmndrs/vanilla'

  const { renderer } = useThrelte()
  const { load } = useLoader(SplatLoader, { args: [renderer] })
</script>
```

#### Carregar Asset

```svelte
const texture = load('path/to/texture.png')
<!-- texture e um AsyncWritable<Texture> - inicialmente undefined -->
```

#### Await Block

```svelte
{#await load('path/to/texture.png') then map}
  <T.MeshStandardMaterial {map} />
{/await}
```

#### Carregar Multiplas Assets

```svelte
// Array
const textures = load(['tex1.png', 'tex2.png'])
<!-- $textures = [Texture, Texture] -->

// Mapa
const textures = load({
  diffuse: 'diffuse.png',
  normal: 'normal.png'
})
<!-- $textures = { diffuse: Texture, normal: Texture } -->
```

#### Transformar Resultado

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

Store de contexto personalizado, scoped ao `<Canvas>`. Ideal para comunicacao entre componentes reutilizaveis.

```svelte
// Definir contexto
const ctx = useThrelteUserContext('my-plugin', () => ({
  foo: 'bar'
}))
```

```svelte
// Consumir contexto
const ctx = useThrelteUserContext('my-plugin')
console.log($ctx) // { foo: 'bar' }
```

```svelte
// Acessar todo o contexto
const userCtx = useThrelteUserContext()
console.log($userCtx) // { 'my-plugin': { foo: 'bar' }, ... }
```

---

## Sistema de Task Scheduling

O Threlte possui um sistema de **stages e tasks** para controlar a ordem de execucao do codigo por frame.

### Stages Padrao

| Stage | Descricao |
|---|---|
| `mainStage` | Stage principal. Tasks aqui rodam a cada frame |
| `renderStage` | Stage de renderizacao. Roda quando re-render e necessario (on-demand) |

### Fluxo de Execucao (por frame)

```
1. mainStage tasks executam (em ordem de dependencias)
2. renderStage tasks executam (incluindo renderizacao)
```

### Ordem de Execucao

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

Adiciona funcionalidades a todos os componentes `<T>` descendentes:

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

- Props listadas em `pluginProps` sao reservadas para o plugin (o `<T>` nao age sobre elas)
- Plugins podem ser sobrescritos chamando `injectPlugin` novamente com o mesmo nome mais abaixo na arvore

**Tipos customizados de plugin props** (em `src/app.d.ts`):

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

Observa stores e executa callback com cleanup:

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

Versao runes-compatible do `watch`. Usa `$effect` internamente, callback roda no proximo microtask:

```svelte
import { observe } from '@threlte/core'

let count = $state(0)

observe(() => count, (value) => {
  console.log(value)
})
```

### `asyncWritable(promise)`

Store writable inicializado com uma promise. Implementa `then`/`catch` para uso com `await` e `{#await}`:

```svelte
import { asyncWritable } from '@threlte/core'

const store = asyncWritable(loadTexture())

{#await store then texture}
  <T.MeshStandardMaterial map={texture} />
{/await}
```

### `currentWritable(initialValue)`

Store writable com propriedade `current` sincrona (evita `get()` em loops):

```svelte
import { currentWritable } from '@threlte/core'

const store = currentWritable(0)

useTask(() => {
  console.log(store.current) // Acesso sincrono, sem overhead
})
```

### `isInstanceOf(object, className)`

Type guard para classes Three.js (usa propriedade `isFoo`, mais rapido que `instanceof`):

```svelte
import { isInstanceOf } from '@threlte/core'

if (isInstanceOf(obj, 'Object3D')) {
  obj.position.x = 5
}
```

---

## Padroes Comuns

### Cena Basica com Camera e Iluminacao

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

### Animacao com useTask

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

### Carregar Textura

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

### Props Reativas

```svelte
<script>
  let color = $state('red')
</script>

<T.Mesh>
  <T.BoxGeometry />
  <!-- Re-renderiza automaticamente quando color muda -->
  <T.MeshStandardMaterial color={color} />
</T.Mesh>

<button onclick={() => color = 'blue'}>Blue</button>
<button onclick={() => color = 'green'}>Green</button>
```

### Hierarquia de Objetos

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

## Dicas Importantes

- **`makeDefault` na camera**: Sempre defina `makeDefault` na camera que deseja usar, senao a cena renderiza com a camera padrao invisivel do Threlte.
- **`invalidate()`**: No modo `on-demand`, sempre chame `invalidate()` apos modificar objetos manualmente.
- **`args` nao mudem**: Evite mudar `args` depois da criacao, pois recria a instancia do objeto Three.js.
- **Tipos constantes**: O tipo de uma prop reativa deve ser constante (nao mude de array para number, por exemplo).
- **Extend para classes externas**: Use `extend()` para usar OrbitControls e outras classes de `three/examples/jsm` com dot notation.
- **useLoader cache**: O loader cacheia resultados - mesmos paths retornam a mesma referencia.
- **useTask autoInvalidate**: Por padrao, `useTask` invalida o frame automaticamente. Use `autoInvalidate: false` para controle manual.
- **Pierced props**: Use `position.y={1}` ao inves de `position={[0, 1, 0]}` para atualizar apenas uma coordenada (menos atualizacoes).

---

## Links Uteis

- Docs oficiais Threlte Core: https://threlte.xyz/docs/reference/core/getting-started/
- Three.js Docs: https://threejs.org/docs/
- Repositorio Threlte: https://github.com/threlte/threlte
