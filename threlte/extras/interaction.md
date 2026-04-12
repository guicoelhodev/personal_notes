# @threlte/extras - Interaction

> Componentes e hooks de interacao do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `interactivity()`

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

### Eventos disponiveis

```svelte
<T.Mesh
  onclick={(e) => {}}
  oncontextmenu={(e) => {}}
  ondblclick={(e) => {}}
  onwheel={(e) => {}}
  onpointerup={(e) => {}}
  onpointerdown={(e) => {}}
  onpointerover={(e) => {}}
  onpointerout={(e) => {}}
  onpointerenter={(e) => {}}
  onpointerleave={(e) => {}}
  onpointermove={(e) => {}}
  onpointermissed={(e) => {}}
/>
```

### Dados do Evento

Todos os eventos de interacao contem:

```typescript
type Event = THREE.Intersection & {
  object: THREE.Object3D           // Objeto atingido
  distance: number                 // Distancia do ray origin
  point: THREE.Vector3             // Ponto de intersecao (world)
  face: THREE.Face | null          // Face atingida
  eventObject: THREE.Object3D      // Objeto que registrou o handler
  intersections: Intersection[]    // Todas as intersecoes
  camera: THREE.Camera             // Camera usada
  delta: number                    // Pixels desde pointerdown (0 para non-click)
  nativeEvent: MouseEvent | PointerEvent | WheelEvent
  pointer: Vector2                 // Pointer em NDC
  ray: THREE.Ray                   // Ray usado
  stopPropagation: () => void      // Para propagacao + bloqueia objetos atras
  stopImmediatePropagation: () => void  // Delega ao DOM
  stopped: boolean
}
```

### Propagacao de Eventos

Objetos sao transparentes a pointer events por padrao. O evento e entregue ao objeto mais proximo, faz bubble pelos ancestors, depois ao proximo objeto, etc. Use `stopPropagation()` para bloquear objetos atras:

```svelte
<T.Mesh onclick={(e) => e.stopPropagation()} />
```

### Touch Interactions

Em dispositivos touch, o browser pode cancelar `pointermove` mid-gesture. Use `touch-action: none` no wrapper do canvas:

```svelte
<div style="touch-action: none;">
  <Canvas><Scene /></Canvas>
</div>
```

### Event Target customizado

```svelte
interactivity({ target: document })

// Ou reativo:
const { target } = interactivity()
$effect(() => { target.set(document) })
```

### Compute Function

Quando o target nao e o mesmo tamanho do canvas:

```svelte
interactivity({
  compute: (event, state) => {
    state.pointer.update((p) => {
      p.x = (event.clientX / window.innerWidth) * 2 - 1
      p.y = -(event.clientY / window.innerHeight) * 2 + 1
      return p
    })
    state.raycaster.setFromCamera(state.pointer.current, $camera)
  }
})
```

### Filter Function

Filtra e ordena hits antes da entrega:

```svelte
interactivity({
  filter: (hits, state) => hits.slice(0, 1)
})
```

### Estado da Interatividade

```svelte
const { pointer, pointerOverTarget } = useInteractivity()
```

```typescript
type State = {
  enabled: CurrentWritable<boolean>
  target: CurrentWritable<HTMLElement | undefined>
  pointer: CurrentWritable<Vector2>
  pointerOverTarget: CurrentWritable<boolean>
  lastEvent: MouseEvent | WheelEvent | PointerEvent | undefined
  raycaster: Raycaster
  initialClick: [x: number, y: number]
  initialHits: THREE.Object3D[]
  hovered: Map<string, IntersectionEvent<...>>
  interactiveObjects: THREE.Object3D[]
  compute: ComputeFunction
  filter?: FilterFunction
  clickDistanceThreshold: number
  clickTimeThreshold: number
}
```

### TypeScript

```typescript
import type { InteractivityProps } from '@threlte/extras'

declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps {}
  }
}
export {}
```

---

## `<OrbitControls>`

Controle de orbita da camera. **Deve ser filho direto de uma camera com `makeDefault`.**

```svelte
<T.PerspectiveCamera makeDefault position={[5, 5, 5]}>
  <OrbitControls enableDamping autoRotate rotateSpeed={1} zoomToCursor />
</T.PerspectiveCamera>
```

Extende `<T.OrbitControls>`. Suporta todos os 30+ props do Three.js: `enableDamping`, `autoRotate`, `rotateSpeed`, `zoomSpeed`, `zoomToCursor`, `minPolarAngle`, `maxPolarAngle`, `enableZoom`, etc.

| Prop | Tipo | Descricao |
|---|---|---|
| `camera` | `THREE.Camera` | Camera explicita (opcional, usa pai ou default) |

---

## `<CameraControls>`

Controle de camera avancado (baseado em [camera-controls](https://github.com/yomotsu/camera-controls)). Suporta zoom, rotacao, pan, transicoes suaves, fit-to-box, first-person, etc.

```svelte
<T.PerspectiveCamera makeDefault>
  <CameraControls bind:ref={controls} oncreate={(ref) => ref.setPosition(5, 5, 5)} />
</T.PerspectiveCamera>
```

### API (via `CameraControlsRef`)

```svelte
const controls = $state<CameraControlsRef>()

controls?.rotate(theta, phi, enableTransition)
controls?.truck(x, y, enableTransition)
controls?.dolly(scale, enableTransition)
controls?.zoom(zoomStep, enableTransition)
controls?.moveTo(x, y, z, enableTransition)
controls?.fitToBox(meshOrBox, enableTransition)
controls?.setPosition(x, y, z, enableTransition)
controls?.setTarget(x, y, z, enableTransition)
controls?.setLookAt(x, y, z, tx, ty, tz, enableTransition)
controls?.lerpLookAt(...args, t, enableTransition)
controls?.reset(enableTransition)
controls?.saveState()
```

### Props

| Prop | Tipo | Descricao |
|---|---|---|
| `camera` | `THREE.Camera` | Camera explicita (opcional) |

### SSR Externalization (SvelteKit)

```typescript
// vite.config.ts
export default defineConfig({
  ssr: { noExternal: ['camera-controls'] }
})
```

---

## `<TransformControls>`

Gizmo de transformacao (translacao, rotacao, escala) para objetos 3D. Baseado no Three.js TransformControls.

### Uso basico (filho do objeto)

```svelte
<TransformControls translationSnap={1}>
  <T.Mesh>
    <T.BoxGeometry args={[2, 2, 2]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</TransformControls>
```

### Transformando objeto externo

```svelte
<T.Mesh bind:ref={mesh}>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
</T.Mesh>

<T.TransformControls object={mesh} />
```

Ou via snippet:

```svelte
<T.Mesh>
  {#snippet children({ ref })}
    <TransformControls object={ref} />
  {/snippet}
</T.Mesh>
```

### Props

| Prop | Tipo | Default | Descricao |
|---|---|---|---|
| `autoPauseControls` | `boolean` | `true` | Pausa camera controls ao arrastar |
| `cameraControls` | `{ enabled: boolean }` | - | Controles customizados de terceiros |
| `object` | `THREE.Object3D` | - | Objeto a transformar |

### Bindings

| Nome | Tipo |
|---|---|
| `controls` | `THREE.TransformControls` |
| `group` | `THREE.Group` |

Auto-pausa `<OrbitControls>`, `<TrackballControls>` e `<CameraControls>` automaticamente. Desative com `autoPauseControls={false}`.

---

## `<Gizmo>`

Gizmo visual de snap-to para camera controls. Usa [Three Viewport Gizmo](https://fennec-hub.github.io/three-viewport-gizmo/).

```svelte
<OrbitControls>
  <Gizmo type="sphere" placement="bottom-left" size={86} />
</OrbitControls>
```

### Props

| Prop | Tipo | Descricao |
|---|---|---|
| `controls` | `OrbitControls \| CameraControls` | Controles explicitos |
| `renderTask` | `TaskOptions` | Opcoes da task de render |

Aceita qualquer opcao do [Three Viewport Gizmo](https://fennec-hub.github.io/three-viewport-gizmo/api.html#gizmooptions).

---

## `<TrackballControls>`

Controle de camera estilo trackball (rotacao livre sem constraint de eixo).

---

## `useCursor()`

Hook que seta o cursor CSS baseado no hover state de um mesh.

```svelte
<script>
  import { useCursor } from '@threlte/extras'

  const { hovering, onPointerEnter, onPointerLeave } = useCursor('grab', 'crosshair')
</script>

<T.Mesh onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <T.BoxGeometry />
  <T.MeshBasicMaterial />
</T.Mesh>
```

- Argumentos: `onPointerOverCursor = 'pointer'`, `onPointerOutCursor = 'auto'`
- Aceita stores como argumento para mudar o cursor dinamicamente
- `hovering` e um store reativo
- Rename handlers para evitar conflitos: `const { onPointerEnter: cursorEnter } = useCursor()`

---

## `useKeyboard()`

Tracking frame-accurate de teclas (estilo Godot `Input.is_action_just_pressed()`). Coleta key presses entre frames e aplica junto no inicio de cada frame.

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useKeyboard } from '@threlte/extras'

  const keyboard = useKeyboard()
  const space = keyboard.key('Space')
  const w = keyboard.key('w')

  useTask(
    () => {
      if (space.justPressed) jump()
      if (w.pressed) moveForward()
    },
    { after: keyboard.task }
  )
</script>
```

### Key State

Cada tecla e identificada por `KeyboardEvent.key` (ex: `'w'`, `'Space'`, `'ArrowUp'`, `'Shift'`). Case-insensitive.

| Propriedade | Tipo | Descricao |
|---|---|---|
| `pressed` | `boolean` | Tecla pressionada |
| `justPressed` | `boolean` | Primeiro frame pressionada |
| `justReleased` | `boolean` | Primeiro frame liberada |

O objeto `KeyState` e estavel -- `keyboard.key('Space')` sempre retorna a mesma referencia.

### Reatividade

Propriedades sao reativas, usaveis em template ou `$derived`:

```svelte
<p>{space.pressed ? 'Jumping!' : 'On the ground'}</p>
```

### Event Listeners

Para reacoes imediatas (non-polling):

```svelte
keyboard.on('keydown', (e) => { console.log(`Pressed: ${e.key}`) })
const off = keyboard.on('keyup', (e) => { /* ... */ })
// off() para parar de ouvir
```

### Task Ordering

Schedule tasks **after** `keyboard.task`:

```svelte
useTask(() => { /* state atualizado */ }, { after: keyboard.task })
```

### Opcoes

```svelte
import { useThrelte } from '@threlte/core'
const { dom } = useThrelte()
const keyboard = useKeyboard(() => ({ target: dom }))
```

Default: `window` (global). Quando a janela perde foco (blur), todas as teclas pressionadas sao automaticamente liberadas.

---

## `useGamepad()`

Tracking frame-accurate de gamepads usando [Standard Gamepad layout](https://w3c.github.io/gamepad/#remapping).

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useGamepad } from '@threlte/extras'

  const gamepad = useGamepad()
  const jump = gamepad.button('clusterBottom')

  useTask(
    () => {
      if (jump.justPressed) console.log('Jump!')
      const left = gamepad.stick('leftStick')
      console.log(left.x, left.y)
    },
    { after: gamepad.task }
  )
</script>
```

### Multiplos Gamepads

```svelte
const gamepad1 = useGamepad({ index: 0 })
const gamepad2 = useGamepad({ index: 1 })
```

### Button State

```svelte
const a = gamepad.button('clusterBottom')
const lt = gamepad.button('leftTrigger')
if (a.justPressed) jump()
if (lt.value > 0.5) accelerate()
```

| Propriedade | Tipo | Descricao |
|---|---|---|
| `pressed` | `boolean` | Botao pressionado |
| `justPressed` | `boolean` | Primeiro frame pressionado |
| `justReleased` | `boolean` | Primeiro frame liberado |
| `touched` | `boolean` | Botao sendo tocado (se suportado) |
| `value` | `number` | Valor analogico 0-1 (ex: triggers) |

### Stick State

```svelte
const left = gamepad.stick('leftStick')
console.log(left.x, left.y) // x: -1 a 1, y: -1 a 1
```

### Event Listeners

```svelte
const off = gamepad.button('leftTrigger').on('down', (event) => { /* ... */ })
gamepad.stick('leftStick').on('change', (event) => { /* ... */ })
gamepad.on('press', (event) => { /* ... */ })
```

| Evento | Descricao |
|---|---|
| `down` | Inicio do press |
| `up` | Fim do press |
| `press` | Press completo (apos release) |
| `change` | Valor mudou |
| `touchstart` / `touchend` / `touch` | Eventos de toque |

### Opcoes

| Opcao | Default | Descricao |
|---|---|---|
| `index` | `0` | Indice do gamepad |
| `axisDeadzone` | `0.05` | Minimo para disparar change events |

### Conexao

```svelte
const { connected } = gamepad
<p>{$connected ? 'Gamepad connected' : 'No gamepad'}</p>
const raw = gamepad.raw // Gamepad nativo ou null
```

### Button Mapping

**Botoes:** `clusterBottom`, `clusterRight`, `clusterLeft`, `clusterTop`, `leftBumper`, `rightBumper`, `leftTrigger`, `rightTrigger`, `select`, `start`, `center`, `leftStickButton`, `rightStickButton`, `directionalTop`, `directionalBottom`, `directionalLeft`, `directionalRight`

**Sticks:** `leftStick`, `rightStick`

### XR Gamepad

```svelte
const left = useGamepad({ xr: true, hand: 'left' })
const right = useGamepad({ xr: true, hand: 'right' })
```

XR Buttons: `trigger`, `squeeze`, `touchpadButton`, `thumbstickButton`, `clusterBottom`, `clusterTop`
XR Sticks: `touchpad`, `thumbstick`

---

## `useInputMap()`

Sistema de action mapping que abstrai inputs fisicos em acoes nomeadas. Decouple game logic de dispositivos especificos.

```svelte
<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useInputMap, useKeyboard, useGamepad } from '@threlte/extras'

  const keyboard = useKeyboard()
  const gamepad = useGamepad()

  const input = useInputMap(
    ({ key, gamepadButton, gamepadAxis }) => ({
      jump: [key('Space'), gamepadButton('clusterBottom')],
      moveLeft: [key('a'), key('ArrowLeft'), gamepadAxis('leftStick', 'x', -1)],
      moveRight: [key('d'), key('ArrowRight'), gamepadAxis('leftStick', 'x', 1)],
      moveForward: [key('w'), key('ArrowUp'), gamepadAxis('leftStick', 'y', -1)],
      moveBack: [key('s'), key('ArrowDown'), gamepadAxis('leftStick', 'y', 1)],
      sprint: [key('Shift'), gamepadButton('leftBumper')]
    }),
    { keyboard, gamepad }
  )

  useTask(
    (delta) => {
      if (input.action('jump').justPressed) player.jump()
      const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
      player.velocity.x = move.x * speed
      player.velocity.z = move.y * speed
    },
    { after: input.task }
  )
</script>
```

### Definicoes Reativas

Passar como funcao permite remapping em runtime:

```svelte
let jumpKey = $state('Space')
const input = useInputMap(
  ({ key }) => ({ jump: [key(jumpKey)] }),
  { keyboard }
)
// Depois: jumpKey = 'j'
```

### Binding Helpers

| Helper | Descricao |
|---|---|
| `key('w')` | Tecla por `KeyboardEvent.key` (case-insensitive) |
| `gamepadButton('clusterBottom')` | Botao do gamepad |
| `gamepadAxis('leftStick', 'x', 1, threshold?)` | Eixo do stick com direcao (threshold default 0.1) |

### Action State

```svelte
const jump = input.action('jump')
if (jump.justPressed) startJump()
if (jump.pressed) holdJump()
if (jump.justReleased) releaseJump()
```

| Propriedade | Tipo | Descricao |
|---|---|---|
| `pressed` | `boolean` | Algum binding ativo |
| `justPressed` | `boolean` | Primeiro frame ativo |
| `justReleased` | `boolean` | Primeiro frame inativo |
| `strength` | `number` | Forca analogica 0-1 |

### Axes e Vectors

```svelte
const horizontal = input.axis('moveLeft', 'moveRight')   // -1 a 1
const move = input.vector('moveLeft', 'moveRight', 'moveForward', 'moveBack')
// move.x: -1 a 1, move.y: -1 a 1
// magnitude clamped a 1 (sem movimento diagonal mais rapido)
```

### Active Device

```svelte
input.activeDevice.current // 'keyboard' | 'gamepad'
```

Reativo -- reflete o ultimo dispositivo que forneceu input.

---

## `bvh`

Plugin que usa `three-mesh-bvh` para acelerar raycasting e habilitar queries espaciais. Funciona com Mesh, BatchedMesh e Points.

```svelte
<script lang="ts">
  import { bvh, interactivity, BVHSplitStrategy, type BVHOptions } from '@threlte/extras'

  const { raycaster } = interactivity()
  raycaster.firstHitOnly = true

  bvh(() => ({
    enabled: true,
    strategy: BVHSplitStrategy.SAH,
    indirect: false,
    verbose: false,
    maxDepth: 20,
    maxLeafTris: 10,
    setBoundingBox: true
  }))
</script>
```

### Per-object config

```svelte
<T.Mesh bvh={{ maxDepth: 10 }}>
  <T.TorusGeometry />
  <T.MeshStandardMaterial />
</T.Mesh>
```

### Opcoes

| Opcao | Default | Descricao |
|---|---|---|
| `enabled` | `true` | Habilita BVH |
| `strategy` | `SAH` | `SAH`, `CENTER` ou `AVERAGE` |
| `indirect` | `false` | Indireto |
| `verbose` | `false` | Verbose logging |
| `maxDepth` | `20` | Profundidade maxima |
| `maxLeafTris` | `10` | Triangulos maximos por folha |
| `setBoundingBox` | `true` | Auto-set bounding box |

### Limitacao

BVH nao recompute quando geometria muda -- use `{#key}` para forcar recomputacao:

```svelte
{#key geometry}
  <T.Mesh><T is={geometry} /><T.MeshStandardMaterial /></T.Mesh>
{/key}
```

### TypeScript

```typescript
import type { InteractivityProps, BVHProps } from '@threlte/extras'
declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps, BVHProps {}
  }
}
export {}
```

---

## `useTrailTexture()`

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
