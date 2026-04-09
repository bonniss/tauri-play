# 004 Camera Capture Component

## Purpose

This document defines the camera capture component for the app.

The component is the foundation for all sample collection. It handles webcam access, single shot, burst, and recording capture modes, sound feedback, and frame output — and exposes everything via a headless render prop API so the parent controls all UI.

## Design Principle

The component is as headless as possible.

It owns:

- webcam stream lifecycle
- capture logic (single, burst, rec)
- frame accumulation
- sound feedback
- flash trigger timing

It does not own:

- any visible UI
- layout or styling
- how frames are displayed
- the shutter button appearance
- the settings panel appearance

The parent receives full context via a render function children prop and builds all UI from that.

## API

### Props

```tsx
interface CameraCaptureProps {
  children: (context: CameraCaptureContext) => React.ReactNode
  defaultSettings?: Partial<CaptureSettings>
  onCapture?: (frame: CapturedFrame) => void
}
```

`onCapture` fires for every individual frame captured, in all modes. Useful for wiring up persistence without touching frames array directly.

### Context Shape

```tsx
interface CameraCaptureContext {
  // camera lifecycle
  cameraState: 'idle' | 'connecting' | 'ready' | 'error'
  error: string | null
  connect: () => void
  disconnect: () => void
  videoRef: React.RefObject<HTMLVideoElement>

  // mode
  mode: 'photo' | 'rec'
  setMode: (mode: 'photo' | 'rec') => void

  // capture
  isCapturing: boolean
  captureCount: number
  onShutterDown: () => void
  onShutterUp: () => void

  // settings
  settings: CaptureSettings
  setSettings: (patch: Partial<CaptureSettings>) => void

  // frames
  frames: CapturedFrame[]
  clear: () => void
}
```

### Settings

```tsx
interface CaptureSettings {
  fps: number           // capture rate for burst and rec, default 4
  recDelay: number      // ms before rec starts capturing, default 500
  recDuration: number   // ms of rec capture window, default 2000
}
```

These have sensible defaults and can be overridden via `defaultSettings` prop or via `setSettings` at runtime.

### Frame

```tsx
interface CapturedFrame {
  id: string
  dataUrl: string
  capturedAt: number
  source: 'single' | 'burst' | 'rec'
}
```

## Capture Behavior

### Single shot (photo mode)

- user presses and releases shutter in under `HOLD_THRESHOLD` ms
- one frame is captured on release
- tick sound plays
- flash triggers

`HOLD_THRESHOLD` is a named constant in the component file, default `400` ms. Easy to adjust without touching logic.

### Burst (photo mode)

- user presses and holds shutter for at least `HOLD_THRESHOLD` ms
- burst starts: frames captured continuously at `settings.fps`
- tick sound plays on every frame
- flash triggers on every frame
- burst stops when user releases shutter
- positive feedback sound plays on stop

### Recording (rec mode)

- user presses shutter once
- rec delay waits `settings.recDelay` ms (no capture yet)
- capture starts: frames at `settings.fps` for `settings.recDuration` ms
- tick sound on every frame, flash on every frame
- capture ends automatically after duration
- positive feedback sound plays on end
- pressing shutter again during rec does nothing (debounced)

## Sound Feedback

All sounds are generated via Web Audio API. No audio files required.

### Tick sound

Plays on every individual frame captured across all modes.

```
OscillatorNode — sine wave
frequency: 1100 Hz
attack: 3 ms
decay: 72 ms
peak gain: 0.15
total duration: ~80 ms
```

Must be short enough to not overlap at high fps. At 4 fps (250 ms interval) there is no overlap. At 10 fps (100 ms interval) the tail may slightly overlap — acceptable.

### Positive feedback sound

Plays once when a burst ends (on shutter release) or a rec ends (after duration).

```
Two tones in sequence:
  note 1 — 880 Hz, 110 ms, peak gain 0.14
  note 2 — 1320 Hz, 130 ms, peak gain 0.12
  gap between notes — 110 ms
  wave type — sine
```

Ascending interval gives a clear "done" signal distinct from the tick.

### Implementation note

AudioContext must be created (or resumed) inside a user gesture handler to satisfy browser autoplay policy. Initialize lazily on first shutter interaction.

## Flash Feedback

On every frame capture, the component calls a flash trigger.

The flash is implemented as a white overlay div rendered inside the video container by the parent. The component exposes `flashRef` — a ref the parent attaches to whatever element should flash.

```tsx
// parent usage
<div style={{ position: 'relative' }}>
  <video ref={videoRef} />
  <div ref={flashRef} className="flash-overlay" />
</div>
```

The component triggers the flash by toggling a CSS class on `flashRef.current`. The animation itself is owned by the parent's CSS.

Recommended animation:

```css
.flash-overlay {
  position: absolute;
  inset: 0;
  background: white;
  opacity: 0;
  pointer-events: none;
}
.flash-overlay.flashing {
  animation: cameraFlash 180ms ease-out forwards;
}
@keyframes cameraFlash {
  0%   { opacity: 0.55; }
  100% { opacity: 0; }
}
```

`flashRef` is part of the context shape:

```tsx
flashRef: React.RefObject<HTMLDivElement>
```

## Settings UI Convention

The component does not render settings UI. The parent owns it entirely.

The recommended pattern (matching the reference design) is an iPhone camera-style collapsible bar:

- compact state: shows current values read-only, e.g. `4 fps · 0.5 s delay · 2 s duration`
- expanded state: shows inputs for each setting relevant to the current mode
- transition: smooth expand/collapse, triggered by tapping the compact bar
- photo mode shows: fps only
- rec mode shows: fps, rec delay, rec duration

The parent reads `settings` and `mode` from context to drive this UI, and calls `setSettings` to apply changes.

## Usage Example

```tsx
<CameraCapture onCapture={handleCapture}>
  {({
    cameraState, error,
    connect, disconnect,
    videoRef, flashRef,
    mode, setMode,
    isCapturing, captureCount,
    onShutterDown, onShutterUp,
    settings, setSettings,
    frames, clear,
  }) => (
    <div className="...">
      {/* preview */}
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} autoPlay muted playsInline />
        <div ref={flashRef} className="flash-overlay" />
      </div>

      {/* shutter */}
      <button
        onMouseDown={onShutterDown}
        onMouseUp={onShutterUp}
        onMouseLeave={onShutterUp}
      >
        {isCapturing ? 'capturing...' : 'capture'}
      </button>

      {/* mode */}
      <button onClick={() => setMode(mode === 'photo' ? 'rec' : 'photo')}>
        {mode}
      </button>

      {/* frame count */}
      <span>{captureCount} frames</span>

      {/* frames — render however */}
      {frames.map(f => (
        <img key={f.id} src={f.dataUrl} />
      ))}
    </div>
  )}
</CameraCapture>
```

## Internal Structure

```
CameraCapture (logic only, renders null for UI)
  ├── hidden <video> ref
  ├── hidden <canvas> ref (used for frame extraction only)
  ├── useCamera hook — stream lifecycle
  ├── useCapture hook — single / burst / rec logic
  ├── useCaptureSound hook — Web Audio tick + positive
  └── renders children(context)
```

Hooks are internal to the component. They are not exported.

## File Location

```
src/components/camera/CameraCapture.tsx
```

The existing `CameraCapture.tsx` should be refactored in place to match this spec.

## Constants (in component file)

```ts
const HOLD_THRESHOLD_MS = 400
const DEFAULT_FPS = 4
const DEFAULT_REC_DELAY_MS = 500
const DEFAULT_REC_DURATION_MS = 2000
```

## UI Component — CameraUI

`CameraUI` is a ready-made consumer of `CameraCapture`. It provides a complete overlay UI while staying styleable via Tailwind classes on the container.

### File

```
src/components/camera/CameraUI.tsx
```

### Props

```tsx
interface CameraUIProps {
  className?: string
  defaultSettings?: Partial<CaptureSettings>
  onCapture?: (frame: CapturedFrame) => void
  children?: (frames: CapturedFrame[]) => React.ReactNode
}
```

`children` is a render prop for frames — parent decides how thumbnails are displayed.

### Usage

```tsx
<CameraUI
  className="max-w-2xl"
  onCapture={(frame) => saveCapturedImage(frame)}
>
  {(frames) => (
    <div className="grid grid-cols-4 gap-2">
      {frames.map((f) => (
        <img key={f.id} src={f.dataUrl} className="rounded-lg aspect-square object-cover" />
      ))}
    </div>
  )}
</CameraUI>
```

### Layout

```
┌─────────────────────────────────────┐
│  [photo | rec]        [4fps ▾]      │  ← top bar overlay
│                                     │
│                                     │
│              [video]                │
│                                     │
│                                     │
│               [ ◉ ]                 │  ← shutter, bottom center
└─────────────────────────────────────┘
  {children(frames)}                     ← outside frame, render prop
```

Default ratio: `aspect-video` (16/9). Override via `className`.

### Settings panel

- compact state: shows `4fps` (photo) or `4fps · 0.5s · 2s` (rec), readonly
- click to expand: slides down with 160ms ease-out transition
- expanded: slider rows per setting, filtered by current mode
- photo mode: fps only
- rec mode: fps, rec delay (s), rec duration (s)
- close button collapses back to compact

### Shutter button states

- idle: white disc + white ring
- burst active: slightly scaled ring, dimmed disc
- rec active: ring scales up + red tint, inner disc becomes rounded square (red)

### Required keyframes (add to `src/assets/styles/index.css`)

```css
@keyframes cameraFlash {
  0%   { opacity: 0.55; }
  100% { opacity: 0; }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

## NFR

- no audio files bundled — all sound via Web Audio API
- AudioContext created lazily on first user gesture
- no memory leak from unreleased camera streams — `disconnect` always stops all tracks
- canvas element never appears in DOM visibly — used only for frame extraction
- component must handle camera permission denied, no device found, and stream interrupted gracefully — all surfaced via `cameraState` and `error`