# @threlte/extras - Audio

> Audio components and hooks from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `<AudioListener>`

Audio listener component. **Must be mounted before** `<Audio>` and `<PositionalAudio>`.

```svelte
<T.PerspectiveCamera makeDefault>
  <AudioListener />
</T.PerspectiveCamera>
```

---

## `<Audio>`

Global (non-positional) audio. Uses Web Audio API.

```svelte
<Audio src="/audio/track.mp3" autoplay loop volume={0.5} />
```

Props: `src`, `autoplay`, `loop`, `volume`, `playbackRate`, `detune`, `id`.

---

## `<PositionalAudio>`

Positional (3D) audio. Affected by the position of the listener and the object.

```svelte
<T.Mesh>
  <PositionalAudio src="/sound.mp3" autoplay loop />
  <T.SphereGeometry />
</T.Mesh>
```

---

## `useThrelteAudio()`

Returns the Threlte audio context: `{ audioListeners, getAudioListener, addAudioListener, removeAudioListener }`.

---

## `useAudioListener()`

Returns an existing `THREE.AudioListener` or allows operating on it via callback.
