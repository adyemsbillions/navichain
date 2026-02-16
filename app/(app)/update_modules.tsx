// app/update_modules.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

const API_BASE = "https://navichain.cravii.ng/api";
const MODERATOR_CODE = "887GHSJSSDEY";

const coreModules = [
  {
    id: 1,
    name: "Knowledge & Standards",
    icon: "school" as const,
    color: "#3b82f6",
  },
  {
    id: 2,
    name: "Procurement & Vendors",
    icon: "shopping-cart" as const,
    color: "#8b5cf6",
  },
  {
    id: 3,
    name: "Warehousing & Inventory",
    icon: "warehouse" as const,
    color: "#10b981",
  },
  {
    id: 4,
    name: "Transportation & Distribution",
    icon: "local-shipping" as const,
    color: "#f59e0b",
  },
  {
    id: 5,
    name: "Forecasting & Planning",
    icon: "timeline" as const,
    color: "#06b6d4",
  },
  {
    id: 6,
    name: "Quality & Compliance",
    icon: "verified" as const,
    color: "#ec4899",
  },

  // ✅ NEW MODULE
  { id: 7, name: "Green Supply Chain", icon: "eco" as const, color: "#22c55e" },
];

export default function UpdateModules() {
  const [locked, setLocked] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const [selectedCore, setSelectedCore] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);

  // responsive grid sizing for module cards
  const moduleColumns = useMemo(() => {
    if (width >= 1100) return 3;
    if (width >= 720) return 2;
    return 2;
  }, []);

  const moduleGap = 12;

  const moduleCardWidth = useMemo(() => {
    const pad = width > 500 ? 40 : 24;
    const usable = width - pad * 2 - moduleGap * (moduleColumns - 1);
    return Math.floor(usable / moduleColumns);
  }, [moduleColumns]);

  const verifyCode = () => {
    if (codeInput.trim() === MODERATOR_CODE) {
      setLocked(false);
      setCodeError("");
    } else {
      setCodeError("Invalid moderator code");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.92,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: false,
      });

      if (result.assets && result.assets.length > 0) {
        setPdf(result.assets[0]);
      }
    } catch (err) {
      console.log("PDF picking error:", err);
    }
  };

  const submit = async () => {
    if (!selectedCore || !title.trim()) {
      Alert.alert("Required", "Please select a core module and enter a title");
      return;
    }

    const formData = new FormData();
    formData.append("core_module_id", selectedCore.toString());
    formData.append("title", title.trim());
    formData.append("description", description.trim() || "");

    if (image) {
      formData.append("image", {
        uri: image.uri,
        name: image.fileName || `photo-${Date.now()}.jpg`,
        type: image.mimeType || "image/jpeg",
      } as any);
    }

    if (pdf) {
      formData.append("pdf", {
        uri: pdf.uri,
        name: pdf.name || `document-${Date.now()}.pdf`,
        type: "application/pdf",
      } as any);
    }

    try {
      const res = await fetch(API_BASE + "/add_submodule.php", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {
        Alert.alert("Success!", "Sub-module added successfully", [
          {
            text: "OK",
            onPress: () => {
              setTitle("");
              setDescription("");
              setImage(null);
              setPdf(null);
              setSelectedCore(null);
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to add sub-module");
      }
    } catch (err) {
      Alert.alert(
        "Connection Error",
        "Could not reach the server. Please check your internet.",
      );
      console.error(err);
    }
  };

  return (
    <>
      {/* MODERATOR LOCK MODAL (BLURRED BACKGROUND) */}
      <Modal visible={locked} animationType="fade" transparent>
        <View style={{ flex: 1 }}>
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.lockContainer}>
            <View style={styles.lockCard}>
              <Text style={styles.lockTitle}>Moderator Access Required</Text>

              <TextInput
                style={styles.lockInput}
                placeholder="Enter moderator code"
                placeholderTextColor="#94a3b8"
                value={codeInput}
                onChangeText={(t) => {
                  setCodeInput(t);
                  if (codeError) setCodeError("");
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              {codeError ? (
                <Text style={styles.lockError}>{codeError}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.lockButton}
                onPress={verifyCode}
                activeOpacity={0.85}
              >
                <Text style={styles.lockButtonText}>Unlock</Text>
              </TouchableOpacity>

              <Text style={styles.lockHint}>
                Enter the moderator code to continue.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* MAIN FORM */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add New Sub-module</Text>

        <Text style={styles.label}>Core Module *</Text>

        {/* GRID SELECT */}
        <View style={[styles.moduleGrid, { gap: 12 }]}>
          {coreModules.map((m) => {
            const active = selectedCore === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => setSelectedCore(m.id)}
                style={[
                  styles.moduleCard,
                  {
                    width: moduleCardWidth,
                    borderColor: active ? m.color : "#e2e8f0",
                    backgroundColor: active ? `${m.color}12` : "#f8fafc",
                  },
                ]}
              >
                <View
                  style={[
                    styles.moduleIconWrap,
                    {
                      backgroundColor: `${m.color}22`,
                      borderColor: `${m.color}35`,
                    },
                  ]}
                >
                  <MaterialIcons name={m.icon} size={22} color={m.color} />
                </View>

                <Text style={styles.moduleName} numberOfLines={2}>
                  {m.name}
                </Text>

                {active ? (
                  <View
                    style={[
                      styles.moduleActivePill,
                      { backgroundColor: m.color },
                    ]}
                  >
                    <MaterialIcons name="check" size={14} color="#fff" />
                    <Text style={styles.moduleActiveText}>Selected</Text>
                  </View>
                ) : (
                  <Text style={styles.moduleTapHint}>Tap to select</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {!selectedCore ? (
          <Text style={styles.selectHint}>
            Please select a core module to continue.
          </Text>
        ) : null}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Supplier Evaluation Process"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          returnKeyType="next"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief explanation of this sub-module..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Cover Image (optional)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Choose Image</Text>
        </TouchableOpacity>
        {image && (
          <Text style={styles.fileInfo}>
            ✓ Image selected ({image.fileName || "photo"})
          </Text>
        )}

        <Text style={styles.label}>PDF Document (optional)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickPdf}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Choose PDF</Text>
        </TouchableOpacity>
        {pdf && (
          <Text style={styles.fileInfo}>✓ {pdf.name || "PDF"} selected</Text>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            !selectedCore || !title.trim() ? { opacity: 0.6 } : null,
          ]}
          onPress={submit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>Create Sub-module</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  contentContainer: {
    paddingHorizontal: width > 500 ? 40 : 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: isLargeScreen ? 32 : 26,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 26,
    textAlign: "center",
  },
  label: {
    alignSelf: "flex-start",
    color: "#1e293b",
    fontSize: 15.5,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 10,
  },

  moduleGrid: { width: "100%", flexDirection: "row", flexWrap: "wrap" },
  moduleCard: { borderWidth: 2, borderRadius: 14, padding: 14, minHeight: 110 },
  moduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  moduleName: {
    color: "#0f172a",
    fontSize: 13.5,
    fontWeight: "800",
    lineHeight: 18,
    marginBottom: 10,
  },
  moduleTapHint: { color: "#64748b", fontSize: 12, fontWeight: "700" },
  moduleActivePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  moduleActiveText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  selectHint: {
    width: "100%",
    marginTop: 10,
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 12.5,
  },

  input: {
    width: "100%",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: { height: 120, textAlignVertical: "top", paddingTop: 14 },

  uploadButton: {
    width: "100%",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#10b981",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 36,
    marginBottom: 20,
  },
  buttonText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
  submitButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 17 },
  fileInfo: {
    alignSelf: "flex-start",
    color: "#2563eb",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },

  lockContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  lockCard: {
    width: width > 500 ? 420 : "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 18,
    textAlign: "center",
    color: "#0f172a",
  },
  lockInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: "#0f172a",
  },
  lockError: {
    color: "#ef4444",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700",
  },
  lockButton: {
    backgroundColor: "#1e40af",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  lockButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 15 },
  lockHint: {
    marginTop: 12,
    textAlign: "center",
    color: "#475569",
    fontSize: 12.5,
    fontWeight: "600",
  },
});
