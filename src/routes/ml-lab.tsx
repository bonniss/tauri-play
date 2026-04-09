import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';
import { TinyModelTrainDemo } from '~/components/ml/TinyModelTrainDemo';

export const Route = createFileRoute('/ml-lab')({
  component: MlLabPage,
});

function MlLabPage() {
  const modelRef = useRef<any>(null);

  return (
    <div className="flex flex-col gap-4 max-w-64 mx-auto">
      {/* <Button onClick={
        async () => {
          modelRef.current = createTinyModel(inputShape, numClasses)

        }
      }>
        Train model
      </Button> */}
      <TinyModelTrainDemo />
    </div>
  );
}
