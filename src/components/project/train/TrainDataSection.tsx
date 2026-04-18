import { Drawer, SegmentedControl } from '@mantine/core';
import SampleGrid from '~/components/project/SampleGrid';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';

function TrainDataSection() {
  const {
    displayedSplitSamples,
    inspectDataOpened,
    setInspectDataOpened,
    setTrainDataView,
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
          classIndexMap={splitClassIndexMap}
          samples={displayedSplitSamples}
        />
      </div>
    </Drawer>
  );
}

export default TrainDataSection;
