import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Alert, Button } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { supabase } from "../services/supabase";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import * as Speech from "expo-speech";

type Stop = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
  stop_order?: number;
};

type TourMapProps = {
  route: RouteProp<RootStackParamList, "MapaDetallado">;
};

const SEVILLA_CENTER: Region = {
  latitude: 37.3891,
  longitude: -5.9845,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function TourMapScreen({ route }: TourMapProps) {
  const { tourId, tourTitle } = route.params;

  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(
    null,
  ); // Para lectura
  const [isSpeaking, setIsSpeaking] = useState(false); // Estado para controles
  const [isPaused, setIsPaused] = useState(false); // Para pause/resume

  useEffect(() => {
    fetchStops();
  }, [tourId]);

  async function fetchStops() {
    const { data, error } = await supabase
      .from("stops")
      .select("id, title, description, latitude, longitude, stop_order")
      .eq("tour_id", tourId)
      .order("stop_order", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar las paradas");
      return;
    }

    if (data) {
      const parsed = data.map((stop: any) => ({
        id: stop.id,
        title: stop.title,
        description: stop.description,
        stop_order: stop.stop_order,
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
      }));
      setStops(parsed);
    }
  }

  // Función para hablar (extendida para descripción)
  const speakDescription = (text: string) => {
    if (isSpeaking) {
      Speech.stop(); // Detener si ya está hablando
    }
    Speech.speak(text, {
      language: "es-ES",
      pitch: 1.0,
      rate: 0.9, // Ligeramente más lento para claridad
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onError: () => Alert.alert("Error", "No se pudo reproducir la voz"),
    });
  };

  // Controles de voz
  const handlePlay = () => {
    if (selectedDescription) {
      if (isPaused) {
        Speech.resume();
        setIsPaused(false);
      } else {
        speakDescription(selectedDescription);
      }
    } else {
      Alert.alert(
        "Selecciona una parada",
        "Elige un marcador para leer su descripción",
      );
    }
  };

  const handlePause = () => {
    if (isSpeaking) {
      Speech.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (stops.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay paradas para este tour</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tourTitle}</Text>

      <MapView style={styles.map} initialRegion={SEVILLA_CENTER}>
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.title}
            description={stop.description}
            onPress={() => {
              setSelectedId(stop.id);
              setSelectedDescription(
                stop.description || "No hay descripción disponible",
              );
              speakDescription(stop.title); // Lee título primero (como antes)
            }}
            pinColor={stop.id === selectedId ? "blue" : "red"} // Indicador visual
          />
        ))}

        <Polyline
          coordinates={stops.map((s) => ({
            latitude: s.latitude,
            longitude: s.longitude,
          }))}
          strokeColor="blue"
          strokeWidth={3}
        />
      </MapView>

      {/* Indicador visual de la parada actual */}
      {selectedId && (
        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>
            Reproduciendo:{" "}
            {stops.find((s) => s.id === selectedId)?.title || "Ninguna"}
            {isSpeaking && " 🔊 (en reproducción)"}
          </Text>
        </View>
      )}

      {/* Controles de voz */}
      <View style={styles.controlsContainer}>
        <Button
          title={isPaused ? "Reanudar" : "Play"}
          onPress={handlePlay}
          disabled={!selectedDescription}
        />
        <Button
          title="Pause"
          onPress={handlePause}
          disabled={!isSpeaking || isPaused}
        />
        <Button
          title="Stop"
          onPress={handleStop}
          disabled={!isSpeaking}
          color="red"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: "bold", margin: 10, textAlign: "center" },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  indicatorContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  indicatorText: { fontSize: 14, color: "#333" },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#fff",
  },
});
