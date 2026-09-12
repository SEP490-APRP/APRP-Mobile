import { Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE } from "../../constants";

/**
 * AppText — base text component with preset variants
 * @param {"body"|"title"|"caption"|"label"} variant
 */
export default function AppText({ children, variant = "body", style, ...props }) {
  return (
    <Text style={[styles[variant], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  body: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
  caption: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
