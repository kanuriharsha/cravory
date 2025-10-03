import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Backend API URL (auto-resolve for device/emulator)
const resolveApiUrl = () => {
  try {
    // Prefer the Metro host (works in Expo Go)
    const host =
      (Constants.expoGoConfig as any)?.debuggerHost?.split(":")?.[0] ||
      (Constants.expoConfig as any)?.hostUri?.split(":")?.[0];
    if (host) return `http://${host}:4000`;
  } catch {}
  // Android emulator
  if (Platform.OS === "android") return "http://10.0.2.2:4000";
  // iOS simulator / web
  return "http://localhost:4000";
};
const API_URL = resolveApiUrl();

export default function MainPage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [dishes, setDishes] = useState("");
  const [restaurantImage, setRestaurantImage] = useState<string | null>(null);
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const canSubmit = name.trim() && mapLink.trim() && dishes.trim() && restaurantImage && dishImage;

  const pickImage = async (which: "restaurant" | "dish") => {
    setErr(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErr("Permission to access photos is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      const a = result.assets[0];
      const mime = (a as any).mimeType || "image/jpeg";
      const base64 = a.base64;
      if (base64) {
        const dataUri = `data:${mime};base64,${base64}`;
        if (which === "restaurant") setRestaurantImage(dataUri);
        else setDishImage(dataUri);
      }
    }
  };

  const resetForm = () => {
    setName("");
    setMapLink("");
    setDishes("");
    setRestaurantImage(null);
    setDishImage(null);
    setErr(null);
  };

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants`);
      const json = await res.json();
      console.log("[Restaurants] fetched:", Array.isArray(json) ? json.length : json);
      if (Array.isArray(json)) setRestaurants(json);
    } catch (e: any) {
      console.error("[Restaurants] fetch error:", e?.message || e);
      setErr("Failed to load restaurants");
    }
  }, [API_URL]);

  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [fetchRestaurants])
  );

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setErr(null);
    try {
      const payload = {
        name: name.trim(),
        mapLink: mapLink.trim(),
        dishes: dishes.trim(),
        restaurantImage,
        dishImage,
      };
      const body = JSON.stringify(payload);
      console.log("[AddRestaurant] POST", `${API_URL}/api/restaurants`, {
        bytes: body.length,
        name: payload.name,
        mapLink: payload.mapLink,
        dishesLen: payload.dishes.length,
        restImgLen: payload.restaurantImage?.length || 0,
        dishImgLen: payload.dishImage?.length || 0,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15s timeout

      const res = await fetch(`${API_URL}/api/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      }).catch((e) => {
        // Network-layer failure (DNS, refused, CORS, timeout/abort)
        console.error("[AddRestaurant] Fetch failed", e?.name, e?.message);
        throw e;
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      console.log("[AddRestaurant] Response", res.status, text);
      if (!res.ok) throw new Error(text || `Request failed: ${res.status}`);

      await fetchRestaurants(); // refresh list
      resetForm();
      setModalVisible(false);
    } catch (e: any) {
      console.error("[AddRestaurant] Error", e?.name, e?.message);
      setErr(e?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const dishesArray = (s?: string) =>
    (s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.center}>
        <Text style={styles.title}>Welcome to Cravory</Text>
        <Text style={styles.subtitle}>You have been signed in successfully.</Text>
      </View>

      {/* Restaurants list */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {restaurants.map((r) => {
          const open = expandedId === String(r._id);
          return (
            <View key={String(r._id)} style={styles.card}>
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => setExpandedId(open ? null : String(r._id))} style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{r.name}</Text>
                  <Text style={styles.cardLink} numberOfLines={1}>{r.mapLink}</Text>
                </TouchableOpacity>
                {!!r.restaurantImage && (
                  <Image source={{ uri: r.restaurantImage }} style={styles.cardImage} />
                )}
              </View>

              {open && (
                <View style={styles.dishesWrap}>
                  {dishesArray(r.dishes).map((d: string, idx: number) => (
                    <View key={`${r._id}-${idx}`} style={styles.dishChip}>
                      <Text style={styles.dishChipText}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        {restaurants.length === 0 && (
          <Text style={styles.emptyText}>No restaurants yet. Tap + to add one.</Text>
        )}
      </ScrollView>

      {/* Floating + button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Create Restaurant Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Restaurant</Text>
            <Text style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>API: {API_URL}</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Google Maps Link"
                autoCapitalize="none"
                value={mapLink}
                onChangeText={setMapLink}
              />
              <TextInput
                style={[styles.input, { height: 90 }]}
                placeholder="Dishes (comma separated)"
                value={dishes}
                onChangeText={setDishes}
                multiline
              />

              <View style={styles.imageRow}>
                <TouchableOpacity style={styles.imagePick} onPress={() => pickImage("restaurant")}>
                  {restaurantImage ? (
                    <Image source={{ uri: restaurantImage }} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.imagePickText}>Pick Restaurant Image</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.imagePick} onPress={() => pickImage("dish")}>
                  {dishImage ? (
                    <Image source={{ uri: dishImage }} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.imagePickText}>Pick Dish Image</Text>
                  )}
                </TouchableOpacity>
              </View>

              {!!err && <Text style={styles.errorText}>{err}</Text>}

              <TouchableOpacity
                style={[styles.saveBtn, (!canSubmit || loading) && styles.saveBtnDisabled]}
                disabled={!canSubmit || loading}
                onPress={submit}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { marginTop: 8, color: "#666" },

  listContainer: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },

  card: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  cardLink: { fontSize: 12, color: "#777", marginTop: 2, maxWidth: "80%" },
  cardImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#F4F4F4" },

  dishesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  dishChip: {
    backgroundColor: "#FC8019",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  dishChipText: { color: "#FFF", fontWeight: "600", fontSize: 12 },

  emptyText: { textAlign: "center", color: "#999", marginTop: 8 },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { fontSize: 30, color: "#fff", marginTop: -2 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#222",
    marginBottom: 10,
  },

  imageRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  imagePick: {
    flex: 1,
    height: 120,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  imagePickText: { color: "#777", textAlign: "center", paddingHorizontal: 10, fontSize: 13 },
  imagePreview: { width: "100%", height: "100%", borderRadius: 10 },

  saveBtn: {
    backgroundColor: "#FFB800",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnDisabled: { backgroundColor: "#E6E6E6" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  cancelBtn: { alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#E53935", fontSize: 14, fontWeight: "600" },

  errorText: { color: "#E53935", marginTop: 4, marginBottom: 6 },
});
