import {
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import CameraCapture, {
  type CameraCaptureContext,
  type CapturedFrame,
  type CaptureSession,
  type CaptureSettings,
} from "./CameraCapture"
import SvgCrop from "./SvgCrop"
import SvgFlip from "./SvgFlip"
import type { CameraCropRect, CameraViewportAspectRatio } from "./types"

interface CameraUIProps {
  autoConnect?: boolean
  aspectRatio?: CameraViewportAspectRatio
  className?: string
  defaultSettings?: Partial<CaptureSettings>
  showModeControls?: boolean
  showSettings?: boolean
  showShutter?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onCapture?: (frame: CapturedFrame) => void
  onCaptureSession?: (session: CaptureSession) => void
  children?: (frames: CapturedFrame[]) => React.ReactNode
  viewportOverlay?: (context: CameraCaptureContext) => React.ReactNode
}

type CropEditorMode = "idle" | "pan" | "resize"

const ASPECT_RATIO_CLASS: Record<string, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
}

const DEFAULT_CROP_SIZE = 0.72
const MIN_CROP_SIZE = 0.24

const CameraUI: FunctionComponent<CameraUIProps> = ({
  autoConnect = false,
  aspectRatio = "16:9",
  className = "",
  defaultSettings,
  showModeControls = true,
  showSettings = true,
  showShutter = true,
  isFullscreen,
  onToggleFullscreen,
  onCapture,
  onCaptureSession,
  children,
  viewportOverlay,
}) => {
  return (
    <CameraCapture
      aspectRatio={aspectRatio}
      defaultSettings={defaultSettings}
      onCapture={onCapture}
      onCaptureSession={onCaptureSession}
    >
      {(ctx) => (
        <CameraUIInner
          autoConnect={autoConnect}
          aspectRatio={aspectRatio}
          className={className}
          ctx={ctx}
          showModeControls={showModeControls}
          showSettings={showSettings}
          showShutter={showShutter}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          viewportOverlay={viewportOverlay}
        >
          {children}
        </CameraUIInner>
      )}
    </CameraCapture>
  )
}

interface CameraUIInnerProps {
  autoConnect?: boolean
  aspectRatio?: CameraViewportAspectRatio
  ctx: CameraCaptureContext
  className?: string
  children?: (frames: CapturedFrame[]) => React.ReactNode
  showModeControls?: boolean
  showSettings?: boolean
  showShutter?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  viewportOverlay?: (context: CameraCaptureContext) => React.ReactNode
}

function createDefaultCropRect(): CameraCropRect {
  const inset = (1 - DEFAULT_CROP_SIZE) / 2

  return {
    x: inset,
    y: inset,
    width: DEFAULT_CROP_SIZE,
    height: DEFAULT_CROP_SIZE,
  }
}

function clampCropRect(rect: CameraCropRect): CameraCropRect {
  const size = Math.min(1, Math.max(MIN_CROP_SIZE, rect.width))
  const x = Math.min(1 - size, Math.max(0, rect.x))
  const y = Math.min(1 - size, Math.max(0, rect.y))

  return {
    x,
    y,
    width: size,
    height: size,
  }
}

function getCropPreviewStyle(cropRect: CameraCropRect | null) {
  const scale = cropRect ? 1 / cropRect.width : 1
  const translateX = cropRect ? -cropRect.x * 100 * scale : 0
  const translateY = cropRect ? -cropRect.y * 100 * scale : 0

  return {
    height: `${scale * 100}%`,
    left: `${translateX}%`,
    top: `${translateY}%`,
    width: `${scale * 100}%`,
  }
}

const CameraUIInner: FunctionComponent<CameraUIInnerProps> = ({
  autoConnect = false,
  aspectRatio = "16:9",
  ctx,
  className = "",
  children,
  showModeControls = true,
  showSettings = true,
  showShutter = true,
  isFullscreen,
  onToggleFullscreen,
  viewportOverlay,
}) => {
  const {
    cameraState,
    error,
    connect,
    videoRef,
    flashRef,
    mode,
    setMode,
    isCapturing,
    onShutterDown,
    onShutterUp,
    settings,
    setSettings,
    frames,
    devices,
    activeDeviceId,
  } = ctx

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cropEditorOpen, setCropEditorOpen] = useState(false)
  const [draftCropRect, setDraftCropRect] = useState<CameraCropRect | null>(null)
  const [cropEditorMode, setCropEditorMode] = useState<CropEditorMode>("idle")
  const [pointerStart, setPointerStart] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [rectStart, setRectStart] = useState<CameraCropRect | null>(null)
  const isReady = cameraState === "ready"

  useEffect(() => {
    if (autoConnect && cameraState === "idle") {
      connect()
    }
  }, [autoConnect, cameraState, connect])

  const previewStyle = useMemo(
    () => getCropPreviewStyle(cropEditorOpen ? null : settings.cropRect),
    [cropEditorOpen, settings.cropRect],
  )

  function getNormalizedPoint(event: ReactPointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()

    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    }
  }

  function openCropEditor() {
    setDraftCropRect(settings.cropRect ?? createDefaultCropRect())
    setCropEditorMode("idle")
    setPointerStart(null)
    setRectStart(null)
    setCropEditorOpen(true)
    setSettingsOpen(false)
  }

  function cancelCropEditor() {
    setDraftCropRect(settings.cropRect)
    setCropEditorMode("idle")
    setPointerStart(null)
    setRectStart(null)
    setCropEditorOpen(false)
  }

  function clearCropSelection() {
    setSettings({ cropRect: null })
    setDraftCropRect(null)
    setCropEditorMode("idle")
    setPointerStart(null)
    setRectStart(null)
    setCropEditorOpen(false)
  }

  function applyCropSelection() {
    if (!draftCropRect) {
      return
    }

    setSettings({ cropRect: clampCropRect(draftCropRect) })
    setCropEditorMode("idle")
    setPointerStart(null)
    setRectStart(null)
    setCropEditorOpen(false)
  }

  function startCropPan(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation()
    setCropEditorMode("pan")
    setPointerStart(getNormalizedPoint(event))
    setRectStart(draftCropRect)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function startCropResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setCropEditorMode("resize")
    setPointerStart(getNormalizedPoint(event))
    setRectStart(draftCropRect)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function updateCropFromPointer(event: ReactPointerEvent<HTMLElement>) {
    if (!pointerStart || !rectStart || !draftCropRect) {
      return
    }

    const point = getNormalizedPoint(event)
    const deltaX = point.x - pointerStart.x
    const deltaY = point.y - pointerStart.y

    if (cropEditorMode === "pan") {
      setDraftCropRect(
        clampCropRect({
          ...rectStart,
          x: rectStart.x + deltaX,
          y: rectStart.y + deltaY,
        }),
      )
      return
    }

    if (cropEditorMode === "resize") {
      const delta = Math.max(deltaX, deltaY)

      setDraftCropRect(
        clampCropRect({
          ...rectStart,
          width: rectStart.width + delta,
          height: rectStart.height + delta,
        }),
      )
    }
  }

  function endCropInteraction() {
    setCropEditorMode("idle")
    setPointerStart(null)
    setRectStart(null)
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        className={`relative ${ASPECT_RATIO_CLASS[aspectRatio] ?? "aspect-video"} w-full overflow-hidden rounded-2xl bg-zinc-950`}
      >
        <div
          className="absolute inset-0"
          style={previewStyle}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{
              transform: settings.mirrorCamera ? "scaleX(-1)" : undefined,
            }}
          />
        </div>

        {cropEditorOpen && draftCropRect ? (
          <CropGuide cropRect={draftCropRect} />
        ) : null}

        {cropEditorOpen && draftCropRect ? (
          <div
            className="absolute inset-0 z-[4]"
            onPointerMove={updateCropFromPointer}
            onPointerUp={endCropInteraction}
            onPointerCancel={endCropInteraction}
          >
            <div
              className="absolute rounded-2xl border border-white/80 bg-white/5 backdrop-blur-[1px]"
              style={{
                left: `${draftCropRect.x * 100}%`,
                top: `${draftCropRect.y * 100}%`,
                width: `${draftCropRect.width * 100}%`,
                height: `${draftCropRect.height * 100}%`,
              }}
              onPointerDown={startCropPan}
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="border border-white/10" />
                ))}
              </div>
              <button
                type="button"
                aria-label="Resize crop"
                className="absolute bottom-2 right-2 h-4 w-4 rounded-full border border-white/70 bg-black/60 shadow-lg"
                onPointerDown={startCropResize}
              />
            </div>
          </div>
        ) : null}

        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 bg-white opacity-0 [&.flashing]:animate-[cameraFlash_180ms_ease-out_forwards]"
        />

        {cameraState !== "ready" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80">
            {cameraState === "error" ? (
              <>
                <span className="text-xs font-medium uppercase tracking-widest text-red-400">
                  camera error
                </span>
                {error ? (
                  <span className="max-w-xs text-center text-xs text-zinc-500">
                    {error}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => connect()}
                  className="mt-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                  retry
                </button>
              </>
            ) : cameraState === "connecting" ? (
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                connecting...
              </span>
            ) : (
              <button
                type="button"
                onClick={() => connect()}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 transition-colors group-hover:border-zinc-500 group-hover:bg-zinc-700">
                  <CameraIcon />
                </div>
                <span className="text-xs font-medium uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-zinc-300">
                  start camera
                </span>
              </button>
            )}
          </div>
        ) : null}

        {isReady && (showModeControls || showSettings || onToggleFullscreen) ? (
          <div className="absolute left-0 right-0 top-0 z-[5] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {showModeControls ? (
                  <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 backdrop-blur-sm">
                    {(["photo", "rec"] as const).map((nextMode) => (
                      <button
                        key={nextMode}
                        type="button"
                        onClick={() => setMode(nextMode)}
                        className={`rounded-md px-3 py-1 text-xs font-medium tracking-wide transition-all ${
                          mode === nextMode
                            ? "bg-white/15 text-white"
                            : "text-white/50 hover:text-white/80"
                        }`}
                      >
                        {nextMode}
                      </button>
                    ))}
                  </div>
                ) : null}

                {devices.length > 1 ? (
                  <select
                    aria-label="Select camera"
                    value={activeDeviceId ?? ""}
                    onChange={(event) => connect(event.target.value)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/70 outline-none backdrop-blur-sm"
                  >
                    {devices.map((device, index) => (
                      <option
                        key={device.deviceId}
                        value={device.deviceId}
                        className="bg-zinc-900 text-white"
                      >
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <div className="flex min-w-0 shrink-0 items-start gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      mirrorCamera: !settings.mirrorCamera,
                    })
                  }
                  className={`rounded-lg border px-3 py-1 text-xs font-medium backdrop-blur-sm transition-colors ${
                    settings.mirrorCamera
                      ? "border-white/30 bg-white/15 text-white"
                      : "border-white/10 bg-black/40 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <SvgFlip className="size-4 stroke-current" />
                    flip
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (cropEditorOpen) {
                      cancelCropEditor()
                      return
                    }

                    openCropEditor()
                  }}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium backdrop-blur-sm transition-colors ${
                    cropEditorOpen || settings.cropRect
                      ? "border-white/30 bg-white/15 text-white"
                      : "border-white/10 bg-black/40 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <SvgCrop className="size-4 stroke-current" />
                    crop
                  </span>
                </button>

                {onToggleFullscreen ? (
                  <button
                    type="button"
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    onClick={onToggleFullscreen}
                    className="rounded-full border border-white/10 bg-black/40 p-1.5 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
                  </button>
                ) : null}

                {showSettings && settingsOpen ? (
                  <SettingsPanel
                    mode={mode}
                    settings={settings}
                    setSettings={setSettings}
                    onClose={() => setSettingsOpen(false)}
                  />
                ) : showSettings ? (
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    <span className="text-xs text-white/60">
                      {mode === "rec"
                        ? `${settings.fps}fps · ${settings.recDelay / 1000}s · ${settings.recDuration / 1000}s`
                        : `${settings.fps}fps`}
                    </span>
                    <ChevronDownIcon />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {isCapturing && mode === "rec" ? (
          <div className="absolute left-1/2 top-14 z-[5] -translate-x-1/2">
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-black/50 px-3 py-1 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">rec</span>
            </div>
          </div>
        ) : null}

        {isReady && cropEditorOpen ? (
          <div className="absolute bottom-0 left-0 right-0 z-[5] flex justify-center pb-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={cancelCropEditor}
                className="rounded-md px-2.5 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={clearCropSelection}
                className="rounded-md px-2.5 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                clear
              </button>
              <button
                type="button"
                onClick={applyCropSelection}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-950"
              >
                done
              </button>
            </div>
          </div>
        ) : null}

        {isReady && showShutter && !cropEditorOpen ? (
          <div className="absolute bottom-0 left-0 right-0 z-[5] flex justify-center pb-4">
            <ShutterButton
              onShutterDown={onShutterDown}
              onShutterUp={onShutterUp}
              isCapturing={isCapturing}
              mode={mode}
            />
          </div>
        ) : null}

        {isReady && viewportOverlay ? (
          <div className="pointer-events-none absolute inset-0 z-[6]">
            {viewportOverlay(ctx)}
          </div>
        ) : null}
      </div>

      {children?.(frames)}
    </div>
  )
}

interface SettingsPanelProps {
  mode: "photo" | "rec"
  settings: CaptureSettings
  setSettings: (patch: Partial<CaptureSettings>) => void
  onClose: () => void
}

const SettingsPanel: FunctionComponent<SettingsPanelProps> = ({
  mode,
  settings,
  setSettings,
  onClose,
}) => {
  return (
    <div className="w-48 animate-[slideDown_160ms_ease-out] rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-white/50">
          settings
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 transition-colors hover:text-white/80"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <SettingRow
          label="fps"
          value={settings.fps}
          min={1}
          max={15}
          step={1}
          onChange={(value) => setSettings({ fps: value })}
        />
        {mode === "rec" ? (
          <>
            <SettingRow
              label="delay (s)"
              value={settings.recDelay / 1000}
              min={0}
              max={3}
              step={0.5}
              onChange={(value) => setSettings({ recDelay: value * 1000 })}
            />
            <SettingRow
              label="duration (s)"
              value={settings.recDuration / 1000}
              min={1}
              max={10}
              step={0.5}
              onChange={(value) => setSettings({ recDuration: value * 1000 })}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

interface SettingRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

const SettingRow: FunctionComponent<SettingRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/50">{label}</span>
      <span className="font-mono text-xs text-white/80">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
    />
  </div>
)

interface ShutterButtonProps {
  onShutterDown: () => void
  onShutterUp: () => void
  isCapturing: boolean
  mode: "photo" | "rec"
}

const ShutterButton: FunctionComponent<ShutterButtonProps> = ({
  onShutterDown,
  onShutterUp,
  isCapturing,
  mode,
}) => (
  <button
    onMouseDown={onShutterDown}
    onMouseUp={onShutterUp}
    onMouseLeave={onShutterUp}
    className="group relative flex h-14 w-14 items-center justify-center"
    aria-label="capture"
  >
    <div
      className={`absolute inset-0 rounded-full border-2 transition-all duration-150 ${
        isCapturing
          ? mode === "rec"
            ? "scale-110 border-red-400"
            : "scale-105 border-white/60"
          : "border-white/70 group-active:scale-95"
      }`}
    />
    <div
      className={`h-10 w-10 rounded-full transition-all duration-150 ${
        isCapturing
          ? mode === "rec"
            ? "scale-75 rounded-lg bg-red-500"
            : "scale-90 bg-white/80"
          : "bg-white group-active:scale-90"
      }`}
    />
  </button>
)

interface CropGuideProps {
  cropRect: CameraCropRect
}

const CropGuide: FunctionComponent<CropGuideProps> = ({ cropRect }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]">
      <div
        className="absolute rounded-2xl border border-white/70 shadow-[0_0_0_999px_rgba(0,0,0,0.34)]"
        style={{
          left: `${cropRect.x * 100}%`,
          top: `${cropRect.y * 100}%`,
          width: `${cropRect.width * 100}%`,
          height: `${cropRect.height * 100}%`,
        }}
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="border border-white/10" />
          ))}
        </div>
      </div>
    </div>
  )
}

function MaximizeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-400"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white/40"
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="text-current"
    >
      <path d="M2 2l8 8M10 2l-8 8" />
    </svg>
  )
}

export default CameraUI
