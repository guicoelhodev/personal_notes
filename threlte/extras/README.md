# @threlte/extras - Indice

> Componentes, hooks e plugins utilitarios para o framework [Threlte](https://threlte.xyz/).
> Fonte oficial: https://threlte.xyz/docs/reference/extras/getting-started/

## Instalacao

```bash
npm install @threlte/extras
```

Requer `@threlte/core` instalado.

## Arquivos por Categoria

| Arquivo | Categoria | Conteudo |
|---|---|---|
| [interaction.md](./interaction.md) | **Interaction** | `interactivity()`, `<OrbitControls>`, `<CameraControls>`, `<TransformControls>`, `<Gizmo>`, `<TrackballControls>`, `useCursor`, `useKeyboard`, `useGamepad`, `useInputMap`, `bvh`, `useTrailTexture` |
| [content.md](./content.md) | **Content** | `<GLTF>`, `useGltf`, `useGltfAnimations`, `useTexture`, `<HTML>`, `<SVG>`, `<Text>`, `<Text3DGeometry>`, `<Decal>`, `<RoundedBoxGeometry>` |
| [audio.md](./audio.md) | **Audio** | `<AudioListener>`, `<Audio>`, `<PositionalAudio>`, `useThrelteAudio`, `useAudioListener` |
| [loading.md](./loading.md) | **Loading** | `<Suspense>`, `useSuspense`, `useProgress`, `onReveal`, `onSuspend` |
| [performance.md](./performance.md) | **Performance** | `<Instance>`, `<InstancedMesh>`, `<InstancedMeshes>`, `<InstancedSprite>`, `<Detailed>`, `<PerfMonitor>`, `meshBounds` |
| [staging.md](./staging.md) | **Staging** | `<Environment>`, `<CubeEnvironment>`, `<VirtualEnvironment>`, `<ContactShadows>`, `<SoftShadows>`, `<BakeShadows>`, `<ShadowAlpha>`, `<Float>`, `<Grid>`, `<Stars>`, `<Sky>`, `<Sparkles>`, `<BackdropGeometry>`, `<Billboard>`, `<CSM>`, `<Align>`, `<Bounds>`, `<Resize>`, `<Portal>`, `<View>`, `<HUD>`, `layers()`, `transitions()`, `useViewport()` |
| [visual-effects.md](./visual-effects.md) | **Visual Effects** | `<Edges>`, `<Wireframe>`, `<Outlines>`, `<AsciiRenderer>`, `<CubeCamera>`, `<FakeGlowMaterial>`, `<ImageMaterial>`, `<MeshRefractionMaterial>`, `<MeshDiscardMaterial>`, `<ShadowMaterial>`, `<Mask>`, `<UvMaterial>`, `<PointsMaterial>`, `<AnimatedSpriteMaterial>`, `<MeshLineGeometry>`, `<MeshLineMaterial>`, `<LinearGradientTexture>`, `<RadialGradientTexture>`, `useFBO()` |

## Dicas Gerais

- **Plugins** (como `interactivity`, `layers`, `transitions`) devem ser invocados no nivel raiz da aplicacao, tipicamente em `Scene.svelte`
- **Componentes extras** extendem `<T>` internamente e encaminham props/eventos do Three.js
- **Suspense-ready** significa que o componente pode ser usado dentro de `<Suspense>` para gerenciar carregamento
- **`<HTML>` nao funciona em XR** - use [threlte-uikit](https://github.com/threlte/threlte-uikit) como alternativa

## Links Uteis

- Docs oficiais @threlte/extras: https://threlte.xyz/docs/reference/extras/getting-started/
- Repositorio Threlte: https://github.com/threlte/threlte
- threlte-uikit (alternativa ao HTML para XR): https://github.com/threlte/threlte-uikit
