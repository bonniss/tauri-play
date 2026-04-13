import {
  FormEvent,
  FunctionComponent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"

interface ContentEditableProps {
  activeClassName?: string
  ariaLabel: string
  className?: string
  inactiveClassName?: string
  multiline?: boolean
  onCommit?: (value: string) => void | Promise<void>
  placeholder?: string
  value: string
}

const ContentEditable: FunctionComponent<ContentEditableProps> = ({
  activeClassName,
  ariaLabel,
  className,
  inactiveClassName,
  multiline = false,
  onCommit,
  placeholder,
  value,
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const focusedRef = useRef(false)
  const draftValueRef = useRef(value)
  const [isActive, setIsActive] = useState(false)
  const [isEmpty, setIsEmpty] = useState(value.trim().length === 0)

  useEffect(() => {
    draftValueRef.current = value
    setIsEmpty(value.trim().length === 0)

    if (!focusedRef.current && elementRef.current) {
      elementRef.current.textContent = value
    }
  }, [value])

  function flushCommit() {
    if (!onCommit) {
      return
    }

    void onCommit(draftValueRef.current)
  }

  function handleInput(event: FormEvent<HTMLDivElement>) {
    draftValueRef.current = event.currentTarget.textContent ?? ""
    setIsEmpty(draftValueRef.current.trim().length === 0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!multiline && event.key === "Enter") {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  return (
    <div className="relative">
      {placeholder && isEmpty ? (
        <span className="pointer-events-none absolute inset-0 text-current opacity-50">
          {placeholder}
        </span>
      ) : null}
      <div
        aria-label={ariaLabel}
        className={[
          className,
          isActive ? activeClassName : inactiveClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        contentEditable
        onBlur={() => {
          focusedRef.current = false
          setIsActive(false)
          flushCommit()
        }}
        onFocus={() => {
          focusedRef.current = true
          setIsActive(true)
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        ref={elementRef}
        role="textbox"
        suppressContentEditableWarning
      >
        {value}
      </div>
    </div>
  )
}

export default ContentEditable
