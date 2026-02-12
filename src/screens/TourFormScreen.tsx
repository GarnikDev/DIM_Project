import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../services/supabase";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TourForm">;
  route: RouteProp<RootStackParamList, "TourForm">;
};

export default function TourFormScreen({ navigation, route }: Props) {
  const tourId = route.params?.tourId; // Si existe, estamos editando
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    if (tourId) {
      fetchTourDetails();
    }
  }, [tourId]);

  async function fetchTourDetails() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", tourId)
      .single();

    if (data) {
      setTitle(data.title);
      setCity(data.city);
      setLanguage(data.language);
      setDuration(data.duration.toString());
      setPrice(data.price.toString());
      setCoverImage(data.cover_image || "");
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!title || !city || !price) {
      Alert.alert("Error", "Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const tourData = {
        title,
        city,
        language,
        duration: parseInt(duration) || 0,
        price: parseFloat(price) || 0,
        cover_image: coverImage,
        created_by: userData.user?.id,
      };

      let error;
      if (tourId) {
        // Actualizar
        const { error: updateError } = await supabase
          .from("tours")
          .update(tourData)
          .eq("id", tourId);
        error = updateError;
      } else {
        // Crear nuevo
        const { error: insertError } = await supabase
          .from("tours")
          .insert([tourData]);
        error = insertError;
      }

      if (error) throw error;

      Alert.alert(
        "¡Éxito!",
        tourId ? "Tour actualizado" : "Tour creado correctamente",
      );
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.headerTitle}>
            {tourId ? "Editar Tour" : "Nuevo Tour"}
          </Text>
          <Text style={styles.subtitle}>
            Cuéntanos los detalles de tu aventura
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título del Tour *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Caminata por el centro"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Ciudad *</Text>
              <TextInput
                style={styles.input}
                placeholder="Valencia"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Idioma</Text>
              <TextInput
                style={styles.input}
                placeholder="Español"
                value={language}
                onChangeText={setLanguage}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Precio (€) *</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="120"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL Imagen de Portada</Text>
            <TextInput
              style={styles.input}
              placeholder="https://tu-imagen.jpg"
              value={coverImage}
              onChangeText={setCoverImage}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {tourId ? "Guardar Cambios" : "Crear Aventura"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F9F7",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 25,
    elevation: 8,
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D5A4C",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#8DA39E",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5C9484",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F7FBF9",
    borderWidth: 1.5,
    borderColor: "#E0EDE9",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: "#2D3436",
  },
  row: {
    flexDirection: "row",
  },
  saveButton: {
    backgroundColor: "#5CC2A3",
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#5CC2A3",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#A3D9C9",
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FF7675",
    fontWeight: "600",
    fontSize: 15,
  },
});
