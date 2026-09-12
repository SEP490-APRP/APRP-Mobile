import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from "../../constants";

/**
 * AppButton — base button component
 * @param {string} title
 * @param {function} onPress
 * @param {"primary"|"outline"} variant
 * @param {boolean} disabled
 */
export default function AppButton({ title, onPress, variant = "primary", disabled = false, style }) {
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isOutline ? styles.outline : styles.primary,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isOutline ? styles.textOutline : styles.textPrimary]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  textPrimary: {
    color: COLORS.white,
  },
  textOutline: {
    color: COLORS.primary,
  },
});
