import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const THEME = "#FFB800";
const TEXT = "#111";
const MUTED = "#777";
const BORDER = "#E3E3E3";
const ERROR = "#E53935";

const LENGTH = 6;

export default function OTP() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [focused, setFocused] = useState<number | null>(0);
  const inputs = useRef<Array<TextInput | null>>([]);

  const [timer, setTimer] = useState(30);
  const canResend = timer === 0;

  useEffect(() => {
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const focusIndex = (i: number) => {
    inputs.current[i]?.focus();
    setFocused(i);
  };

  const onChange = (val: string, i: number) => {
    // accept only digits
    const v = val.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < LENGTH - 1) focusIndex(i + 1);
  };

  const onKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[i] && i > 0) {
      setDigits((prev) => {
        const next = [...prev];
        next[i - 1] = "";
        return next;
      });
      focusIndex(i - 1);
    }
  };

  const resend = () => {
    if (!canResend) return;
    setTimer(30);
    // trigger your resend SMS API here
    console.log("Resend SMS to", phone);
  };

  const code = digits.join("");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.title}>OTP Verification</Text>

          <Text style={styles.subtitle}>We have sent a verification code to</Text>
          <Text style={styles.phoneText}>{phone ? String(phone) : ""}</Text>

          <View style={styles.otpRow}>
            {Array.from({ length: LENGTH }).map((_, i) => {
              const active = focused === i || !!digits[i];
              return (
                <TextInput
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  value={digits[i]}
                  onChangeText={(t) => onChange(t, i)}
                  onKeyPress={(e) => onKeyPress(e, i)}
                  onFocus={() => setFocused(i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.otpCell, active && styles.otpCellActive]}
                  selectionColor={THEME}
                  autoFocus={i === 0}
                />
              );
            })}
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.mutedText}>Didn’t get the OTP? </Text>
            <TouchableOpacity disabled={!canResend} onPress={resend}>
              <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
                {canResend ? "Resend SMS" : `Resend SMS in ${timer}s`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backText}>Go back to login methods</Text>
          </TouchableOpacity>

          {/* Optional: auto-verify hook point */}
          {!!code && code.length === LENGTH && (
            <Text style={styles.debugText}>Entered code: {code}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
  backgroundColor: "#FFFFFF",
  height: "120%", // makes it 20% taller than screen
  top: -60,
}
,
  content: { paddingHorizontal: 20, paddingTop: 24, top: 60, },
  title: { fontSize: 24, fontWeight: "700", color: TEXT, marginBottom: 18 },
  subtitle: { fontSize: 14, color: MUTED, textAlign: "left", marginBottom: 6 },
  phoneText: { fontSize: 16, fontWeight: "600", color: TEXT, marginBottom: 18 },
  otpRow: { flexDirection: "row", gap: 12, paddingVertical: 8, marginBottom: 12 },
  otpCell: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    color: TEXT,
  },
  otpCellActive: { borderColor: THEME, shadowColor: THEME, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  resendRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  mutedText: { color: MUTED, fontSize: 14 },
  resendText: { color: THEME, fontSize: 14, fontWeight: "600" },
  resendDisabled: { color: "#BDBDBD", fontWeight: "400" },
  backLink: { marginTop: 24 },
  backText: { color: ERROR, textAlign: "center", fontSize: 14, fontWeight: "600" },
  debugText: { marginTop: 16, textAlign: "center", color: "#9E9E9E" },
});
