import { useState, type FunctionComponent } from "react"
import CameraCapture, {
  type CameraCaptureContext,
  type CapturedFrame,
  type CaptureSettings,
} from "./CameraCapture"

interface CameraUIProps {
  className?: string
  defaultSettings?: Partial<CaptureSettings>
  onCapture?: (frame: CapturedFrame) => void
  children?: (frames: CapturedFrame[]) => React.ReactNode
}

const CameraUI: FunctionComponent<CameraUIProps> = ({
  className = "",
  defaultSettings,
  onCapture,
  children,
}) => {
  return (
    <CameraCapture defaultSettings={defaultSettings} onCapture={onCapture}>
      {(ctx) => (
        <CameraUIInner ctx={ctx} className={className}>
          {children}
        </CameraUIInner>
      )}
    </CameraCapture>
  )
}

interface CameraUIInnerProps {
  ctx: CameraCaptureContext
  className?: string
  children?: (frames: CapturedFrame[]) => React.ReactNode
}

const CameraUIInner: FunctionComponent<CameraUIInnerProps> = ({
  ctx,
  className = "",
  children,
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
  } = ctx

  const [settingsOpen, setSettingsOpen] = useState(false)
  const isReady = cameraState === "ready"

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* camera frame */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950">
        {/* video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {/* flash overlay */}
        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 bg-white opacity-0 [&.flashing]:animate-[cameraFlash_180ms_ease-out_forwards]"
        />

        {/* idle / connecting / error overlay */}
        {cameraState !== "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80">
            {cameraState === "error" ? (
              <>
                <span className="text-xs font-medium tracking-widest text-red-400 uppercase">
                  camera error
                </span>
                {error && (
                  <span className="max-w-xs text-center text-xs text-zinc-500">
                    {error}
                  </span>
                )}
                <button
                  onClick={connect}
                  className="mt-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                  retry
                </button>
              </>
            ) : cameraState === "connecting" ? (
              <span className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
                connecting...
              </span>
            ) : (
              <button
                onClick={connect}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 transition-colors group-hover:border-zinc-500 group-hover:bg-zinc-700">
                  <CameraIcon />
                </div>
                <span className="text-xs font-medium tracking-widest text-zinc-500 uppercase transition-colors group-hover:text-zinc-300">
                  start camera
                </span>
              </button>
            )}
          </div>
        )}

        {/* top bar overlay */}
        {isReady && (
          <div className="absolute top-0 left-0 right-0 p-3">
            <div className="flex items-start justify-between gap-2">
              {/* mode segmented */}
              <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 backdrop-blur-sm">
                {(["photo", "rec"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-3 py-1 text-xs font-medium tracking-wide transition-all ${
                      mode === m
                        ? "bg-white/15 text-white"
                        : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* settings */}
              <div className="min-w-0 flex-shrink-0">
                {settingsOpen ? (
                  <SettingsPanel
                    mode={mode}
                    settings={settings}
                    setSettings={setSettings}
                    onClose={() => setSettingsOpen(false)}
                  />
                ) : (
                  <button
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* rec indicator */}
        {isCapturing && mode === "rec" && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-black/50 px-3 py-1 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">rec</span>
            </div>
          </div>
        )}

        {/* shutter bottom center */}
        {isReady && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
            <ShutterButton
              onShutterDown={onShutterDown}
              onShutterUp={onShutterUp}
              isCapturing={isCapturing}
              mode={mode}
            />
          </div>
        )}
      </div>

      {/* frames — render prop */}
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
        <span className="text-xs font-medium tracking-wide text-white/50 uppercase">
          settings
        </span>
        <button
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
          onChange={(v) => setSettings({ fps: v })}
        />
        {mode === "rec" && (
          <>
            <SettingRow
              label="delay (s)"
              value={settings.recDelay / 1000}
              min={0}
              max={3}
              step={0.5}
              onChange={(v) => setSettings({ recDelay: v * 1000 })}
            />
            <SettingRow
              label="duration (s)"
              value={settings.recDuration / 1000}
              min={1}
              max={10}
              step={0.5}
              onChange={(v) => setSettings({ recDuration: v * 1000 })}
            />
          </>
        )}
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
  onChange: (v: number) => void
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
      onChange={(e) => onChange(Number(e.target.value))}
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
    {/* outer ring */}
    <div
      className={`absolute inset-0 rounded-full border-2 transition-all duration-150 ${
        isCapturing
          ? mode === "rec"
            ? "border-red-400 scale-110"
            : "border-white/60 scale-105"
          : "border-white/70 group-active:scale-95"
      }`}
    />
    {/* inner disc */}
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

// icons — inline svg, no deps

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
