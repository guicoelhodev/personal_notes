# @threlte/extras - Index

> Components, hooks, and utility plugins for the [Threlte](https://threlte.xyz/) framework.
> Official source: https://threlte.xyz/docs/reference/extras/getting-started/

## Installation

```bash
npm install @threlte/extras
```

Requires `@threlte/core` to be installed.

## Files by Category

| File | Category | Content |
|---|---|---|
| [interaction.md](./interaction.md) | **Interaction** | `interactivity()`, `<OrbitControls>`, `<CameraControls>`, `<TransformControls>`, `<Gizmo>`, `<TrackballControls>`, `useCursor`, `useKeyboard`, `useGamepad`, `useInputMap`, `bvh`, `useTrailTexture` |
| [content.md](./content.md) | **Content** | `<GLTF>`, `useGltf`, `useGltfAnimations`, `useTexture`, `<HTML>`, `<SVG>`, `<Text>`, `<Text3DGeometry>`, `<Decal>`, `<RoundedBoxGeometry>` |
| [audio.md](./audio.md) | **Audio** | `<AudioListener>`, `<Audio>`, `<PositionalAudio>`, `useThrelteAudio`, `useAudioListener` |
| [loading.md](./loading.md) | **Loading** | `<Suspense>`, `useSuspense`, `useProgress`, `onReveal`, `onSuspend` |
| [performance.md](./performance.md) | **Performance** | `<Instance>`, `<InstancedMesh>`, `<InstancedMeshes>`, `<InstancedSprite>`, `<Detailed>`, `<PerfMonitor>`, `meshBounds` |
| [staging.md](./staging.md) | **Staging** | `<Environment>`, `<CubeEnvironment>`, `<VirtualEnvironment>`, `<ContactShadows>`, `<SoftShadows>`, `<BakeShadows>`, `<ShadowAlpha>`, `<Float>`, `<Grid>`, `<Stars>`, `<Sky>`, `<Sparkles>`, `<BackdropGeometry>`, `<Billboard>`, `<CSM>`, `<Align>`, `<Bounds>`, `<Resize>`, `<Portal>`, `<View>`, `<HUD>`, `layers()`, `transitions()`, `useViewport()` |
| [visual-effects.md](./visual-effects.md) | **Visual Effects** | `<Edges>`, `<Wireframe>`, `<Outlines>`, `<AsciiRenderer>`, `<CubeCamera>`, `<FakeGlowMaterial>`, `<ImageMaterial>`, `<MeshRefractionMaterial>`, `<MeshDiscardMaterial>`, `<ShadowMaterial>`, `<Mask>`, `<UvMaterial>`, `<PointsMaterial>`, `<AnimatedSpriteMaterial>`, `<MeshLineGeometry>`, `<MeshLineMaterial>`, `<LinearGradientTexture>`, `<RadialGradientTexture>`, `useFBO()` |

## General Tips

- **Plugins** (such as `interactivity`, `layers`, `transitions`) must be invoked at the root level of the application, typically in `Scene.svelte`
- **Extra components** extend `<T>` internally and forward Three.js props/events
- **Suspense-ready** means the component can be used inside `<Suspense>` to manage loading
- **`<HTML>` does not work in XR** - use [threlte-uikit](https://github.com/threlte/threlte-uikit) as an alternative

## Useful Links

- Official @threlte/extras docs: https://threlte.xyz/docs/reference/extras/getting-started/
- Threlte repository: https://github.com/threlte/threlte
- threlte-uikit (alternative to HTML for XR): https://github.com/threlte/threlte-uikit
