// app/(app)/dashboard.tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

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

export default function Dashboard() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(
    (systemColorScheme === "light" ? "light" : "dark") as Theme,
  );
  const [userName, setUserName] = useState("User");

  // responsive sizing
  const { width } = Dimensions.get("window");

  const colors = theme === "dark" ? darkTheme : lightTheme;

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/");
  };

  // ✅ Added Green Supply Chain (id: 7)
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

  // Bottom navigation items
  const navItems = [
    { name: "Home", icon: "home", route: "/dashboard", active: true },
    { name: "Knowledge", icon: "school", route: "/knowledge" },
    { name: "Modules", icon: "view-module", route: "/update_modules" },
    // IMPORTANT: /submodules requires coreId, so we open "all submodules" chooser:
    // We'll route to dashboard grid instead. So this opens first module by default.
    // If you want a picker screen later, tell me.
    { name: "Submodules", icon: "grid-view", route: "/submodules?coreId=1" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Main Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            {/* NAVICHAIN above Welcome back */}
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
            <Text style={[styles.statValue, { color: colors.text }]}>42</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
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
            <Text style={[styles.statValue, { color: colors.text }]}>98%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
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
            <Text style={[styles.statValue, { color: colors.text }]}>1.2K</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Items
            </Text>
          </View>
        </View>

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
              if (item.route !== "/dashboard") {
                router.push(item.route);
              }
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
    marginBottom: 32,
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
