import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Speech from "expo-speech";
import { supabase } from "../services/supabase";

export default function TourMapScreen({ route }: any) {
  const { tourId } = route.params;
  const mapRef = useRef<MapView>(null);

  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS DE AUDIO
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(false);
  const currentIdxRef = useRef(0);

  // 1. LIMPIEZA DE COORDENADAS PARA LA LÍNEA
  const lineCoords = stops
    .map((stop) => ({
      latitude: parseFloat(stop.latitude),
      longitude: parseFloat(stop.longitude),
    }))
    .filter((coords) => !isNaN(coords.latitude) && !isNaN(coords.longitude));

  const fetchStops = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stops")
      .select("*")
      .eq("tour_id", tourId)
      .order("stop_order", { ascending: true });

    if (data) {
      setStops(data);
      // 2. AJUSTE AUTOMÁTICO DEL ZOOM (FIT TO COORDINATES)
      if (data.length > 0) {
        const coords = data.map((s) => ({
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
        }));
        // Damos un pequeño respiro para que el mapa cargue antes de ajustar
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }, 1000);
      }
    }
    setLoading(false);
  }, [tourId]);

  useEffect(() => {
    fetchStops();
    return () => {
      Speech.stop();
    };
  }, [fetchStops]);

  // LÓGICA DE VOZ (Igual que antes)
  const playFrom = useCallback((array: string[], index: number) => {
    if (index >= array.length || isPausedRef.current) {
      if (index >= array.length) setIsSpeaking(false);
      return;
    }
    setCurrentIdx(index);
    currentIdxRef.current = index;
    Speech.speak(array[index], {
      language: "es-ES",
      onDone: () => {
        if (!isPausedRef.current) playFrom(array, index + 1);
      },
    });
  }, []);

  const handleStartSpeaking = (stop: any) => {
    Speech.stop();
    const fullText = `${stop.description || "Sin descripción disponible."}`;
    const chunks = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
    setSentences(chunks);
    setCurrentIdx(0);
    currentIdxRef.current = 0;
    setSelectedStop(stop);
    setIsSpeaking(true);
    setIsPaused(false);
    isPausedRef.current = false;
    playFrom(chunks, 0);
  };

  const togglePlayback = async () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      playFrom(sentences, currentIdxRef.current);
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      await Speech.stop();
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" style={{ flex: 1 }} color="#5CC2A3" />
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        ref={mapRef}
        style={styles.map}
        // SOLUCIÓN PARA IOS: Solo usa Google en Android
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: stops.length > 0 ? parseFloat(stops[0].latitude) : 37.3891,
          longitude:
            stops.length > 0 ? parseFloat(stops[0].longitude) : -5.9845,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* POLYLINE COMPATIBLE */}
        {lineCoords.length > 1 && (
          <Polyline
            coordinates={lineCoords}
            strokeColor="#5CC2A3"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: parseFloat(stop.latitude),
              longitude: parseFloat(stop.longitude),
            }}
            onPress={() => handleStartSpeaking(stop)}
          >
            <View
              style={[
                styles.marker,
                selectedStop?.id === stop.id && styles.markerActive,
              ]}
            >
              <Text style={styles.markerText}>{stop.stop_order}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedStop && (
        <View style={styles.audioPanel}>
          <Text style={styles.audioTitle}>{selectedStop.title}</Text>
          <ScrollView
            style={styles.historyScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.historyText}>
              {sentences.map((sentence, index) => (
                <Text
                  key={index}
                  style={[
                    styles.sentenceBase,
                    index === currentIdx && isSpeaking
                      ? styles.sentenceActive
                      : styles.sentenceInactive,
                  ]}
                >
                  {sentence}{" "}
                </Text>
              ))}
            </Text>
          </ScrollView>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={() => {
                Speech.stop();
                isPausedRef.current = true;
                setIsSpeaking(false);
                setSelectedStop(null);
              }}
            >
              <Text style={{ fontSize: 20 }}>⏹</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlayback}>
              <Text style={styles.playText}>
                {isPaused ? "REANUDAR" : isSpeaking ? "PAUSAR" : "REPRODUCIR"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  marker: {
    backgroundColor: "#5CC2A3",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
    elevation: 5,
  },
  markerActive: { backgroundColor: "#2D5A4C", transform: [{ scale: 1.2 }] },
  markerText: { color: "white", fontWeight: "bold" },
  audioPanel: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
    maxHeight: "40%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 30,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 10,
  },
  historyScroll: { marginBottom: 15 },
  historyText: { lineHeight: 24, fontSize: 16 },
  sentenceBase: { color: "#A0A0A0" },
  sentenceActive: {
    color: "#2D3436",
    fontWeight: "700",
    backgroundColor: "#F0F9F6",
  },
  sentenceInactive: { color: "#636E72" },
  controls: { flexDirection: "row", gap: 10 },
  stopBtn: {
    backgroundColor: "#F2F9F7",
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    flex: 1,
    backgroundColor: "#2D5A4C",
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { color: "white", fontWeight: "bold", letterSpacing: 1 },
});
