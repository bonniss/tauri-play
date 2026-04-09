import { Button, Center } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { initTf } from '~/lib/ml/backend';

export const Route = createFileRoute('/ml-lab')({
  component: MlLabPage,
});

function MlLabPage() {
  return (
    <Center>
      <Button
        onClick={async () => {
          const tf = await initTf();
          alert(JSON.stringify({ tf }, null, 2));
        }}
      >
        Init TF
      </Button>
    </Center>
  );
}
