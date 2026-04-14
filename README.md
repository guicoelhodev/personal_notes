# AI Notes

Quick reference summaries for the main tools and frameworks used in projects.

The goal is to save **reading and context tokens** when using AI assistants (such as Claude, ChatGPT, GLM, etc.) during development. Instead of asking the model to read the full documentation every time, just provide the relevant summary.

## Structure

```
threlte/
    threlte-core-guide.md      # @threlte/core - 3D framework for Svelte
    rapier-guide.md            # @threlte/rapier - 3D physics (Rapier + Threlte)
    extras/
        README.md              # Index for the @threlte/extras package
        interaction.md         # Interaction: interactivity, OrbitControls, CameraControls, etc.
        content.md             # Content: GLTF, useTexture, HTML, Text, SVG, etc.
        audio.md               # Audio: AudioListener, Audio, PositionalAudio, etc.
        loading.md             # Loading: Suspense, useSuspense, useProgress, etc.
        performance.md         # Performance: InstancedMesh, Detailed, PerfMonitor, etc.
        staging.md             # Staging: Environment, Shadows, Grid, Sky, Float, etc.
        visual-effects.md      # Visual Effects: Edges, Wireframe, Outlines, etc.
```

Each folder represents a tool/framework, and each file is a standalone summary of a package or module.

## How to use

When starting a session with an AI assistant to work on a project, load the relevant summary(ies) as context. Example:

> "Read the file `threlte/threlte-core-guide.md` and use it as a reference to help me build a 3D scene."

This replaces the need for the model to fetch and read the full documentation, saving tokens and time.
