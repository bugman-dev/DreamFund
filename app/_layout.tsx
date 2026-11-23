import 'react-native-gesture-handler';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, useFonts } from '@expo-google-fonts/dm-sans';
import { Lora_400Regular_Italic } from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../src/auth/session';
import { ActionsProvider } from '../src/components/ActionSheet';
import { LoadingScreen, NoticeBanner } from '../src/components/ui';
import { DataProvider, useData } from '../src/data/store';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Lora_400Regular_Italic,
  });
  if (!loaded && !error) return <LoadingScreen />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.grey }}>
      <SafeAreaProvider>
        <View style={frame}>
          <SessionProvider>
            <DataProvider>
              <ActionsProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }} />
                <NoticeHost />
              </ActionsProvider>
            </DataProvider>
          </SessionProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const frame = Platform.OS === 'web'
  ? { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center' as const, backgroundColor: colors.ivory }
  : { flex: 1, backgroundColor: colors.ivory };

function NoticeHost() {
  const { notice } = useData();
  return <NoticeBanner message={notice} />;
}
