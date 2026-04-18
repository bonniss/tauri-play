import { Drawer, SegmentedControl } from '@mantine/core';
import { useAppProvider } from '~/components/layout/AppProvider';
import SampleGrid from '~/components/project/SampleGrid';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';

function TrainDataSection() {
  const { t } = useAppProvider();
  const {
    displayedSplitSamples,
    inspectDataOpened,
    setInspectDataOpened,
    setTrainDataView,
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
        trainDataView === 'train'
          ? t('project.train.dataset.trainImages')
          : t('project.train.dataset.validationImages')
      }
    >
      <div className="container space-y-4">
        <SegmentedControl
          data={trainDataViewOptions}
          onChange={(value) => {
            setTrainDataView(value as 'train' | 'validation');
          }}
          value={trainDataView}
        />
        <SampleGrid samples={displayedSplitSamples} />
      </div>
    </Drawer>
  );
}

export default TrainDataSection;
