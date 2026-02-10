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
    backgroundColor: "#F0F4F8", // Un azul grisáceo muy suave (pastel)
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30, // Super redondeado
    padding: 32,
    shadowColor: "#8899A6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#F7F9FC", // Input con fondo pastel
    borderWidth: 1,
    borderColor: "#E1E8EE",
    borderRadius: 25, // Bordes redondos para los inputs también
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: "#2D3436",
  },
  button: {
    backgroundColor: "#FF7675", // Pastel coral vibrante (color de aventura)
    height: 55,
    borderRadius: 27.5, // Totalmente redondeado (píldora)
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    // Sombra para que el botón "flote"
    shadowColor: "#FF7675",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  registerContainer: {
    marginTop: 25,
    alignItems: "center",
  },
  registerText: {
    color: "#74B9FF", // Azul pastel para los enlaces
    fontWeight: "700",
    fontSize: 15,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "left",
    fontWeight: "500",
  },
});
