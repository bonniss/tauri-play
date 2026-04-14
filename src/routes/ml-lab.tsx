import { createFileRoute } from '@tanstack/react-router';
import TinyImageTrainDemo from '~/components/ml/TinyImageTrainDemo';

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
