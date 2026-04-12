# @threlte/extras - Visual Effects

> Componentes e hooks de efeitos visuais do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `<Edges>`

Exibe arestas da geometria do pai (EdgesGeometry). Arestas visiveis quando angulo entre faces excede `thresholdAngle`.

```svelte
<T.Mesh>
  <T.BoxGeometry />
  <T.MeshStandardMaterial />
  <Edges color="black" thresholdAngle={20} scale={1.01} />
</T.Mesh>
```

---

## `<Wireframe>`

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

## `<Outlines>`

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

## `<AsciiRenderer>`

Renderiza a cena como ASCII (porta de Three.js AsciiEffect).

```svelte
<AsciiRenderer characters=" .:-+*=%@#" fgColor="#ff2400" bgColor="#000" />
```

Props: `characters`, `fgColor`, `bgColor`, `options` ({ alpha, block, color, invert, resolution, scale }), `autoRender`, `scene`, `camera`.

Exports: `start()`, `stop()`, `getEffect()`.

---

## `<CubeCamera>`

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

## `<FakeGlowMaterial>`

Outline de brilho usando shader customizado (sem post-processing).

```svelte
<T.Mesh>
  <FakeGlowMaterial glowColor="red" falloff={0.1} glowSharpness={1} glowInternalRadius={6} />
  <T.IcosahedronGeometry args={[4, 4]} />
</T.Mesh>
```

**Requer mesh suave.** Para meshes sharp, use esfera como substituto.

---

## `<ImageMaterial>`

Material de imagem com auto-cover e processamento de cor.

```svelte
<T.Mesh>
  <T.PlaneGeometry />
  <ImageMaterial url="photo.jpg" transparent side={DoubleSide} zoom={1.1} radius={0.1} />
</T.Mesh>
```

**Processamento de cor:** `brightness`, `contrast`, `hue` (0-1), `saturation`, `lightness`, `negative`, `monochromeColor`, `monochromeStrength`, `colorProcessingTexture` (canais RGBA controlam HSLA).

---

## `<MeshRefractionMaterial>`

Material de refracao (vidro/diamante). Requer `npm install three-mesh-bvh`.

```svelte
<T.Mesh>
  <MeshRefractionMaterial envMap={texture} ior={2.4} bounces={2} fresnel={0} />
  <T.IcosahedronGeometry args={[4, 0]} />
</T.Mesh>
```

Props: `envMap`, `ior`, `bounces`, `fresnel`, `aberrationStrength`, `color`, `fastChrome`.

---

## `<MeshDiscardMaterial>`

Material que renderiza nada (descarta fragmentos). Diferente de `visible={false}`: sombras e filhos continuam visiveis.

```svelte
<T.Mesh castShadow>
  <MeshDiscardMaterial />
  <T.BoxGeometry />
</T.Mesh>
```

---

## `<ShadowMaterial>`

Material barato que imita sombra sem luzes. Baseado em CanvasTexture.

---

## `<Mask>`

Mascara de stencil para efeitos de revelacao.

---

## `<UvMaterial>`

Material que visualiza UVs de uma geometria.

---

## `<PointsMaterial>`

Material para pontos/particulas.

---

## `<AnimatedSpriteMaterial>`

Material para sprites animados.

---

## `<MeshLineGeometry>` / `<MeshLineMaterial>`

Geometria e material para linhas 3D baseadas em mesh (suave, grossa).

---

## `<LinearGradientTexture>` / `<RadialGradientTexture>`

Texturas de gradiente (linear e radial).

---

## `useFBO()`

Cria `WebGLRenderTarget` (Framebuffer Object). Util para postprocessing.

```svelte
const target = useFBO({ size: { width: 512, height: 512 }, depth: true })
```

Se `size` nao fornecido, acompanha tamanho do canvas. `depth`: boolean, objeto `{ width, height }`, ou `DepthTexture`.
