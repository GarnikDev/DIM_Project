import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../services/supabase";

export default function StopFormScreen({ route, navigation }: any) {
  const { tourId } = route.params;
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [order, setOrder] = useState("1");

  const saveStop = async () => {
    if (!title || !coord)
      return Alert.alert(
        "¡Atención!",
        "Debes poner un título y marcar la ubicación en el mapa.",
      );

    const { error } = await supabase.from("stops").insert([
      {
        tour_id: tourId,
        title,
        description: desc,
        latitude: coord.lat,
        longitude: coord.lng,
        stop_order: parseInt(order),
      },
    ]);

    if (!error) {
      Alert.alert("Éxito", "Parada añadida correctamente");
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Text style={styles.mainTitle}>Nueva Parada</Text>

        <Text style={styles.label}>Nombre del Monumento</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Torre del Oro"
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Historia para la Audioguía</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={desc}
          onChangeText={setDesc}
          placeholder="Escribe aquí lo que la voz leerá..."
        />

        <Text style={styles.label}>Ubicación (Toca el mapa)</Text>
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.miniMap}
            initialRegion={{
              latitude: 37.3891,
              longitude: -5.9845,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) =>
              setCoord({
                lat: e.nativeEvent.coordinate.latitude,
                lng: e.nativeEvent.coordinate.longitude,
              })
            }
          >
            {coord && (
              <Marker
                coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                pinColor="#5CC2A3"
              />
            )}
          </MapView>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveStop}>
          <Text style={styles.saveBtnText}>GUARDAR PARADA</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F9F7", padding: 25 },
  mainTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 20,
    marginTop: 40,
  },
  label: {
    fontWeight: "700",
    color: "#5C9484",
    marginBottom: 8,
    fontSize: 14,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#2D3436",
    borderWidth: 1,
    borderColor: "#E0EDE9",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  mapWrapper: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 30,
    borderWidth: 3,
    borderColor: "white",
    elevation: 5,
  },
  miniMap: { width: "100%", height: 220 },
  saveBtn: {
    backgroundColor: "#2D5A4C",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1.2,
  },
});
