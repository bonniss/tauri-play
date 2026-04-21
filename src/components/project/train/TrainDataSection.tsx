import { Drawer, SegmentedControl } from '@mantine/core';
import SampleGrid from '~/components/project/SampleGrid';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';
import { useProjectOne } from '~/components/project/ProjectOneProvider';

function TrainDataSection() {
  const { projectSettings } = useProjectOne();
  const {
    displayedSplitSamples,
    inspectDataOpened,
    setInspectDataOpened,
    setTrainDataView,
    splitClassColorMap,
    splitClassIndexMap,
    trainDataView,
    trainDataViewOptions,
  } = useDataTrain();

  return (
    <Drawer
      onClose={() => {
        setInspectDataOpened(false);
      }}
      opened={inspectDataOpened}
      padding="md"
      position="bottom"
      size="75%"
      title={
        <SegmentedControl
          data={trainDataViewOptions}
          onChange={(value) => {
            setTrainDataView(value as 'train' | 'validation');
          }}
          value={trainDataView}
        />
      }
    >
      <div className="container space-y-4">
        <SampleGrid
          classColorMap={splitClassColorMap}
          classIndexMap={splitClassIndexMap}
          samplePathPattern={projectSettings.samplePathPattern}
          samples={displayedSplitSamples}
        />
      </div>
    </Drawer>
  );
}

export default TrainDataSection;
