import { Redirect } from 'expo-router';
import { useSession } from '../src/auth/session';
import { LoadingScreen } from '../src/components/ui';

export default function Index() {
  const { user, ready } = useSession();
  if (!ready) return <LoadingScreen />;
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href="/(tabs)" />;
}
