import {
  ComponentPropsWithoutRef,
  FormEvent,
  FunctionComponent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"

type ContentEditableElement = keyof Pick<
  HTMLElementTagNameMap,
  "div" | "p" | "span" | "h1" | "h2" | "h3"
>

interface ContentEditableProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "contentEditable" | "onBlur" | "onInput"
  > {
  as?: ContentEditableElement
  focusedClassName?: string
  multiline?: boolean
  onBlur?: (value: string) => void | Promise<void>
  onInput?: (value: string) => void
  placeholder?: string
  value: string
}

const ContentEditable: FunctionComponent<ContentEditableProps> = ({
  as = "div",
  autoFocus,
  className,
  focusedClassName,
  multiline = false,
  onBlur,
  onInput,
  placeholder,
  role,
  suppressContentEditableWarning,
  value,
  ...props
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const Element = as
  const focusedRef = useRef(false)
  const draftValueRef = useRef(value)
  const [isActive, setIsActive] = useState(false)
  const [isEmpty, setIsEmpty] = useState(value.trim().length === 0)
  const defaultClassName =
    "rounded px-1 py-0.5 outline-none transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/75 dark:hover:text-orange-200"
  const defaultFocusedClassName =
    "bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"

  useEffect(() => {
    draftValueRef.current = value
    const nextIsEmpty = value.trim().length === 0
    setIsEmpty(nextIsEmpty)

    if (!focusedRef.current && elementRef.current) {
      elementRef.current.textContent =
        nextIsEmpty && placeholder ? placeholder : value
    }
  }, [value, placeholder])

  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus()
    }
  }, [autoFocus])

  function flushBlur() {
    const trimmedValue = draftValueRef.current.trim()
    const normalizedValue = value.trim()

    if (!trimmedValue) {
      draftValueRef.current = value
      setIsEmpty(value.trim().length === 0)

      if (elementRef.current) {
        elementRef.current.textContent = placeholder ?? value
      }

      return
    }

    if (trimmedValue === normalizedValue) {
      draftValueRef.current = value

      if (elementRef.current) {
        elementRef.current.textContent = value
      }

      return
    }

    if (!onBlur) {
      return
    }

    void onBlur(trimmedValue)
  }

  function handleInput(event: FormEvent<HTMLDivElement>) {
    draftValueRef.current = event.currentTarget.textContent ?? ""
    setIsEmpty(draftValueRef.current.trim().length === 0)
    onInput?.(draftValueRef.current)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!multiline && event.key === "Enter") {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  return (
    <Element
      className={[
        defaultClassName,
        className,
        isActive ? defaultFocusedClassName : null,
        isActive ? focusedClassName : null,
      ]
        .filter(Boolean)
        .join(" ")}
      contentEditable
      {...props}
      onBlur={() => {
        focusedRef.current = false
        setIsActive(false)
        flushBlur()
      }}
      onFocus={() => {
        focusedRef.current = true
        setIsActive(true)

        if (isEmpty && elementRef.current) {
          elementRef.current.textContent = ""
        }
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      ref={elementRef}
      role={role ?? "textbox"}
      suppressContentEditableWarning={suppressContentEditableWarning ?? true}
    >
      {value}
    </Element>
  )
}

export default ContentEditable
