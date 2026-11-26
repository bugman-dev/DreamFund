import {
  Image,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  GENERIC_IMAGE,
  GOAL_PLACEHOLDER_BACKGROUND,
  GOAL_PLACEHOLDER_ICON,
  PRESET_IMAGE_PREFIX,
} from "../constants";
import { AppIcon } from "./icons";

export { GENERIC_IMAGE };

export function GoalImage({
  uri,
  style,
  iconSize = 28,
}: {
  uri: string | null;
  style?: StyleProp<ViewStyle | ImageStyle>;
  iconSize?: number;
}) {
  if (uri && !uri.startsWith(PRESET_IMAGE_PREFIX)) {
    return <Image source={{ uri }} style={style as StyleProp<ImageStyle>} />;
  }
  return (
    <View
      style={[
        style,
        {
          backgroundColor: GOAL_PLACEHOLDER_BACKGROUND,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      ]}
    >
      <AppIcon
        name="Camera"
        size={iconSize}
        color={GOAL_PLACEHOLDER_ICON}
        strokeWidth={1.8}
      />
    </View>
  );
}
