import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';
import TinyImageTrainDemo from '~/components/ml/TinyImageTrainDemo';
import { TinyModelTrainDemo } from '~/components/ml/TinyModelTrainDemo';

export const Route = createFileRoute('/ml-lab')({
  component: MlLabPage,
});

function MlLabPage() {
  return (
    <div className="flex flex-col gap-4 max-w-screen-sm mx-auto">
      {/* <TinyModelTrainDemo /> */}
      <TinyImageTrainDemo />
    </div>
  );
}
