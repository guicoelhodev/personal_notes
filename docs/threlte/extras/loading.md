# @threlte/extras - Loading

> Components and hooks for loading management from the [Threlte Extras](https://threlte.xyz/docs/reference/extras/getting-started/) package.

---

## `<Suspense>`

Orchestrates resource loading in child components. Follows the React Suspense concept.

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

**Props:** `final` (boolean) - prevents re-suspension.

**Events:** `load`, `suspend`, `error`.

**Error boundary:** also acts as an error boundary. Use the `error` snippet:

```svelte
<Suspense>
  <Model />
  {#snippet fallback()}<p>Loading...</p>{/snippet}
  {#snippet error(e)}<p>Error: {e.message}</p>{/snippet}
</Suspense>
```

---

## `useSuspense()`

Marks resources for use with `<Suspense>`. Returns a `suspend(promise)` function and a `suspended` store.

```svelte
<script>
  import { useSuspense, useTexture } from '@threlte/extras'

  const suspend = useSuspense()
  const texture = suspend(useTexture('/texture.png'))
</script>
```

---

## `useProgress()`

Hook that wraps `THREE.DefaultLoadingManager`.

```svelte
const {
  active,       // boolean - whether it is loading
  item,         // string - current item
  loaded,       // number - items loaded
  total,        // number - total items
  errors,       // string[] - errors
  progress,     // number - normalized progress (0-1)
  finishedOnce  // boolean - whether it has completed at least once
} = useProgress()
```

---

## `onReveal(callback)`

Invokes a callback when the component is revealed (no longer suspended). Works like `onMount` inside `<Suspense>`.

```svelte
onReveal(() => {
  console.log('revealed')
  return () => { /* cleanup on suspend or unmount */ }
})
```

---

## `onSuspend(callback)`

Invokes a callback when the component becomes suspended.
