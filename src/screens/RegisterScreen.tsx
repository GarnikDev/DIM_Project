import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,

  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../services/supabase";
import { RootStackParamList } from "../../App";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

const isValidEmail = (email: string) => /.+@.+/.test(email);

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Imagen de perfil
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // ==================== SELECCIONAR Y SUBIR FOTO ====================
  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      await uploadProfileImage(asset);
    }
  };

  const uploadProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setLoading(true);

      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Convertir uri → Blob (más estable)
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: asset.mimeType || `image/${fileExt}`,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProfileImageUrl(urlData.publicUrl);
      Alert.alert("¡Éxito!", "Foto de perfil subida correctamente");
    } catch (err: any) {
      console.error("Error al subir imagen:", err);
      Alert.alert("Error", "No se pudo subir la foto. Inténtalo de nuevo.");
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  };

  // ==================== REGISTRO ====================
  const handleRegister = async () => {
    setError("");

    if (!email || !username || !password || !confirmPassword) {
      setError("Por favor, completa todos los campos.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Por favor, ingresa un email válido.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // 1. Crear usuario en Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!signUpData?.user) throw new Error("No se recibió el usuario");

      // 2. Crear perfil
      const { error: profileError } = await supabase.from("profiles").insert({
        id: signUpData.user.id,
        username: username || email.split("@")[0],
        profile_image: profileImageUrl || null,
      });

      if (profileError) throw profileError;

      Alert.alert(
        "¡Registro exitoso!",
        "Revisa tu correo para confirmar la cuenta."
      );
      navigation.navigate("Tours");
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError(err.message || "Ocurrió un error inesperado");
      Alert.alert("Error", err.message || "No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Registro de Usuario</Text>

        {/* Foto de perfil */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={pickImage}
          disabled={loading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>Añadir foto</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.hintText}>Toca para seleccionar tu foto de perfil</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#5CC2A3" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Registrarse</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F9F7",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 32,
    alignItems: "center",
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D5A4C",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#A3D9C9",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F3F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#5C9484",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  hintText: {
    fontSize: 13,
    color: "#8DA39E",
    marginBottom: 24,
    fontStyle: "italic",
  },
  input: {
    width: "100%",
    height: 56,
    backgroundColor: "#F7FBF9",
    borderWidth: 1.5,
    borderColor: "#E0EDE9",
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: "#2D5A4C",
  },
  registerButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#5CC2A3",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#5CC2A3",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: "#FF7675",
    fontSize: 14,
    marginBottom: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});