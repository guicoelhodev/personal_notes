# @threlte/extras - Audio

> Componentes e hooks de audio do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `<AudioListener>`

Componente de listener de audio. **Deve ser montado antes** de `<Audio>` e `<PositionalAudio>`.

```svelte
<T.PerspectiveCamera makeDefault>
  <AudioListener />
</T.PerspectiveCamera>
```

---

## `<Audio>`

Audio global (nao-posicional). Usa Web Audio API.

```svelte
<Audio src="/audio/track.mp3" autoplay loop volume={0.5} />
```

Props: `src`, `autoplay`, `loop`, `volume`, `playbackRate`, `detune`, `id`.

---

## `<PositionalAudio>`

Audio posicional (3D). Afetado pela posicao do listener e do objeto.

```svelte
<T.Mesh>
  <PositionalAudio src="/sound.mp3" autoplay loop />
  <T.SphereGeometry />
</T.Mesh>
```

---

## `useThrelteAudio()`

Retorna o contexto de audio Threlte: `{ audioListeners, getAudioListener, addAudioListener, removeAudioListener }`.

---

## `useAudioListener()`

Retorna `THREE.AudioListener` existente ou permite operar nele via callback.
