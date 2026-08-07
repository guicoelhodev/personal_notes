# Ng RX

NgRx organizes application state through a predictable flow:

```text
Component/Guard dispatches an action
Effect listens to the action and calls an API, if needed
Effect dispatches success or failure
Reducer listens to the action and updates the store
Selector reads the updated data from the store
Component consumes the data as an Observable
```

## Main Pieces

### State

Defines the shape of the data stored in the store.
Example:

```ts
export interface CampaignState {
  campaign: Campaign | null;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  message: string | null;
}
```

Initial state:

```ts
export const initialCampaignState: CampaignState = {
  campaign: null,
  loading: false,
  initialLoading: false,
  error: null,
  message: null,
};
```

## Actions

Actions are events. They do not update state by themselves and do not call APIs by themselves.
Example:

```ts
export const CampaignActions = createActionGroup({
  source: 'Campaign',
  events: {
    loadCampaign: props<{ campaignId: string }>(),
    loadCampaignSuccess: props<{ campaign: Campaign }>(),
    loadCampaignFailure: props<{ error: string }>(),
  },
});
```

When we use:

```ts
CampaignActions.loadCampaign({ campaignId })
```

This creates an action with a `type` and a payload.

## Dispatch

A component or guard dispatches an action with `dispatch`.
Example:

```ts
this.store.dispatch(
  CampaignActions.loadCampaign({ campaignId })
);
```

Important: `dispatch` does not return the loaded data.
The final data should be read with `store.select(...)`.

## Effects

Effects listen to actions and execute side effects, such as HTTP requests.
Example:

```ts
export const loadCampaign$ = createEffect(
  (
    actions$ = inject(Actions),
    lokiService = inject(LokiService),
  ) => {
    return actions$.pipe(
      ofType(CampaignActions.loadCampaign),
      switchMap(({ campaignId }) =>
        lokiService.getCampaignObservale(campaignId).pipe(
          map((campaign) =>
            CampaignActions.loadCampaignSuccess({ campaign })
          ),
          catchError((error) =>
            of(
              CampaignActions.loadCampaignFailure({
                error: error?.message || 'Failed to load campaign',
              })
            )
          )
        )
      )
    );
  },
  { functional: true },
);
```

In this example:

```text
loadCampaign$ listens to CampaignActions.loadCampaign
calls the API
if it succeeds, dispatches loadCampaignSuccess
if it fails, dispatches loadCampaignFailure
```

## Reducer

The reducer updates the store when an action happens.
It does not call APIs and does not run async logic.
Example:

```ts
export const campaignReducer = createReducer(
  initialCampaignState,
  on(CampaignActions.loadCampaign, (state) => ({
    ...state,
    initialLoading: true,
    error: null,
  })),
  on(CampaignActions.loadCampaignSuccess, (state, { campaign }) => ({
    ...state,
    campaign,
    initialLoading: false,
    error: null,
  })),
  on(CampaignActions.loadCampaignFailure, (state, { error }) => ({
    ...state,
    initialLoading: false,
    error,
  })),
);
```

Important: the reducer is called automatically by NgRx when an action is dispatched.
You do not call the reducer manually.

## An Action Can Be Heard By Both Effect And Reducer

The same action can be used by an effect and a reducer at the same time.
Example:

```text
CampaignActions.loadCampaign
```

It can be used by the reducer to enable loading:

```ts
on(CampaignActions.loadCampaign, (state) => ({
  ...state,
  initialLoading: true,
}))
```

And by the effect to call the API:

```ts
ofType(CampaignActions.loadCampaign)
```

Then the effect dispatches:

```text
CampaignActions.loadCampaignSuccess
or
CampaignActions.loadCampaignFailure
```

And the reducer updates the store with the result.

## Selectors

Selectors are functions used to read data from the store.
Example:

```ts
export const selectCampaignFeature =
  createFeatureSelector<CampaignState>('campaign');
export const selectCampaign = createSelector(
  selectCampaignFeature,
  (state) => state.campaign
);
export const selectCampaignLoading = createSelector(
  selectCampaignFeature,
  (state) => state.loading
);
```

The component consumes selectors like this:

```ts
campaign$ = this.store.select(selectCampaign);
loading$ = this.store.select(selectCampaignLoading);
```

In the template:

```html
@if (campaign$ | async; as campaign) {
  {{ campaign.title }}
}
```

## Store Registration

For NgRx to work, the reducer and effects need to be registered.
Example:

```ts
provideStore(),
provideState('campaign', campaignReducer),
provideEffects(campaignEffects),
```

The name used in `provideState` must match the feature selector:

```ts
provideState('campaign', campaignReducer)
```

```ts
createFeatureSelector<CampaignState>('campaign')
```

## Complete Flow

```text
1. Component/Guard:
   dispatch loadCampaign
2. Reducer:
   listens to loadCampaign
   sets initialLoading = true
3. Effect:
   listens to loadCampaign
   calls GET /campaign/:id
4. Effect:
   on success, dispatches loadCampaignSuccess
   on error, dispatches loadCampaignFailure
5. Reducer:
   listens to success/failure
   saves campaign or error in the store
   disables loading
6. Selector:
   emits the new value
7. Component:
   receives the new value through an Observable
```

## Mental Model

```text
Action = event
Effect = API call or side effect
Reducer = updates state
Selector = reads state
Component = dispatches actions and consumes selectors
```

## Good Practices

* Do not call APIs inside reducers.
* Do not update state directly in components.
* Do not expect `dispatch` to return loaded data.
* Use selectors to read data.
* Use `load`, `loadSuccess`, and `loadFailure` actions for async flows.
* Use reducers to handle loading, success, and error states.
* Use effects to integrate with HTTP services.
* Avoid duplicating derived data in the state when it can be calculated with selectors or services.

