import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    // Set 25% on the login/index screen
    navigation.setParams({ progress: 25 } as any);
  }, [navigation]);

  const onSubmit = () => {
    if (isSignup) {
      // handle signup logic
      console.log("Signup", { phone, email, password });
    } else {
      // handle login logic
      console.log("Login", { phone, email, password });
    }
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
            {/* You can put your app logo here */}
            <Image
              source={require("../assets/images/logo.jpeg")} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            {/* Phone number */}
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* Email (only for signup, optionally) */}
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

            {/* Password */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitButtonText}>
                {isSignup ? "Create Account" : "Log In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignup((prev) => !prev)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {isSignup
                  ? "Already have an account? Log In"
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomInfo}>
            <Text style={styles.infoText}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = "#FC8019"; // Swiggy-like orange
const BACKGROUND = "#FFFFFF";
const INPUT_BG = "#FFFFFF";
const TEXT_COLOR = "#333333";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    marginBottom: -30,
    top : -30,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  topLogoContainer: {
    alignItems: "center",
    marginTop: 130,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: -100,
  },
  formContainer: {
    marginTop: 25,
    // optional: margins, etc.
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT_COLOR,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#FFB800",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleText: {
    color: PRIMARY,
    fontSize: 15,
  },
  bottomInfo: {
    marginVertical: 20,
    alignItems: "center",
  },
  infoText: {
    bottom: 50,
    color: "#888888",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});