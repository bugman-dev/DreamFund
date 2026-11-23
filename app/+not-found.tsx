import { useRouter } from 'expo-router';
import { EmptyState, Screen } from '../src/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState title="That screen is not here" body="Head back to your savings." action="Go home" onAction={() => router.replace('/')} />
    </Screen>
  );
}
