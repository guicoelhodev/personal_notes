# @threlte/extras - Loading

> Componentes e hooks para gerenciamento de carregamento do pacote [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/).

---

## `<Suspense>`

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

## `useSuspense()`

Marca recursos para uso em `<Suspense>`. Retorna funcao `suspend(promise)` e store `suspended`.

```svelte
<script>
  import { useSuspense, useTexture } from '@threlte/extras'

  const suspend = useSuspense()
  const texture = suspend(useTexture('/texture.png'))
</script>
```

---

## `useProgress()`

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

## `onReveal(callback)`

Invoca callback quando o componente e revelado (nao mais suspenso). Funciona como `onMount` dentro de `<Suspense>`.

```svelte
onReveal(() => {
  console.log('revealed')
  return () => { /* cleanup ao suspender ou desmontar */ }
})
```

---

## `onSuspend(callback)`

Invoca callback quando o componente se torna suspenso.
