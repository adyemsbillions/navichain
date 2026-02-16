// app/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/login');  // Always go to login — no check, no error
  };

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient colors={["#0f172a", "#1e293b", "#0f172a"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.content}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SUPPLY CHAIN EXCELLENCE</Text>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.appName}>NaviChain</Text>
              <View style={styles.titleUnderline} />
            </View>

            <Text style={styles.welcomeText}>
              Welcome to the premier hub for global supply chain best practices. Access expert guidance, trusted vendor
              connections, and tools to optimize every stage of your supply chain.
            </Text>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Real-time Tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Vendor Network</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Compliance Tools</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.buttonWrapper} onPress={handleGetStarted}>
              <LinearGradient
                colors={["#3b82f6", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <View style={styles.divider} />
              <Text style={styles.footerText}>Empowering efficient, transparent, and compliant supply chains</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 32, paddingVertical: 60, justifyContent: "center" },
  content: { alignItems: "center" },
  badge: { backgroundColor: "rgba(59, 130, 246, 0.15)", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.3)", marginBottom: 32 },
  badgeText: { color: "#60a5fa", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  titleContainer: { alignItems: "center", marginBottom: 24 },
  appName: { fontSize: 56, fontWeight: "900", color: "#ffffff", marginBottom: 12, letterSpacing: 1, textShadowColor: "rgba(59, 130, 246, 0.5)", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 16 },
  titleUnderline: { width: 120, height: 4, backgroundColor: "#3b82f6", borderRadius: 2 },
  welcomeText: { fontSize: 17, color: "#cbd5e1", textAlign: "center", lineHeight: 28, marginBottom: 40, paddingHorizontal: 8, maxWidth: 500 },
  features: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 24, marginBottom: 48 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3b82f6" },
  featureText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  buttonWrapper: { marginBottom: 48, borderRadius: 16, shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 20, paddingHorizontal: 48, borderRadius: 16 },
  buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  buttonArrow: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
  footer: { alignItems: "center", gap: 16 },
  divider: { width: 60, height: 1, backgroundColor: "rgba(100, 116, 139, 0.3)" },
  footerText: { color: "#64748b", fontSize: 13, textAlign: "center", maxWidth: 320, lineHeight: 20 },
})