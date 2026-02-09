import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { supabase } from "../services/supabase";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = {
  route: RouteProp<RootStackParamList, "StopForm">;
  navigation: NativeStackNavigationProp<RootStackParamList, "StopForm">;
};

export default function StopFormScreen({ route, navigation }: Props) {
  const { tourId, stopId } = route.params;
  const isEdit = !!stopId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [stopOrder, setStopOrder] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) fetchStop();
  }, []);

  async function fetchStop() {
    const { data, error } = await supabase
      .from("stops")
      .select("*")
      .eq("id", stopId)
      .single();
    if (error) {
      Alert.alert("Error", "No se pudo cargar la parada.");
      return;
    }
    if (data) {
      setTitle(data.title);
      setDescription(data.description || "");
      setLatitude(data.latitude.toString());
      setLongitude(data.longitude.toString());
      setStopOrder(data.stop_order.toString());
    }
  }

  async function saveStop() {
    if (!title || !latitude || !longitude || !stopOrder) {
      Alert.alert("Error", "Completa todos los campos requeridos.");
      return;
    }

    setLoading(true);
    const updates = {
      title,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      stop_order: parseInt(stopOrder),
      tour_id: tourId,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase
        .from("stops")
        .update(updates)
        .eq("id", stopId));
    } else {
      ({ error } = await supabase.from("stops").insert(updates));
    }

    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Éxito", isEdit ? "Parada actualizada." : "Parada creada.");
      navigation.goBack(); // Vuelve a EditStops, refetch se hace allá
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isEdit ? "Editar Parada" : "Crear Parada"}
      </Text>

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
        placeholder="Latitud"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Longitud"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Orden (número)"
        value={stopOrder}
        onChangeText={setStopOrder}
        keyboardType="numeric"
      />

      <Button
        title={loading ? "Guardando..." : "Guardar"}
        onPress={saveStop}
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
