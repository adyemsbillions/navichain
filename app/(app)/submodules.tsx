// app/(app)/submodules.tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const API_BASE = "https://navichain.cravii.ng/api";

type SubModule = {
  id: number;
  title: string;
  description: string;
  image_url: string;
};

type Detail = {
  title: string;
  description: string;
  image_url: string;
  pdf_url: string;
};

export default function SubModules() {
  const { coreId } = useLocalSearchParams<{ coreId: string }>();

  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");

  // Paid access
  const [user, setUser] = useState<any>(null);
  const [paid, setPaid] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  // Paystack
  const [payOpen, setPayOpen] = useState(false);
  const [payUrl, setPayUrl] = useState("");
  const [payReference, setPayReference] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const PRICE_NGN = 1000;

  // Modal state (detail)
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // responsive card sizing
  const { width, height } = Dimensions.get("window");

  const numColumns = useMemo(() => {
    if (width >= 1100) return 3;
    if (width >= 720) return 2;
    return 1;
  }, [width]);

  const cardGap = 14;
  const horizontalPadding = 18;

  const cardWidth = useMemo(() => {
    const usable = width - horizontalPadding * 2 - cardGap * (numColumns - 1);
    return Math.floor(usable / numColumns);
  }, [width, numColumns]);

  const FREE_COUNT = 3;

  const loadUserAndAccess = async () => {
    setAccessLoading(true);
    try {
      const savedUser = await AsyncStorage.getItem("user");
      if (!savedUser) {
        setUser(null);
        setPaid(false);
        return;
      }
      const u = JSON.parse(savedUser);
      setUser(u);

      const res = await fetch(`${API_BASE}/check_access.php?user_id=${u.id}`);
      const data = await res.json();
      setPaid(!!data?.paid);
    } catch {
      setPaid(false);
    } finally {
      setAccessLoading(false);
    }
  };

  const fetchSubModules = async () => {
    try {
      setError("");
      const res = await fetch(
        `${API_BASE}/get_submodules.php?core_id=${coreId}`,
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSubModules(list);
    } catch {
      setError(
        "Could not load sub-modules. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDetail = async (id: number) => {
    try {
      setDetailError("");
      setDetailLoading(true);
      setDetail(null);

      const url = `${API_BASE}/get_submodule_detail.php?id=${id}`;
      const res = await fetch(url);

      const raw = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Non-JSON response (${res.status}): ${raw.slice(0, 120)}`,
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setDetail({
        title: data.title ?? "",
        description: data.description ?? "",
        image_url: data.image_url ?? "",
        pdf_url: data.pdf_url ?? "",
      });
    } catch (e: any) {
      setDetailError(e?.message || "Failed to load details. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSubModules();
    loadUserAndAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coreId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubModules();
    loadUserAndAccess();
  };

  const openDetail = (item: SubModule, index: number) => {
    const locked = !paid && index >= FREE_COUNT;
    if (locked) {
      openPaywall();
      return;
    }
    setSelectedId(item.id);
    setDetailOpen(true);
    fetchDetail(item.id);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
    setDetail(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const googleViewerUrl = useMemo(() => {
    if (!detail?.pdf_url) return "";
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
      detail.pdf_url,
    )}`;
  }, [detail?.pdf_url]);

  const openPaywall = async () => {
    if (!user?.id || !user?.email) {
      setError("Please login again to continue.");
      return;
    }
    try {
      setPayBusy(true);
      const res = await fetch(`${API_BASE}/init_payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();

      if (data?.status !== "success" || !data?.authorization_url) {
        throw new Error(data?.message || "Could not start payment");
      }

      setPayUrl(data.authorization_url);
      setPayReference(data.reference);
      setPayOpen(true);
    } catch (e: any) {
      setError(e?.message || "Payment init failed");
    } finally {
      setPayBusy(false);
    }
  };

  const closePay = () => {
    setPayOpen(false);
    setPayUrl("");
    setPayReference("");
  };

  const verifyPayment = async (reference: string) => {
    try {
      setPayBusy(true);
      const res = await fetch(`${API_BASE}/verify_payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();

      if (data?.status === "success") {
        setPaid(true);
        closePay();
      }
    } finally {
      setPayBusy(false);
    }
  };

  const renderItem = ({ item, index }: { item: SubModule; index: number }) => {
    const hasImage = !!item.image_url;
    const locked = !paid && index >= FREE_COUNT;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { width: cardWidth, marginBottom: cardGap }]}
        onPress={() => openDetail(item, index)}
      >
        {hasImage ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="image" size={42} color="#64748b" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.description} numberOfLines={3}>
            {item.description?.trim()
              ? item.description
              : "No description available."}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <MaterialIcons name="layers" size={16} color="#93c5fd" />
              <Text style={styles.badgeText}>Submodule</Text>
            </View>

            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>{locked ? "Locked" : "Open"}</Text>
              <MaterialIcons
                name={locked ? "lock" : "arrow-forward"}
                size={18}
                color={locked ? "#fbbf24" : "#60a5fa"}
              />
            </View>
          </View>
        </View>

        {/* LOCK OVERLAY */}
        {locked ? (
          <View style={styles.lockOverlay}>
            <BlurView
              intensity={35}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.lockInner}>
              <MaterialIcons name="lock" size={22} color="#fbbf24" />
              <Text style={styles.lockTitle}>Unlock full access</Text>
              <Text style={styles.lockSub}>
                Pay ₦{PRICE_NGN.toLocaleString()} to view all submodules.
              </Text>

              <TouchableOpacity
                onPress={openPaywall}
                style={styles.payBtn}
                activeOpacity={0.85}
                disabled={payBusy}
              >
                {payBusy ? (
                  <ActivityIndicator size="small" color="#0a0a0a" />
                ) : (
                  <Text style={styles.payBtnText}>
                    Pay ₦{PRICE_NGN.toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View style={styles.headerWrap}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <MaterialIcons name="grid-view" size={22} color="#60a5fa" />
          <Text style={styles.pageTitle}>Sub Modules</Text>
        </View>

        <View style={styles.countPill}>
          <Text style={styles.countText}>{subModules.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitle} numberOfLines={2}>
        {!accessLoading && !paid
          ? `You can view ${FREE_COUNT} free submodules. Unlock the rest with ₦${PRICE_NGN.toLocaleString()}.`
          : "Browse available submodules. More will appear here as they are added."}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={18} color="#fca5a5" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={fetchSubModules}
            style={styles.retryBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Loading sub-modules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={subModules}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="inbox" size={64} color="#64748b" />
              <Text style={styles.emptyText}>No sub-modules available yet</Text>
              <Text style={styles.emptyHint}>
                Pull down to refresh or check again later.
              </Text>
            </View>
          }
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={
            numColumns > 1
              ? { gap: cardGap, justifyContent: "space-between" }
              : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#60a5fa"
              colors={["#60a5fa"]}
              progressBackgroundColor={
                Platform.OS === "android" ? "#0a0a0a" : undefined
              }
            />
          }
        />

        {/* PAYSTACK MODAL */}
        <Modal
          visible={payOpen}
          animationType="slide"
          transparent
          onRequestClose={closePay}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalSheet,
                { height: Math.min(height * 0.92, 860) },
              ]}
            >
              <View style={styles.modalTopBar}>
                <TouchableOpacity
                  onPress={closePay}
                  style={styles.iconBtn}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="close" size={22} color="#e2e8f0" />
                </TouchableOpacity>

                <Text style={styles.modalTitle} numberOfLines={1}>
                  Pay ₦{PRICE_NGN.toLocaleString()}
                </Text>

                <View style={{ width: 40 }} />
              </View>

              <View style={{ flex: 1 }}>
                {!payUrl ? (
                  <View style={styles.detailLoadingWrap}>
                    <ActivityIndicator size="large" color="#60a5fa" />
                    <Text style={styles.detailLoadingText}>
                      Preparing checkout...
                    </Text>
                  </View>
                ) : (
                  <WebView
                    source={{ uri: payUrl }}
                    startInLoadingState
                    renderLoading={() => (
                      <View style={styles.pdfLoading}>
                        <ActivityIndicator size="small" color="#60a5fa" />
                        <Text style={styles.pdfLoadingText}>
                          Opening Paystack...
                        </Text>
                      </View>
                    )}
                    onNavigationStateChange={(nav) => {
                      // If Paystack redirects to your callback page, verify automatically
                      const url = nav.url || "";
                      if (url.includes("pay_success.php") && payReference) {
                        verifyPayment(payReference);
                      }
                    }}
                  />
                )}

                {payBusy ? (
                  <View style={styles.verifyBar}>
                    <ActivityIndicator size="small" color="#60a5fa" />
                    <Text style={styles.verifyText}>Verifying payment...</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>

        {/* DETAILS MODAL */}
        <Modal
          visible={detailOpen}
          animationType="slide"
          transparent
          onRequestClose={closeDetail}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalSheet,
                { height: Math.min(height * 0.92, 860) },
              ]}
            >
              <View style={styles.modalTopBar}>
                <TouchableOpacity
                  onPress={closeDetail}
                  style={styles.iconBtn}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="close" size={22} color="#e2e8f0" />
                </TouchableOpacity>

                <Text style={styles.modalTitle} numberOfLines={1}>
                  {detail?.title || "Submodule Detail"}
                </Text>

                <View style={{ width: 40 }} />
              </View>

              <View style={{ flex: 1 }}>
                {detailLoading ? (
                  <View style={styles.detailLoadingWrap}>
                    <ActivityIndicator size="large" color="#60a5fa" />
                    <Text style={styles.detailLoadingText}>
                      Loading details...
                    </Text>
                  </View>
                ) : detailError ? (
                  <View style={styles.detailErrorBox}>
                    <MaterialIcons
                      name="error-outline"
                      size={20}
                      color="#fca5a5"
                    />
                    <Text style={styles.detailErrorText}>{detailError}</Text>

                    {!!selectedId && (
                      <TouchableOpacity
                        onPress={() => fetchDetail(selectedId)}
                        style={styles.retryBtn}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.retryText}>Retry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {detail?.image_url ? (
                      <Image
                        source={{ uri: detail.image_url }}
                        style={styles.detailHero}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.detailHeroPlaceholder}>
                        <MaterialIcons name="image" size={52} color="#64748b" />
                        <Text style={styles.placeholderText}>No Image</Text>
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Overview</Text>
                      <Text style={styles.detailText}>
                        {detail?.description?.trim()
                          ? detail.description
                          : "No description available."}
                      </Text>
                    </View>

                    {detail?.pdf_url ? (
                      <View style={styles.detailSection}>
                        <View style={styles.pdfHeaderRow}>
                          <Text style={styles.detailSectionTitle}>
                            Reference Document
                          </Text>
                          <View style={styles.pdfPill}>
                            <MaterialIcons
                              name="picture-as-pdf"
                              size={16}
                              color="#60a5fa"
                            />
                            <Text style={styles.pdfPillText}>PDF</Text>
                          </View>
                        </View>

                        <View style={styles.pdfWrap}>
                          <WebView
                            source={{ uri: googleViewerUrl }}
                            style={styles.pdf}
                            startInLoadingState
                            renderLoading={() => (
                              <View style={styles.pdfLoading}>
                                <ActivityIndicator
                                  size="small"
                                  color="#60a5fa"
                                />
                                <Text style={styles.pdfLoadingText}>
                                  Loading PDF...
                                </Text>
                              </View>
                            )}
                            originWhitelist={["*"]}
                            setSupportMultipleWindows={false}
                            allowsInlineMediaPlayback
                          />
                        </View>

                        <Text style={styles.pdfHint}>
                          If the preview is blank, the PDF host may block
                          embedding.
                        </Text>
                      </View>
                    ) : null}

                    <View style={{ height: 20 }} />
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  container: { flex: 1, backgroundColor: "#0a0a0a", paddingTop: 8 },

  headerWrap: { paddingTop: 8, paddingBottom: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 14, color: "#94a3b8", lineHeight: 20 },
  countPill: {
    minWidth: 44,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#93c5fd", fontWeight: "800" },

  list: { paddingBottom: 40 },

  card: {
    backgroundColor: "#18181b",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },

  image: { width: "100%", height: 190, backgroundColor: "#111827" },
  imagePlaceholder: {
    width: "100%",
    height: 190,
    backgroundColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },

  content: { padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  description: { fontSize: 14, color: "#cbd5e1", lineHeight: 20 },

  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  badge: {
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
  badgeText: { color: "#bfdbfe", fontSize: 12, fontWeight: "800" },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ctaText: { color: "#60a5fa", fontSize: 13, fontWeight: "800" },

  // LOCK overlay
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  lockInner: {
    width: "100%",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(10,10,10,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  lockTitle: { marginTop: 6, color: "#fff", fontWeight: "900", fontSize: 14 },
  lockSub: {
    marginTop: 6,
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },
  payBtn: {
    marginTop: 12,
    backgroundColor: "#fbbf24",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 180,
    alignItems: "center",
  },
  payBtnText: { color: "#0a0a0a", fontWeight: "900" },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#60a5fa",
    fontSize: 16,
    marginTop: 14,
    fontWeight: "700",
  },

  // Empty
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    fontWeight: "800",
  },
  emptyHint: {
    color: "#475569",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },

  // Error box
  errorBox: {
    marginTop: 14,
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
  retryText: { color: "#93c5fd", fontWeight: "900", fontSize: 12 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#111827",
    overflow: "hidden",
  },
  modalTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  modalTitle: {
    flex: 1,
    marginHorizontal: 10,
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
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

  modalScroll: { flex: 1 },
  modalScrollContent: { flexGrow: 1, padding: 16, paddingBottom: 22 },

  // Detail loading/error
  detailLoadingWrap: {
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  detailLoadingText: { color: "#93c5fd", fontWeight: "800" },
  detailErrorBox: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#1b0b0b",
    borderWidth: 1,
    borderColor: "#3f1b1b",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailErrorText: {
    flex: 1,
    color: "#fecaca",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  // Detail UI
  detailHero: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    backgroundColor: "#111827",
  },
  detailHeroPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  detailSection: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#18181b",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  detailSectionTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },
  detailText: { fontSize: 14.5, color: "#cbd5e1", lineHeight: 22 },

  // PDF
  pdfHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  pdfPill: {
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
  pdfPillText: { color: "#bfdbfe", fontSize: 12, fontWeight: "900" },
  pdfWrap: {
    height: 560,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  pdf: { flex: 1 },
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
  pdfLoadingText: { color: "#93c5fd", fontWeight: "800" },
  pdfHint: { marginTop: 10, color: "#94a3b8", fontSize: 12.5, lineHeight: 18 },

  verifyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(10,10,10,0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  verifyText: { color: "#93c5fd", fontWeight: "800" },
});
