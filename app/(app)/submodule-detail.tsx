// app/(app)/submodule-detail.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const API_BASE = "https://navichain.cravii.ng/api";

type Detail = {
  title: string;
  description: string;
  image_url: string;
  pdf_url: string;
};

export default function SubModuleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Responsive sizing
  const { width } = Dimensions.get("window");
  const heroHeight = useMemo(() => {
    // keep it nice on phones + tablets
    if (width >= 900) return 420;
    if (width >= 600) return 360;
    return 260;
  }, [width]);

  const fetchDetail = async () => {
    try {
      setError("");
      setLoading(true);

      const res = await fetch(`${API_BASE}/get_submodule_detail.php?id=${id}`);
      const data = await res.json();

      if (!data || typeof data !== "object") {
        setError("No details found for this submodule.");
        setDetail(null);
        return;
      }

      setDetail({
        title: data.title ?? "",
        description: data.description ?? "",
        image_url: data.image_url ?? "",
        pdf_url: data.pdf_url ?? "",
      });
    } catch (e) {
      setError("Failed to load submodule details. Please try again.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openPdfExternal = async () => {
    if (!detail?.pdf_url) return;

    try {
      const can = await Linking.canOpenURL(detail.pdf_url);
      if (can) await Linking.openURL(detail.pdf_url);
    } catch (e) {
      // ignore
    }
  };

  const googleViewerUrl = useMemo(() => {
    if (!detail?.pdf_url) return "";
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
      detail.pdf_url,
    )}`;
  }, [detail?.pdf_url]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-back" size={22} color="#e2e8f0" />
            </TouchableOpacity>

            <Text style={styles.topTitle} numberOfLines={1}>
              Submodule
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={22} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity onPress={fetchDetail} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>No details found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={22} color="#e2e8f0" />
          </TouchableOpacity>

          <Text style={styles.topTitle} numberOfLines={1}>
            {detail.title || "Submodule Detail"}
          </Text>

          {/* Optional external open for PDF */}
          <TouchableOpacity
            onPress={openPdfExternal}
            style={[styles.iconBtn, { opacity: detail.pdf_url ? 1 : 0.35 }]}
            activeOpacity={0.8}
            disabled={!detail.pdf_url}
          >
            <MaterialIcons name="open-in-new" size={22} color="#93c5fd" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image */}
          {detail.image_url ? (
            <Image
              source={{ uri: detail.image_url }}
              style={[styles.heroImage, { height: heroHeight }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroPlaceholder, { height: heroHeight }]}>
              <MaterialIcons name="image" size={52} color="#64748b" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Title + meta */}
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{detail.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.pill}>
                <MaterialIcons name="layers" size={16} color="#93c5fd" />
                <Text style={styles.pillText}>Submodule</Text>
              </View>

              {detail.pdf_url ? (
                <View style={[styles.pill, styles.pillPdf]}>
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={16}
                    color="#60a5fa"
                  />
                  <Text style={styles.pillText}>PDF attached</Text>
                </View>
              ) : (
                <View style={[styles.pill, styles.pillMuted]}>
                  <MaterialIcons
                    name="info-outline"
                    size={16}
                    color="#94a3b8"
                  />
                  <Text style={[styles.pillText, { color: "#94a3b8" }]}>
                    No PDF
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.description}>
              {detail.description?.trim()
                ? detail.description
                : "No description available."}
            </Text>
          </View>

          {/* PDF */}
          {detail.pdf_url ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Reference Document</Text>

                <TouchableOpacity
                  onPress={openPdfExternal}
                  style={styles.smallBtn}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="download" size={18} color="#93c5fd" />
                  <Text style={styles.smallBtnText}>Open</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pdfWrap}>
                <WebView
                  source={{ uri: googleViewerUrl }}
                  style={styles.pdf}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.pdfLoading}>
                      <ActivityIndicator size="small" color="#60a5fa" />
                      <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                    </View>
                  )}
                  // Helps avoid white flash in dark UI
                  originWhitelist={["*"]}
                  setSupportMultipleWindows={false}
                  allowsInlineMediaPlayback
                />
              </View>

              <Text style={styles.pdfHint}>
                If the preview is blank, tap{" "}
                <Text style={{ color: "#93c5fd", fontWeight: "900" }}>
                  Open
                </Text>{" "}
                to view it in your browser.
              </Text>
            </View>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  topTitle: {
    flex: 1,
    marginHorizontal: 10,
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 28,
  },

  // Hero
  heroImage: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#111827",
  },
  heroPlaceholder: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "700",
  },

  // Title
  titleWrap: {
    marginTop: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  pillPdf: {
    backgroundColor: "#0b1220",
    borderColor: "#1e293b",
  },
  pillMuted: {
    backgroundColor: "#0b0f16",
    borderColor: "#111827",
  },
  pillText: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "900",
  },

  // Sections
  section: {
    marginTop: 18,
    padding: 16,
    backgroundColor: "#18181b",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  sectionTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14.5,
    color: "#cbd5e1",
    lineHeight: 22,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  smallBtnText: {
    color: "#93c5fd",
    fontWeight: "900",
    fontSize: 12,
  },

  // PDF
  pdfWrap: {
    height: 620,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  pdf: {
    flex: 1,
  },
  pdfLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    gap: 10,
  },
  pdfLoadingText: {
    color: "#93c5fd",
    fontWeight: "800",
  },
  pdfHint: {
    marginTop: 10,
    color: "#94a3b8",
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Loading center
  center: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#93c5fd",
    fontSize: 16,
    fontWeight: "800",
  },

  // Error
  errorBox: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#1b0b0b",
    borderWidth: 1,
    borderColor: "#3f1b1b",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: "#fecaca",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  retryText: {
    color: "#93c5fd",
    fontWeight: "900",
    fontSize: 12,
  },
});
