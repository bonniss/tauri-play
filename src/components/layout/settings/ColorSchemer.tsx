import {
  SegmentedControl,
  SegmentedControlProps,
  useMantineColorScheme,
} from "@mantine/core"
import type { FunctionComponent } from "react"
import {
  IconThemeAuto,
  IconThemeDark,
  IconThemeLight,
} from "../../icon/semantic"

interface ColorSchemerProps extends Omit<
  SegmentedControlProps,
  "data" | "value" | "defaultValue" | "onChange"
> {}

const ColorSchemer: FunctionComponent<ColorSchemerProps> = (props) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  return (
    <SegmentedControl
      {...props}
      value={colorScheme}
      // @ts-ignore just ignore
      onChange={setColorScheme}
      data={[
        {
          value: "auto",
          label: <IconThemeAuto className="size-5" />,
        },
        {
          value: "dark",
          label: <IconThemeDark className="size-5" />,
        },
        {
          value: "light",
          label: <IconThemeLight className="size-5" />,
        },
      ]}
    />
  )
}

export default ColorSchemer
