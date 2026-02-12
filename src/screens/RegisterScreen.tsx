// Importaciones de componentes de React Native
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Para selección y subida de imagen
import * as ImagePicker from "expo-image-picker";

// Importación del cliente de Supabase
import { supabase } from "../services/supabase";

// Tipos para la navegación
import { RootStackParamList } from "../../App";

// Tipo para la navegación
type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

// Función para validar formato de email (sin cambiarla, como pediste)
const isValidEmail = (email: string) => {
  const regex = /.+@.+/;
  return regex.test(email);
};

// Componente de pantalla de registro
export default function RegisterScreen() {
  // Estados para los campos del formulario
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para la imagen de perfil
  const [imageUri, setImageUri] = useState<string | null>(null); // Vista previa local
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); // URL en Supabase

  // Hook de navegación
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // 1. Corregir el Picker para evitar el Warning
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // CAMBIO: Usar el nuevo formato para evitar el WARN
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Bajamos un poco la calidad para que suba más rápido
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      // IMPORTANTE: Llamamos a la subida
      await uploadProfileImage(result.assets[0]);
    }
  };

  const uploadProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setLoading(true);

      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // --- EL TRUCO DEL BLOB (Más estable para redes) ---
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      // --------------------------------------------------

      const { error: uploadError } = await supabase.storage
        .from("avatard")
        .upload(filePath, blob, {
          contentType: asset.mimeType || `image/${fileExt}`,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatard")
        .getPublicUrl(filePath);

      setProfileImageUrl(urlData.publicUrl);
      Alert.alert("¡Éxito!", "Imagen cargada correctamente.");
    } catch (err: any) {
      console.error("Error detallado:", err);
      // Si el error persiste, revisa que el bucket sea público en Supabase
      Alert.alert(
        "Error de red",
        "La subida tardó demasiado o falló. Intenta con una foto más pequeña.",
      );
    } finally {
      setLoading(false);
    }
  };

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
      // 1. Registro en Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        setError(signUpError.message);
        Alert.alert("Error de registro", signUpError.message);
        return;
      }

      if (!signUpData?.user) {
        setError("No se recibió información del usuario");
        Alert.alert("Error", "No se pudo obtener el ID del usuario");
        return;
      }

      // 2. Insertar perfil (incluyendo la imagen si se subió)
      const { error: profileError } = await supabase.from("profiles").insert({
        id: signUpData.user.id,
        username: username || email.split("@")[0],
        profile_image: profileImageUrl || null, // ← aquí se guarda la URL
      });

      if (profileError) {
        console.error("Error al insertar perfil:", profileError);
        setError(
          "Perfil no creado: " + (profileError.message || "Error desconocido"),
        );
        Alert.alert(
          "Problema al crear perfil",
          "El usuario se creó, pero no se pudo crear el perfil.\n" +
            "Error: " +
            (profileError.message || "Desconocido") +
            "\n\nPor favor intenta de nuevo o contacta soporte.",
        );
        return;
      }

      // Éxito completo
      Alert.alert(
        "Éxito",
        "Usuario y perfil registrados correctamente. Revisa tu email para confirmar.",
      );
      navigation.navigate("Tours");
    } catch (err: any) {
      console.error("Excepción en registro:", err);
      setError("Ocurrió un error inesperado: " + (err.message || ""));
      Alert.alert("Error inesperado", "Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Usuario</Text>

      {/* Área para foto de perfil */}
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

      <Text style={styles.hintText}>
        Toca para seleccionar tu foto de perfil
      </Text>

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

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0066cc"
          style={{ marginVertical: 20 }}
        />
      ) : (
        <Button
          title="Registrarse"
          onPress={handleRegister}
          disabled={loading}
          color="#0066cc"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F2F9F7", // Un verde menta extremadamente claro (casi blanco)
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 35, // Bordes muy redondos y orgánicos
    padding: 30,
    alignItems: "center",
    // Sombra suave para dar profundidad
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D5A4C", // Verde bosque profundo para el texto
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    marginBottom: 20,
    // Efecto de anillo alrededor del avatar
    padding: 4,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#A3D9C9", // Verde menta pastel
    borderStyle: "dashed",
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
    borderRadius: 20, // Inputs redondeados
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: "#2D5A4C",
  },
  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#5CC2A3", // Verde menta vibrante (Botón principal)
    borderRadius: 28, // Botón tipo píldora
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#5CC2A3",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: "#E67E7E", // Rojo pastel
    fontSize: 14,
    marginBottom: 16,
    fontWeight: "500",
  },
});
