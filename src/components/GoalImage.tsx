import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from './icons';

export const GENERIC_IMAGE = 'preset:generic';

export function GoalImage({
  uri,
  style,
  iconSize = 28,
}: {
  uri: string | null;
  style?: StyleProp<ViewStyle | ImageStyle>;
  iconSize?: number;
}) {
  if (uri && !uri.startsWith('preset:')) {
    return <Image source={{ uri }} style={style as StyleProp<ImageStyle>} />;
  }
  return (
    <View style={[style, { backgroundColor: '#1E4A3C', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      <AppIcon name="Camera" size={iconSize} color="#E7F0EA" strokeWidth={1.8} />
    </View>
  );
}
