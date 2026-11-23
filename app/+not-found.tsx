import { useRouter } from 'expo-router';
import { EmptyState, Screen } from '../src/components/ui';
import { useText } from '../src/locale';

export default function NotFoundScreen() {
  const text = useText();
  const router = useRouter();
  return (
    <Screen>
      <EmptyState title={text('notFound.title')} body={text('notFound.body')} action={text('notFound.home')} onAction={() => router.replace('/')} />
    </Screen>
  );
}
