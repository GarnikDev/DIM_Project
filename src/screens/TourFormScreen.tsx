import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { supabase } from "../services/supabase";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = {
  route: RouteProp<RootStackParamList, "TourForm">;
  navigation: NativeStackNavigationProp<RootStackParamList, "TourForm">;
};

export default function TourFormScreen({ route, navigation }: Props) {
  const { tourId } = route.params || {};
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
    if (isEdit) fetchTour();
  }, []);

  async function fetchTour() {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", tourId)
      .single();
    if (error) {
      Alert.alert("Error", "No se pudo cargar el tour.");
      return;
    }
    if (data) {
      setTitle(data.title);
      setDescription(data.description || "");
      setCity(data.city);
      setLanguage(data.language);
      setCoverImage(data.cover_image || "");
      setDuration(data.duration.toString());
      setPrice(data.price.toString());
    }
  }

  async function saveTour() {
    if (!title || !city || !language || !duration || !price) {
      Alert.alert("Error", "Completa todos los campos requeridos.");
      return;
    }

    setLoading(true);
    const updates = {
      title,
      description,
      city,
      language,
      cover_image: coverImage,
      duration: parseInt(duration),
      price: parseInt(price),
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase
        .from("tours")
        .update(updates)
        .eq("id", tourId));
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      ({ error } = await supabase
        .from("tours")
        .insert({ ...updates, created_by: user?.id }));
    }

    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Éxito", isEdit ? "Tour actualizado." : "Tour creado.");
      navigation.goBack(); // Vuelve a Tours, refetch se hace allá
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEdit ? "Editar Tour" : "Crear Tour"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Ciudad"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Idioma"
        value={language}
        onChangeText={setLanguage}
      />
      <TextInput
        style={styles.input}
        placeholder="Imagen de portada (URL)"
        value={coverImage}
        onChangeText={setCoverImage}
      />
      <TextInput
        style={styles.input}
        placeholder="Duración (minutos)"
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Precio (€)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Button
        title={loading ? "Guardando..." : "Guardar"}
        onPress={saveTour}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
});
