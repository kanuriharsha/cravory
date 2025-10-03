import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

const THEME = "#FC8019";

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
  // NEW: cache for resolved coords of short links
  const [coordCache, setCoordCache] = useState<Record<string, { lat: number; lng: number }>>({});

  // NEW: UI state for Zomato-like header
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const categories = ["All", "Biryani", "Fried Rice", "Bowl", "Pizza", "Snacks", "Curry"];
  const [activeCategory, setActiveCategory] = useState("All");

  // NEW: user coords for distance calc
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
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

  // NEW: get user location (try last known, then request)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last?.coords) {
            setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
          } else {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
              const pos = await Location.getCurrentPositionAsync({});
              setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            }
          }
        } catch (e: any) {
          console.error("[Location] mainpage error:", e?.message || e);
        }
      })();
    }, [])
  );

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

  // Helper: parse lat/lng from any string (URL or HTML)
  const parseLatLngFromString = (s?: string): { lat: number; lng: number } | null => {
    if (!s) return null;
    try {
      // @lat,lng
      let m = s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
      // q=lat,lng or query=lat,lng
      m = s.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
      // ll=lat,lng
      m = s.match(/[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
      // !3d<lat>!4d<lng>
      m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
      // center=<lat>%2C<lng> (encoded comma)
      m = s.match(/[?&]center=(-?\d+(?:\.\d+)?)%2C(-?\d+(?:\.\d+)?)/i);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
      // "center":{"lat":..,"lng":..} in HTML
      m = s.match(/"center"\s*:\s*{\s*"lat"\s*:\s*(-?\d+(?:\.\d+)?),\s*"lng"\s*:\s*(-?\d+(?:\.\d+)?)\s*}/);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
      // generic fallback: two floats separated by comma/space
      m = s.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    } catch {
      // ignore
    }
    return null;
  };

  // Helper: parse from URL (calls string parser)
  const parseLatLng = (link?: string) => parseLatLngFromString(link || "");

  // NEW: resolve short links by following redirects and scanning final URL and HTML
  const resolveLatLngFromLink = async (link: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(link, { method: "GET" });
      const finalUrl = res.url || link;
      let coords = parseLatLngFromString(finalUrl);
      if (coords) {
        console.log("[ResolveLatLng] from final URL:", finalUrl, coords);
        return coords;
      }
      const html = await res.text();
      coords = parseLatLngFromString(html);
      if (coords) {
        console.log("[ResolveLatLng] from HTML body for:", finalUrl, coords);
        return coords;
      }
      console.warn("[ResolveLatLng] could not extract coords:", link);
      return null;
    } catch (e: any) {
      console.error("[ResolveLatLng] fetch error:", e?.message || e);
      return null;
    }
  };

  // NEW: for restaurants whose link didn't yield coords, try resolving and cache results
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = restaurants
        .filter((r) => r?.mapLink && !parseLatLng(r.mapLink) && !coordCache[r.mapLink])
        .slice(0, 5); // limit concurrent a bit
      for (const r of pending) {
        const c = await resolveLatLngFromLink(r.mapLink);
        if (c && !cancelled) {
          setCoordCache((prev) => ({ ...prev, [r.mapLink]: c }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurants, coordCache]);

  // Helper: haversine distance in km (stable atan2 variant)
  const distanceKm = (a: { latitude: number; longitude: number }, b: { lat: number; lng: number }) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // km
    const φ1 = toRad(a.latitude);
    const φ2 = toRad(b.lat);
    const Δφ = toRad(b.lat - a.latitude);
    const Δλ = toRad(b.lng - a.longitude);
    const sinΔφ = Math.sin(Δφ / 2);
    const sinΔλ = Math.sin(Δλ / 2);
    const h = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  };

  // Helper: format distance (e.g., "850 m" or "1.4 km")
  const formatDistance = (km: number) => {
    if (!isFinite(km)) return "";
    if (km < 1) {
      const m = Math.round(km * 1000);
      return `${m} m`;
    }
    return `${km.toFixed(km < 10 ? 1 : 0)} km`;
  };

  // Helper: stable pseudo rating based on name (3.8 - 4.8)
  const ratingFor = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return Math.round((3.8 + (h % 1000) / 1000) * 10) / 10 > 4.8 ? 4.8 : Math.round((3.8 + (h % 1000) / 1000) * 10) / 10;
  };

  // NEW: derive list with distance/time + filters (use cache as fallback)
  const shownRestaurants = useMemo(() => {
    const list = restaurants.map((r) => {
      const latlng = parseLatLng(r.mapLink) || coordCache[r.mapLink];
      let dist: number | null = null;
      if (coords && latlng) dist = distanceKm(coords, latlng);
      const minutes = dist != null ? Math.min(70, Math.max(20, Math.round(dist * 12 + 25))) : null;
      return { ...r, _dist: dist, _eta: minutes, _rating: ratingFor(String(r.name || "")) };
    });

    const text = search.trim().toLowerCase();
    const cat = activeCategory.toLowerCase();
    const isVegDish = (d: string) => /veg|paneer|aloo|gobi|mushroom/i.test(d);

    return list.filter((r) => {
      // search by name or dishes
      if (text) {
        const inName = String(r.name || "").toLowerCase().includes(text);
        const inDish = String(r.dishes || "").toLowerCase().includes(text);
        if (!inName && !inDish) return false;
      }
      // category filtering
      if (activeCategory !== "All") {
        if (!String(r.dishes || "").toLowerCase().includes(cat)) return false;
      }
      // veg mode
      if (vegOnly) {
        const hasVeg = String(r.dishes || "")
          .split(",")
          .some((d: string) => isVegDish(d));
        if (!hasVeg) return false;
      }
      return true;
    });
  }, [restaurants, coords, search, activeCategory, vegOnly, coordCache]);

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
      {/* NEW: Zomato-like header */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#777" style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Restaurant name or a dish..."
          style={styles.searchInput}
          placeholderTextColor="#B0B0B0"
        />
        <Ionicons name="mic-outline" size={20} color="#777" />
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setActiveCategory(c)}
              style={[styles.catChip, activeCategory === c && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, activeCategory === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.vegRow}>
          <Text style={styles.vegText}>VEG MODE</Text>
          <Switch value={vegOnly} onValueChange={setVegOnly} thumbColor={vegOnly ? "#22c55e" : "#f4f3f4"} />
        </View>
      </View>

      {/* Restaurants list */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {shownRestaurants.map((r) => {
          const open = expandedId === String(r._id);
          return (
            <View key={String(r._id)} style={styles.card}>
              {/* Hero image */}
              {!!r.restaurantImage && <Image source={{ uri: r.restaurantImage }} style={styles.heroImage} resizeMode="cover" />}
              {/* Content */}
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => setExpandedId(open ? null : String(r._id))}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {r._eta ? `${r._eta - 3}–${r._eta + 2} mins` : "—"}
                      {r._dist != null ? `  •  ${formatDistance(r._dist)}` : ""}
                      {"  •  Free"}
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.ratingText}>{r._rating?.toFixed(1)}</Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={styles.badgeText}>Last 100 Orders Without Complaints</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="flash" size={14} color={THEME} />
                  <Text style={styles.badgeText}>Frequent</Text>
                </View>
              </View>

              {/* Dishes chips (toggle by tapping name) */}
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
        {shownRestaurants.length === 0 && (
          <Text style={styles.emptyText}>No results. Try a different search or add a restaurant.</Text>
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

  // NEW: header styles
  searchRow: {
    marginTop: 8,
    marginHorizontal: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEE",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  searchInput: { flex: 1, color: "#222", fontSize: 14 },

  filterRow: {
    marginTop: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  catChipActive: {
    backgroundColor: THEME,
    borderColor: THEME,
  },
  catChipText: { color: "#444", fontSize: 13, fontWeight: "600" },
  catChipTextActive: { color: "#fff" },

  vegRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  vegText: { color: "#666", fontSize: 12, fontWeight: "700", marginRight: 4 },

  listContainer: { paddingHorizontal: 12, paddingBottom: 100, gap: 14 },

  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  heroImage: { width: "100%", height: 180, backgroundColor: "#F4F4F4" },

  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  metaRow: { flexDirection: "row", marginTop: 2 },
  metaText: { color: "#6B7280", fontSize: 12 },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F6F6F6",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: "#4B5563", fontSize: 12, fontWeight: "600" },

  dishesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  dishChip: { backgroundColor: THEME, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  dishChipText: { color: "#FFF", fontWeight: "700", fontSize: 12 },

  emptyText: { textAlign: "center", color: "#999", marginTop: 16 },

  // FAB (unchanged)
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
