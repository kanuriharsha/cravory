import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Index() {
  const [isSignup, setIsSignup] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const navigation = useNavigation();
  const router = useRouter();

  // simple country list (no extra deps)
  const countries = [
    { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
    { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  ];
  const [country, setCountry] = useState(countries[0]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    navigation.setParams({ progress: 25 } as any);
  }, [navigation]);

  // NEW: valid when exactly 10 digits
  const isValidPhone = phone.length === 10;

  const onSubmit = () => {
    // NEW: guard if invalid
    if (!isValidPhone) return;
    // continue with phone flow
    console.log("Continue with phone", { country: country.code, phone });
    router.push({ pathname: "/otp", params: { phone: `${country.dial}${phone}` } });
  };

  const signInWithGoogle = () => {
    // integrate real Google auth later; placeholder action
    console.log("Google sign in tapped");
  };

  const signInWithEmail = () => {
    // integrate real email flow later; placeholder action
    console.log("Email sign in tapped");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topLogoContainer}>
            <Image
              source={require("../assets/images/logo.jpeg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Log in or sign up label with side lines */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionDivider} />
            <Text style={[styles.sectionTitle, styles.sectionHeaderText]}>
              Log in or sign up
            </Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.formContainer}>
            {/* Phone row with country selector */}
            <View style={styles.phoneRow}>
              <TouchableOpacity style={styles.countryBtn} onPress={() => setPickerVisible(true)}>
                <Text style={styles.flag}>{country.flag}</Text>
                <Text style={styles.caret}>▾</Text>
              </TouchableOpacity>

              <View style={styles.phoneField}>
                <Text style={styles.dial}>{country.dial}</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter Phone Number"
                  keyboardType="phone-pad"
                  value={phone}
                  // NEW: digits only, hard limit 10
                  onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
              </View>
            </View>

            {/* Email only for signup (kept as requested) */}
            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            )}

            {/* Continue button */}
            <TouchableOpacity
              style={[styles.submitButton, !isValidPhone && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={!isValidPhone}
            >
              <Text style={[styles.submitButtonText, !isValidPhone && styles.submitButtonTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>

            {/* OR separator */}
            <View style={styles.orRow}>
              <View style={styles.divider} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social sign-ins */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={signInWithGoogle}>
                <AntDesign name="google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={signInWithEmail}>
                <MaterialCommunityIcons name="email-outline" size={24} color="#EA4335" />
              </TouchableOpacity>
            </View>

            {/* Toggle text (kept) */}
          </View>

          {/* Bottom info (kept) */}
          <View style={styles.bottomInfo}>
            <Text style={styles.infoText}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
            <Text style={styles.poweredText}>Powered by PEH Network Hub™</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard}>
            {countries.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={styles.countryRow}
                onPress={() => {
                  setCountry(c);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.flag}>{c.flag}</Text>
                <Text style={styles.countryText}>{`${c.name}  ${c.dial}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const PRIMARY = "#FC8019";
const BACKGROUND = "#FFFFFF";
const INPUT_BG = "#FFFFFF";
const TEXT_COLOR = "#333333";

const styles = StyleSheet.create({
  poweredText: { fontSize: 10, color: "#888", textAlign: "center", marginTop: 2 },

  container: { flex: 1, backgroundColor: BACKGROUND, top: -30, },
  scrollContainer: { flexGrow: 1, justifyContent: "space-between", padding: 20, backgroundColor: BACKGROUND },

  topLogoContainer: { alignItems: "center", marginTop: 150 },
  logo: { width: 150, height: 150, marginBottom: -100 },

  sectionTitle: {
    textAlign: "center",
    color: "#7A7A7A",
    fontSize: 16,
    marginTop: 10,
    bottom: -90,
  },
  // New: header row + dividers, and neutralize offsets for the title inside the row
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
    top: 80,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E6E6E6",
  },
  sectionHeaderText: {
    bottom: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 8,
  },

  formContainer: { top: 60 },

  // Phone row
  phoneRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  countryBtn: {
    width: 56,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  flag: { fontSize: 20 },
  caret: { position: "absolute", right: 6, bottom: 6, color: "#8E8E93", fontSize: 12 },

  phoneField: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: INPUT_BG,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    // bottom: 
  },
  dial: { color: "#666", marginRight: 8, fontSize: 16 },
  phoneInput: { flex: 1, fontSize: 16, color: TEXT_COLOR },

  // Optional email (signup only)
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT_COLOR,
    marginTop: 8,
    marginBottom: 8,
  },

  // Continue button (FC8019)
  submitButton: {
    backgroundColor: "#FFB800",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#E6E6E6",
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  submitButtonTextDisabled: {
    color: "#9E9E9E",
  },

  // OR separator and social buttons
  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: "#E6E6E6" },
  orText: { marginHorizontal: 8, color: "#8E8E93" },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 24 },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    alignItems: "center",
    justifyContent: "center",
  },

  toggleButton: { marginTop: 16, alignItems: "center" },
  toggleText: { color: PRIMARY, fontSize: 15 },

  bottomInfo: { marginVertical: 20, alignItems: "center" , top: 42,},
  infoText: { color: "#888888", fontSize: 12, textAlign: "center", paddingHorizontal: 10 },

  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  modalCard: { width: "80%", backgroundColor: "#FFF", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8 },
  countryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8 },
  countryText: { marginLeft: 10, fontSize: 16, color: "#222" },
});