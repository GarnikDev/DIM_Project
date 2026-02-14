import React, { useState, useEffect } from "react";
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
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = {
  route: RouteProp<RootStackParamList, "TourForm">;
  navigation: NativeStackNavigationProp<RootStackParamList, "TourForm">;
};

export default function TourFormScreen({ route, navigation }: Props) {
  const tourId = route.params?.tourId;
  const isEdit = !!tourId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchTour();
    }
  }, [tourId]);

  async function fetchTour() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", tourId)
      .single();

    if (error || !data) {
      Alert.alert("Error", "No se pudo cargar el tour.");
      setLoading(false);
      return;
    }

    setTitle(data.title || "");
    setDescription(data.description || "");
    setCity(data.city || "");
    setLanguage(data.language || "");
    setCoverImage(data.cover_image || "");
    setDuration(data.duration?.toString() || "");
    setPrice(data.price?.toString() || "");
    setLoading(false);
  }

  const handleSave = async () => {
    if (!title.trim() || !city.trim() || !price.trim()) {
      Alert.alert("Error", "Completa los campos obligatorios: Título, Ciudad y Precio.");
      return;
    }

    const priceNum = parseFloat(price);
    const durationNum = duration.trim() ? parseInt(duration) : 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "El precio debe ser un número mayor que 0.");
      return;
    }

    setLoading(true);

    try {
      const tourData: any = {
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        language: language.trim() || "Español",
        cover_image: coverImage.trim() || null,
        duration: durationNum,
        price: priceNum,
      };

      let error;

      if (isEdit) {
        // Actualizar (no tocamos created_by)
        ({ error } = await supabase.from("tours").update(tourData).eq("id", tourId));
      } else {
        // Crear nuevo
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No se encontró usuario autenticado");

        ({ error } = await supabase
          .from("tours")
          .insert([{ ...tourData, created_by: user.id }]));
      }

      if (error) throw error;

      Alert.alert(
        "¡Éxito!",
        isEdit ? "Tour actualizado correctamente" : "Tour creado correctamente"
      );
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo guardar el tour");
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
            {isEdit ? "Editar Tour" : "Nuevo Tour"}
          </Text>
          <Text style={styles.subtitle}>
            {isEdit
              ? "Modifica los detalles de tu aventura"
              : "Cuéntanos los detalles de tu aventura"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título del Tour *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Caminata por el centro histórico"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Describe la experiencia..."
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Ciudad *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Sevilla"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Idioma</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Español"
                value={language}
                onChangeText={setLanguage}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Precio (€) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 25"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 120"
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
              placeholder="https://ejemplo.com/imagen.jpg"
              value={coverImage}
              onChangeText={setCoverImage}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEdit ? "Guardar Cambios" : "Crear Aventura"}
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 28,
    elevation: 8,
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2D5A4C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8DA39E",
    textAlign: "center",
    marginBottom: 32,
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
  textArea: {
    height: 110,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#5CC2A3",
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
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
    shadowOpacity: 0.1,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FF7675",
    fontWeight: "600",
    fontSize: 15,
  },
});