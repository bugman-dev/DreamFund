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
import { WEB_MAX_WIDTH } from '../src/constants';
import { CurrencyProvider, useCurrency } from '../src/currency/Currency';
import { LocaleProvider } from '../src/locale';
import { ThemeProvider, useTheme } from '../src/theme/Theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Lora_400Regular_Italic,
  });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <LocaleProvider>
              <ThemedShell fontsReady={loaded || Boolean(error)} />
            </LocaleProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedShell({ fontsReady }: { fontsReady: boolean }) {
  const { colors, ready } = useTheme();
  const { ready: currencyReady } = useCurrency();
  if (!fontsReady || !ready || !currencyReady) return <LoadingScreen />;
  const frame = Platform.OS === 'web'
    ? { flex: 1, width: '100%' as const, maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' as const, backgroundColor: colors.ivory }
    : { flex: 1, backgroundColor: colors.ivory };
  return (
    <View style={{ flex: 1, backgroundColor: colors.grey }}>
      <View style={frame}>
        <SessionProvider>
          <DataProvider>
            <ActionsProvider>
              <StatusBar style={colors.statusBar} />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }} />
              <NoticeHost />
            </ActionsProvider>
          </DataProvider>
        </SessionProvider>
      </View>
    </View>
  );
}

function NoticeHost() {
  const { notice } = useData();
  return <NoticeBanner message={notice} />;
}
