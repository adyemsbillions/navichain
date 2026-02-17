// app/(app)/dashboard.tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// ✅ API base
const API_BASE = "https://navichain.cravii.ng/api";

// Simple theme type
type Theme = "light" | "dark";

const lightTheme = {
  background: "#ffffff",
  card: "#f8fafc",
  text: "#0f172a",
  textSecondary: "#64748b",
  accent: "#3b82f6",
  border: "#e2e8f0",
  danger: "#ef4444",
  success: "#10b981",
};

const darkTheme = {
  background: "#0a0a0a",
  card: "#18181b",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  accent: "#3b82f6",
  border: "#27272a",
  danger: "#ef4444",
  success: "#10b981",
};

type DashboardStats = {
  active: number;
  on_time_percent: number;
  items: number;
  updated_at: string | null;
  core_modules: number;
  sub_modules: number;
};

// ✅ Fake Banner Ads (wide + short)
type BannerAd = {
  id: string;
  title: string;
  subtitle?: string;
  cta: string;
  link: string;
  tag?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export default function Dashboard() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(
    (systemColorScheme === "light" ? "light" : "dark") as Theme,
  );
  const [userName, setUserName] = useState("User");

  // responsive sizing
  const { width } = Dimensions.get("window");
  const colors = theme === "dark" ? darkTheme : lightTheme;

  // ✅ stats state
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    active: 0,
    on_time_percent: 0,
    items: 0,
    updated_at: null,
    core_modules: 0,
    sub_modules: 0,
  });

  // ✅ banner ads
  const bannerAds: BannerAd[] = [
    {
      id: "b1",
      tag: "Sponsored Ads",
      title: "Ship Faster with NaviChain",
      subtitle: "Track deliveries and performance in one place.",
      cta: "Open",
      link: "https://navichain.cravii.ng",
      icon: "local-shipping",
    },
    {
      id: "b2",
      tag: "Sponsored Ads",
      title: "Vendor Verification",
      subtitle: "Reduce supply risk with proper vendor checks.",
      cta: "Learn",
      link: "https://example.com",
      icon: "verified",
    },
    {
      id: "b3",
      tag: "Sponsored Ads",
      title: "Green Supply Chain Tips",
      subtitle: "Cut cost & emissions with better routing.",
      cta: "See",
      link: "https://example.com",
      icon: "eco",
    },
  ];

  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setBannerIndex((p) => (p + 1) % bannerAds.length);
    }, 6500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentBanner = bannerAds[bannerIndex];

  const openAd = async (link: string) => {
    try {
      const ok = await Linking.canOpenURL(link);
      if (ok) await Linking.openURL(link);
    } catch {}
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setUserName(user.full_name || "User");
        }
      } catch (error) {
        console.error("Failed to load user name", error);
      }
    };
    loadUser();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsError("");
      setStatsLoading(true);

      const res = await fetch(`${API_BASE}/get_dashboard_stats.php`);
      const raw = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Non-JSON response (${res.status}): ${raw.slice(0, 120)}`,
        );
      }

      if (!res.ok || data?.status !== "success") {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      setStats({
        active: Number(data.stats.active || 0),
        on_time_percent: Number(data.stats.on_time_percent || 0),
        items: Number(data.stats.items || 0),
        updated_at: data.stats.updated_at ?? null,
        core_modules: Number(data.stats.core_modules || 0),
        sub_modules: Number(data.stats.sub_modules || 0),
      });
    } catch (e: any) {
      setStatsError(e?.message || "Failed to load stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/");
  };

  // ✅ Core modules (Green is id: 7)
  const coreModules = [
    { id: 1, title: "Knowledge", icon: "book", color: "#3b82f6" },
    { id: 2, title: "Vendors", icon: "shopping-cart", color: "#8b5cf6" },
    { id: 3, title: "Warehouse", icon: "warehouse", color: "#10b981" },
    { id: 4, title: "Transport", icon: "local-shipping", color: "#f59e0b" },
    { id: 5, title: "Planning", icon: "timeline", color: "#06b6d4" },
    { id: 6, title: "Quality", icon: "verified", color: "#ec4899" },
    { id: 7, title: "Green", icon: "eco", color: "#22c55e" },
  ];

  // Make grid responsive (2 columns on phone, 3 on wide screens)
  const numColumns = useMemo(() => {
    if (width >= 1024) return 3;
    return 2;
  }, [width]);

  const gridGap = 12;
  const gridPadding = 24;

  const cardWidth = useMemo(() => {
    const usable = width - gridPadding * 2 - gridGap * (numColumns - 1);
    return Math.floor(usable / numColumns);
  }, [width, numColumns]);

  const navItems = [
    { name: "Home", icon: "home", route: "/dashboard", active: true },
    { name: "Knowledge", icon: "school", route: "/knowledge" },
    { name: "Modules", icon: "view-module", route: "/update_modules" },
    { name: "Submodules", icon: "grid-view", route: "/submodules?coreId=1" },
  ];

  const formatItems = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.brandTitle, { color: colors.textSecondary }]}>
              NAVICHAIN
            </Text>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
              <MaterialIcons
                name={theme === "dark" ? "light-mode" : "dark-mode"}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
              <MaterialIcons name="logout" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {statsLoading ? (
            <View
              style={[
                styles.statsLoadingBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ActivityIndicator color={colors.accent} />
              <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>
                Loading stats...
              </Text>
            </View>
          ) : statsError ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={fetchStats}
              style={[
                styles.statsLoadingBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MaterialIcons
                name="error-outline"
                size={18}
                color={colors.danger}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                {statsError}
              </Text>
              <Text style={{ color: colors.accent, fontWeight: "900" }}>
                Retry
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <MaterialIcons
                  name="local-shipping"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.active}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Active
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <MaterialIcons
                  name="trending-up"
                  size={20}
                  color={colors.success}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.on_time_percent}%
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  On-Time
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <MaterialIcons name="inventory" size={20} color="#f59e0b" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatItems(stats.items)}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Items
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ✅ Fake Banner Ad (wide + short) - BEFORE CORE MODULES */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openAd(currentBanner.link)}
          style={[
            styles.bannerAd,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.bannerLeft}>
            <View
              style={[
                styles.bannerIconWrap,
                {
                  backgroundColor: `${colors.accent}18`,
                  borderColor: `${colors.accent}25`,
                },
              ]}
            >
              <MaterialIcons
                name={(currentBanner.icon || "campaign") as any}
                size={18}
                color={colors.accent}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.bannerTitleRow}>
                <Text
                  style={[styles.bannerTag, { color: colors.textSecondary }]}
                >
                  {currentBanner.tag || "Ad"}
                </Text>
              </View>

              <Text
                style={[styles.bannerTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {currentBanner.title}
              </Text>

              {!!currentBanner.subtitle && (
                <Text
                  style={[
                    styles.bannerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {currentBanner.subtitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.bannerRight}>
            <Text style={[styles.bannerCta, { color: colors.accent }]}>
              {currentBanner.cta}
            </Text>
            <MaterialIcons
              name="arrow-forward-ios"
              size={14}
              color={colors.accent}
            />
          </View>
        </TouchableOpacity>

        {/* Modules */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Core Modules
        </Text>

        <View
          style={[
            styles.grid,
            { paddingHorizontal: gridPadding, gap: gridGap },
          ]}
        >
          {coreModules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.card,
                {
                  width: cardWidth,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(`/submodules?coreId=${module.id}`)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${module.color}15` },
                ]}
              >
                <MaterialIcons
                  name={module.icon as any}
                  size={28}
                  color={module.color}
                />
              </View>

              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {module.title}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.viewText, { color: module.color }]}>
                  View
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={16}
                  color={module.color}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Bottom Navigation - Icon Only */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => {
              if (item.route !== "/dashboard") router.push(item.route);
            }}
          >
            <MaterialIcons
              name={item.icon as any}
              size={26}
              color={item.active ? colors.accent : colors.textSecondary}
            />
            {item.active && (
              <View
                style={[styles.activeDot, { backgroundColor: colors.accent }]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
  },

  brandTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  greeting: { fontSize: 16, fontWeight: "500" },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 2,
  },

  headerActions: { flexDirection: "row", gap: 12 },
  iconButton: { padding: 8 },

  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 18,
  },

  statsLoadingBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexDirection: "row",
  },

  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: "600" },

  // ✅ Banner Ad styles (wide + short)
  bannerAd: {
    marginHorizontal: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  bannerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 12,
  },
  bannerCta: {
    fontSize: 12.5,
    fontWeight: "900",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 10,
  },

  card: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 18,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  viewText: { fontSize: 12, fontWeight: "700" },

  bottomNav: {
    flexDirection: "row",
    height: 72,
    borderTopWidth: 1,
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    position: "relative",
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    bottom: 8,
  },
});
