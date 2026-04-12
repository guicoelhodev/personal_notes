# @threlte/rapier - Guia de Referencia Rapido

> Resumo da integracao do motor de fisica [Rapier](https://rapier.rs/) com o framework [Threlte](https://threlte.xyz/) para Svelte/Three.js.  
> Fonte oficial: https://threlte.xyz/docs/reference/rapier/getting-started/

---

## O que e?

`@threlte/rapier` e um pacote que integra o motor de fisica **Rapier** (escrito em Rust, compilado para WASM) ao ecossistema **Threlte**. Ele fornece componentes Svelte e hooks para simulacao de fisica 3D (colisoes, gravidade, forcas, articulacoes) de forma declarativa, diretamente nos seus componentes Svelte.

---

## Instalacao

```bash
npm install @threlte/rapier @dimforge/rapier3d-compat
```

Requer `@threlte/core` instalado.

---

## Arquitetura Basica

A estrutura obrigatoria envolve tres camadas:

```
<Canvas>              (do @threlte/core)
  └─ <World>          (do @threlte/rapier - contexto de fisica)
       └─ <RigidBody> (corpo rigido)
            └─ <Collider> ou <AutoColliders>  (forma geometrica de colisao)
                 └─ <T.Mesh>  (mesh visual Three.js)
```

**Exemplo minimo:**

```svelte
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { World, RigidBody, Collider } from '@threlte/rapier'
</script>

<Canvas>
  <World>
    <RigidBody type="dynamic">
      <Collider shape="cuboid" args={[0.5, 0.5, 0.5]} />
      <T.Mesh>
        <T.BoxGeometry args={[1, 1, 1]} />
        <T.MeshStandardMaterial />
      </T.Mesh>
    </RigidBody>
  </World>
</Canvas>
```

---

## Componentes

### `<World>`

- Contexto raiz de toda a fisica. Carrega o modulo WASM do Rapier.
- Todos os componentes de fisica devem ser filhos dele.
- Suporta um **slot `fallback`** caso o WASM falhe ao carregar.
- Apenas **uma instancia** `<World>` e suportada por aplicacao.

| Prop principal | Tipo | Default | Descricao |
|---|---|---|---|
| `gravity` | `Position` | `{ y: -9.81 }` | Gravidade do mundo |
| `framerate` | `number \| "varying"` | `"varying"` | FPS da simulacao (ver secao Framerate) |

```svelte
<World gravity={{ y: -9.81 }}>
  <!-- ... -->
  {#snippet fallback()}
    <FallbackScene />
  {/snippet}
</World>
```

---

### `<RigidBody>`

- Define um corpo rigido que sofre acao de forcas, gravidade e contatos.
- **Tipos:**
  - `dynamic` (default) - afetado por gravidade e forcas
  - `fixed` - estatico, nao se move (ideal para chao, paredes)
  - `kinematicPosition` - controlado via codigo, outros corpos colidem com ele
  - `kinematicVelocity` - controlado via velocidade

| Prop principal | Tipo | Default | Descricao |
|---|---|---|---|
| `type` | `string` | `'dynamic'` | Tipo do corpo rigido |
| `linearVelocity` | `Position` | `{}` | Velocidade linear inicial |
| `angularVelocity` | `Rotation` | `{}` | Velocidade angular inicial |
| `gravityScale` | `number` | `1` | Escala da gravidade |
| `linearDamping` | `number` | `0` | Amortecimento linear |
| `angularDamping` | `number` | `0` | Amortecimento angular |
| `lockRotations` | `boolean` | `false` | Congela rotacao |
| `lockTranslations` | `boolean` | `false` | Congela translacao |
| `canSleep` | `boolean` | `true` | Permite dormir o corpo |
| `ccd` | `boolean` | `false` | Continuous Collision Detection |

**Eventos principais:**

| Evento | Payload |
|---|---|
| `oncollisionenter` | `targetCollider`, `targetRigidBody`, `manifold` |
| `oncollisionexit` | `targetCollider`, `targetRigidBody` |
| `oncontact` | `targetCollider`, `manifold`, `totalForceMagnitude` |
| `onsensorenter` | `targetCollider`, `targetRigidBody` |
| `onsensorexit` | `targetCollider`, `targetRigidBody` |
| `onsleep` / `onwake` | `void` |

**Binding:**

```svelte
<RigidBody bind:rigidBody={myBody} />
<!-- myBody: RAPIER.RigidBody - acesso direto a API do Rapier -->
```

---

### `<Collider>`

- Define a forma geometrica para deteccao de colisao.
- **Deve ser filho de `<RigidBody>`** para que o corpo sofra forcas de contato.
- Pode ser **standalone** (sem `<RigidBody>` pai) - participa de colisoes mas nao e afetado por forcas (bom para ambiente estatico).
- Pode funcionar como **sensor** (detecta presenca sem gerar forcas de contato).

| Prop principal | Tipo | Descricao |
|---|---|---|
| `shape` | `string` (obrigatorio) | Forma: `ball`, `cuboid`, `capsule`, `cylinder`, `cone`, `trimesh`, `convexHull`, `convexMesh`, `heightfield`, etc. |
| `args` | `array` (obrigatorio) | Argumentos da forma (ex: cuboid = [hx, hy, hz]) |
| `sensor` | `boolean` | Modo sensor (detecao sem contato) |
| `friction` | `number` | Friccao |
| `restitution` | `number` | Elasticidade (bounce) |
| `density` | `number` | Densidade (massa = densidade x volume) |
| `mass` | `number` | Massa direta |
| `contactForceEventThreshold` | `number` | Limiar para disparar eventos de contato |

**Formas e args comuns:**

| Shape | Args | Exemplo |
|---|---|---|
| `ball` | `[raio]` | `args={[0.5]}` |
| `cuboid` | `[hx, hy, hz]` | `args={[1, 1, 1]}` |
| `capsule` | `[half-height, raio]` | `args={[0.5, 0.25]}` |
| `cylinder` | `[half-height, raio]` | `args={[1, 0.5]}` |
| `cone` | `[half-height, raio]` | `args={[1, 0.5]}` |

---

### `<AutoColliders>`

- Gera colliders automaticamente baseado nos meshes filhos.
- Shapes disponiveis: `cuboid`, `ball`, `capsule`, `trimesh`, `convexHull` (default: `convexHull`).
- Ideal para modelos GLTF carregados onde nao se conhece a geometria exata.

```svelte
<RigidBody>
  <AutoColliders shape="convexHull">
    <T.Mesh geometry={$helmet.geometry} material={$helmet.material} />
  </AutoColliders>
</RigidBody>
```

| Shape | Descricao |
|---|---|
| `convexHull` | Envoltoria convexa da geometria (recomendado para modelos) |
| `trimesh` | Malha poligonal exata (mais preciso, mais pesado) |
| `cuboid` | Bounding box como cubo |
| `ball` | Bounding box como esfera |
| `capsule` | Bounding box como capsula |

---

### `<CollisionGroups>`

- Controla quais colliders interagem entre si via sistema de grupos (32 grupos disponiveis).
- Similar a "layers" de colisao em game engines.

---

### `<Attractor>`

- Aplica forcas de atracao (ex: gravidade pontual) sobre corpos rigidos proximos.

---

### `<Debug>`

- Renderiza visualmente todos os colliders da cena para depuracao.

```svelte
<Debug />
```

---

## Hooks

### `useRapier()`

- Acesso direto ao mundo de fisica `RAPIER.World` e funcoes de contexto.

```typescript
const {
  rapier,                          // modulo RAPIER
  world,                           // RAPIER.World
  colliderObjects,                 // Map<number, Object3D>
  rigidBodyObjects,                // Map<number, Object3D>
  addColliderToContext,            // registra collider no sistema de eventos
  removeColliderFromContext,
  addRigidBodyToContext,
  removeRigidBodyFromContext
} = useRapier()
```

**Uso comum - alterar gravidade:**

```svelte
const { world } = useRapier()
world.gravity = { x: 0, y: 0, z: 0 }
```

---

### `useRigidBody()`

- Retorna o `RAPIER.RigidBody` do `<RigidBody>` pai. `undefined` se nao houver pai.

```typescript
const rigidBody = useRigidBody() // RAPIER.RigidBody | undefined
```

---

### `usePhysicsTask(callback)`

- Similar ao `useTask` do Threlte, mas executado **antes** do step de fisica.
- Na etapa de `simulation`, garante que seu codigo roda antes da fisica avancar.
- Com framerate fixo, recebe o delta fixo (ex: `1/200 = 0.005`).

```svelte
usePhysicsTask((delta) => {
  // manipular estado antes do step de fisica
  rigidBody?.setNextKinematicTranslation({ x: 1, y: 2, z: 3 })
})
```

---

### `useCollisionGroups()`

- Gerencia grupos de colisao de forma reativa.

---

## Joints (Articulacoes)

Joints restringem o movimento relativo entre dois corpos rigidos. Implementados como **hooks** (nao componentes), pois dois RigidBodies nao necessariamente estao na mesma arvore de componentes.

| Joint | Hook | Descricao |
|---|---|---|
| **Fixed** | `useFixedJoint()` | Corpos presos, sem movimento relativo |
| **Revolute** | `useRevoluteJoint()` | Rotacao em um eixo (ex: dobradica) |
| **Prismatic** | `usePrismaticJoint()` | Translacao em um eixo (ex: piston) |
| **Spherical** | `useSphericalJoint()` | Rotacao livre (ex: ombro, ball-in-socket) |
| **Rope** | `useRopeJoint()` | Restricao de distancia (ex: corda) |

```svelte
<script>
  import { useFixedJoint } from '@threlte/rapier'
  const { joint } = useFixedJoint(bodyA, bodyB, params)
</script>
```

---

## Framerate da Fisica

Controlado pela prop `framerate` do `<World>`:

### `framerate="varying"` (default)

- A fisica avança usando o delta real do `requestAnimationFrame`.
- Simples, porem **nao deterministico** (resultados podem variar entre execucoes).
- Recomendado para a maioria das aplicacoes.

### `framerate={numero}` (ex: `framerate={60}`)

- Avanca a simulacao N vezes por segundo com delta fixo.
- **Deterministico** - mesma simulacao sempre gera o mesmo resultado.
- Threlte "roda a fisica a frente" e depois interpola visualmente para manter suavidade.
- Ideal para jogos ou cenarios que precisam de reprodutibilidade.

---

## Padrões Comuns

### Corpo Dinamico com Colisao Manual

```svelte
<RigidBody type="dynamic">
  <Collider shape="ball" args={[0.5]} restitution={0.8} />
  <T.Mesh>
    <T.SphereGeometry args={[0.5]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
</RigidBody>
```

### Chao Estatico

```svelte
<RigidBody type="fixed">
  <AutoColliders shape="cuboid">
    <T.Mesh>
      <T.BoxGeometry args={[20, 1, 20]} />
      <T.MeshStandardMaterial />
    </T.Mesh>
  </AutoColliders>
</RigidBody>
```

### Plataforma Cinematica

```svelte
<script>
  import { useTask } from '@threlte/core'
  let body = $state()
  useTask(() => {
    body?.setNextKinematicTranslation({
      x: Math.sin(Date.now() / 1000) * 3,
      y: 2, z: 0
    })
  })
</script>

<RigidBody type="kinematicPosition" bind:rigidBody={body} lockRotations>
  <AutoColliders shape="ball">
    <T.Mesh><T.SphereGeometry /><T.MeshStandardMaterial /></T.Mesh>
  </AutoColliders>
</RigidBody>
```

### Sensor de Area (sem contato fisico)

```svelte
<Collider
  sensor
  shape="cuboid"
  args={[2, 2, 2]}
  onsensorenter={() => (playerInside = true)}
  onsensorexit={() => (playerInside = false)}
/>
```

### Modelo GLTF com Fisica

```svelte
<RigidBody>
  <AutoColliders shape="convexHull">
    <T.Mesh geometry={$model.geometry} material={$model.material} />
  </AutoColliders>
</RigidBody>
```

### Collider Standalone (ambiente sem forcas)

```svelte
<Collider shape="cuboid" args={[1, 1, 1]} />
<!-- Nao e filho de RigidBody - participe de colisoes mas nao e afetado por gravidade -->
```

---

## Dicas Importantes

- **WASM**: Rapier e compilado como modulo WASM. Sempre forneça um `fallback` no `<World>`.
- **Uma unica instancia**: Apenas um `<World>` por aplicacao Threlte.
- **API instavel**: O pacote esta em desenvolvimento ativo, a API pode mudar.
- **Massa automatica**: Se nao fornecer `density`, `mass` ou `massProperties`, Rapier calcula automaticamente.
- **Trimesh vs ConvexHull**: `trimesh` e mais preciso para geometrias concavas mas mais pesado computacionalmente. `convexHull` e mais performatico e recomendado para a maioria dos casos.
- **usePhysicsTask vs useTask**: Use `usePhysicsTask` quando precisar modificar o estado da fisica antes do step. Use `useTask` para logica de renderizacao.

---

## Links Uteis

- Docs oficiais Threlte Rapier: https://threlte.xyz/docs/reference/rapier/getting-started/
- Docs do Rapier: https://rapier.rs/docs/
- Repositorio Threlte: https://github.com/threlte/threlte
