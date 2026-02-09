import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { supabase } from "../services/supabase";
import { RootStackParamList } from "../../App";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Verificar si ya hay sesión activa al cargar la pantalla
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigation.replace("Tours"); // replace para no dejar la pantalla de login en el stack
      }
    } catch (err) {
      console.log("Error al verificar sesión:", err);
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");

    // Validación básica
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor completa ambos campos");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.log("Error de login:", error);
        setErrorMessage(error.message);
        Alert.alert("Error al iniciar sesión", error.message);
        return;
      }

      // Si login exitoso
      Alert.alert("¡Bienvenido!", "Has iniciado sesión correctamente");
      navigation.replace("Tours"); // replace para limpiar el stack
    } catch (err: any) {
      console.error("Excepción en login:", err);
      setErrorMessage("Ocurrió un error inesperado. Intenta de nuevo.");
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <Text style={styles.subtitle}>
        Usa tu correo electrónico y contraseña
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCorrect={false}
        editable={!loading}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0066cc"
          style={{ marginTop: 20 }}
        />
      ) : (
        <Button
          title="Entrar"
          onPress={handleLogin}
          disabled={loading}
          color="#0066cc"
        />
      )}

      <View style={styles.registerContainer}>
        <Button
          title="¿No tienes cuenta? Regístrate"
          onPress={() => navigation.navigate("Register")}
          color="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  registerContainer: {
    marginTop: 32,
    width: "100%",
  },
});
