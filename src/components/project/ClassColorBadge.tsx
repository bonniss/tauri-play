import { Badge, Tooltip } from '@mantine/core';
import { createContext, FunctionComponent, useContext } from 'react';
import { colorFromString } from '~/lib/project/class-color';
import { parseClassSettings } from '~/lib/project/class-settings';

export const ClassColorCycleContext = createContext<
  ((classId: string) => void) | null
>(null);

interface ClassColorBadgeProps {
  classId: string;
  classIndex: number;
  settings: string;
}

const ClassColorBadge: FunctionComponent<ClassColorBadgeProps> = ({
  classId,
  classIndex,
  settings,
}) => {
  const cycleClassColor = useContext(ClassColorCycleContext);
  const color = parseClassSettings(settings).classColor ?? colorFromString(classId);

  const badge = (
    <Badge
      radius="xs"
      size="xs"
      color={color}
      style={cycleClassColor ? { cursor: 'pointer' } : undefined}
      onClick={cycleClassColor ? () => cycleClassColor(classId) : undefined}
    >
      {classIndex + 1}
    </Badge>
  );

  if (!cycleClassColor) return badge;

  return (
    <Tooltip label="Change color" withArrow openDelay={600} withinPortal>
      {badge}
    </Tooltip>
  );
};

export default ClassColorBadge;
