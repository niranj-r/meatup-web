import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepTeal,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.creamLight,
    marginBottom: 24,
  },
  link: {
    backgroundColor: Colors.orange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  linkText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
