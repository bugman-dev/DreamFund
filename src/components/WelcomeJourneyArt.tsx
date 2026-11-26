import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../theme/Theme";

/** Soft rolling hills pinned to the bottom of the welcome screen. */
export function WelcomeHills({
  width,
  height = 168,
}: {
  width: number;
  height?: number;
}) {
  const colors = useColors();
  return (
    <View pointerEvents="none" style={[styles.hills, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={`M0 ${height * 0.42} C ${width * 0.22} ${height * 0.18}, ${width * 0.4} ${height * 0.52}, ${width * 0.58} ${height * 0.32}
              C ${width * 0.74} ${height * 0.14}, ${width * 0.88} ${height * 0.38}, ${width} ${height * 0.26}
              L ${width} ${height} L 0 ${height} Z`}
          fill={colors.paleSage}
          opacity={0.75}
        />
        <Path
          d={`M0 ${height * 0.6} C ${width * 0.2} ${height * 0.4}, ${width * 0.38} ${height * 0.7}, ${width * 0.55} ${height * 0.5}
              C ${width * 0.72} ${height * 0.3}, ${width * 0.86} ${height * 0.56}, ${width} ${height * 0.46}
              L ${width} ${height} L 0 ${height} Z`}
          fill={colors.white}
          opacity={0.65}
        />
        <Path
          d={`M0 ${height * 0.76} C ${width * 0.24} ${height * 0.6}, ${width * 0.46} ${height * 0.86}, ${width * 0.66} ${height * 0.68}
              C ${width * 0.82} ${height * 0.54}, ${width * 0.92} ${height * 0.76}, ${width} ${height * 0.66}
              L ${width} ${height} L 0 ${height} Z`}
          fill={colors.paleSage}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hills: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
});
