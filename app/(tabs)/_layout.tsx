import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSession } from '../../src/auth/session';
import { DreamTabBar } from '../../src/components/TabBar';
import { EmptyState, LoadingScreen } from '../../src/components/ui';
import { useData } from '../../src/data/store';
import { useText } from '../../src/locale';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  const text = useText();
  const { user, ready } = useSession();
  const data = useData();
  if (ready && !user) return <Redirect href="/welcome" />;
  const waiting = !ready || !data.ready;
  return (
    <View style={styles.host}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <DreamTabBar state={props.state} navigateToTab={props.navigateToTab} />}>
        <Tabs.Screen name="index" options={{ title: text('tabs.home') }} />
        <Tabs.Screen name="goals" options={{ title: text('tabs.goals') }} />
        <Tabs.Screen name="transactions" options={{ title: text('tabs.transactions') }} />
        <Tabs.Screen name="profile" options={{ title: text('tabs.profile') }} />
      </Tabs>
      {waiting ? (
        <View style={styles.cover}>
          <LoadingScreen />
        </View>
      ) : null}
      {!waiting && data.error ? (
        <View style={styles.cover}>
          <EmptyState title={text('records.couldNotOpen')} body={data.error} action={text('records.tryAgain')} onAction={() => void data.refresh()} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  cover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.ivory },
});
