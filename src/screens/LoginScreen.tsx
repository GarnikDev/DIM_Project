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
    backgroundColor: "#F2F9F7", // El verde menta pálido que usamos de fondo en los Tours
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35, // Mantengo el super redondeado tipo "burbuja"
    padding: 32,
    // Sombras más suaves y naturales
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "900", // Peso máximo para coherencia con "Mis Aventuras"
    color: "#2D5A4C", // El verde oscuro profundo de tus títulos
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -1,
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
    backgroundColor: "#F2F9F7", // Fondo ligeramente verdoso para el input
    borderWidth: 1,
    borderColor: "#E0F0E9", // Borde sutil
    borderRadius: 18, // Bordes redondeados pero no píldora total para variar un poco del botón
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: "#2D3436",
  },
  button: {
    backgroundColor: "#5CC2A3", // El verde principal de "+ Crear Nuevo Tour"
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    // Sombra en el mismo tono verde
    shadowColor: "#5CC2A3",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  registerContainer: {
    marginTop: 25,
    alignItems: "center",
  },
  registerText: {
    color: "#E67E22", // El naranja/ámbar que usamos para el botón "Editar"
    fontWeight: "800",
    fontSize: 15,
  },
  errorText: {
    color: "#FF7675", // El rojo coral suave que usamos en "Eliminar"
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});
