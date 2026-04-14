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

  useEffect(() => {
    draftValueRef.current = value
    setIsEmpty(value.trim().length === 0)

    if (!focusedRef.current && elementRef.current) {
      elementRef.current.textContent = value
    }
  }, [value])

  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus()
    }
  }, [autoFocus])

  function flushBlur() {
    if (!onBlur) {
      return
    }

    void onBlur(draftValueRef.current)
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
      className={[className, isActive ? focusedClassName : null]
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
      {!isActive && isEmpty && placeholder ? placeholder : value}
    </Element>
  )
}

export default ContentEditable
