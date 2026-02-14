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
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Speech from "expo-speech";
import { supabase } from "../services/supabase";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { generateAndShareTourPDF } from '../utils/PdfUtils';

type Stop = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  stop_order: number;
};

type TourMapProps = {
  route: RouteProp<RootStackParamList, "MapaDetallado">;
};

export default function TourMapScreen({ route }: TourMapProps) {
  const { tourId, tourTitle } = route.params;
  const mapRef = useRef<MapView>(null);

  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(false);
  const currentIdxRef = useRef(0);

  useEffect(() => {
    fetchStops();
    return () => {
      Speech.stop();
    };
  }, [tourId]);

  const fetchStops = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stops")
      .select("id, title, description, latitude, longitude, stop_order")
      .eq("tour_id", tourId)
      .order("stop_order", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar las paradas");
      setLoading(false);
      return;
    }

    if (data) {
      const parsed = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description || "",
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        stop_order: Number(s.stop_order) || 0,
      })).filter(s => !isNaN(s.latitude) && !isNaN(s.longitude));

      setStops(parsed);

      // Ajuste automático del mapa
      if (parsed.length > 0 && mapRef.current) {
        const coords = parsed.map(s => ({
          latitude: s.latitude,
          longitude: s.longitude,
        }));
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 80, bottom: 300, left: 80 },
            animated: true,
          });
        }, 800);
      }
    }
    setLoading(false);
  }, [tourId]);

const playFrom = useCallback((array: string[], index: number) => {
  if (index >= array.length || isPausedRef.current) {
    if (index >= array.length) setIsSpeaking(false);
    return;
  }

  setCurrentIdx(index);
  currentIdxRef.current = index;

  Speech.speak(array[index].trim(), {           // trim() avoids empty chunks
    language: "es-ES",
    pitch: 1.0,                                 // default = natural
    rate: 0.9,                                  // slightly slower = clearer
    onDone: () => {
      if (!isPausedRef.current) {
        playFrom(array, index + 1);
      }
    },
    onError: (err) => {
      console.log("Speech error:", err);
      Alert.alert("Error de voz", "No se pudo reproducir. Verifica volumen o modo silencio.");
      setIsSpeaking(false);
    },
  });
}, []);

// In handleSelectStop:
const handleSelectStop = (stop: Stop) => {
  Speech.stop();
  setSelectedStop(stop);

  const fullText = stop.description?.trim() || "Sin descripción disponible.";
  const chunks = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];

  // Clean chunks
  const cleanChunks = chunks.map(c => c.trim()).filter(c => c.length > 0);

  setSentences(cleanChunks);
  setCurrentIdx(0);
  currentIdxRef.current = 0;
  setIsSpeaking(true);
  setIsPaused(false);
  isPausedRef.current = false;

  // Speak title + first chunk immediately
  const initialText = `${stop.title}. ${cleanChunks[0] || ""}`;
  Speech.speak(initialText, {
    language: "es-ES",
    onDone: () => {
      if (cleanChunks.length > 1 && !isPausedRef.current) {
        playFrom(cleanChunks.slice(1), 1); // start from second chunk
      } else {
        setIsSpeaking(false);
      }
    },
    onError: (err) => {
      console.log(err);
      Alert.alert("Error", "No se pudo reproducir el audio. Verifica ajustes de voz.");
    },
  });
};
  const togglePlayback = () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      playFrom(sentences, currentIdxRef.current);
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      Speech.pause();
    }
  };

  const stopPlayback = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setSelectedStop(null);
    setSentences([]);
    setCurrentIdx(0);
  };

  const initialRegion: Region = {
    latitude: 37.3891,
    longitude: -5.9845,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5CC2A3" />
      </View>
    );
  }

  if (stops.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>No hay paradas en este tour</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Text style={styles.title}>{tourTitle || "Tour Map"}</Text>

      <TouchableOpacity
        style={styles.pdfButton}
        onPress={() => generateAndShareTourPDF(tourTitle, stops)}
        disabled={loading || stops.length === 0}
      >
        <Text style={styles.pdfButtonText}>
          Generar Informe PDF
        </Text>
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
      >
        <Polyline
          coordinates={stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
          strokeColor="#5CC2A3"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            onPress={() => handleSelectStop(stop)}
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
            contentContainerStyle={{ paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.historyText}>
              {sentences.map((sentence, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.sentenceBase,
                    idx === currentIdx && isSpeaking && !isPaused
                      ? styles.sentenceActive
                      : styles.sentenceInactive,
                  ]}
                >
                  {sentence.trim()}{" "}
                </Text>
              ))}
            </Text>
          </ScrollView>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.stopBtn} onPress={stopPlayback}>
              <Text style={styles.controlIcon}>⏹</Text>
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
  container: { flex: 1, backgroundColor: "#F2F9F7" },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2D5A4C",
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F9F7",
  },
  emptyText: {
    fontSize: 18,
    color: "#636E72",
    textAlign: "center",
  },
  marker: {
    backgroundColor: "#5CC2A3",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 6,
  },
  markerActive: {
    backgroundColor: "#2D5A4C",
    transform: [{ scale: 1.25 }],
  },
  markerText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  audioPanel: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    maxHeight: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 12,
  },
  historyScroll: {
    maxHeight: 160,
    marginBottom: 16,
  },
  historyText: {
    lineHeight: 24,
    fontSize: 15,
  },
  sentenceBase: { color: "#A0A0A0" },
  sentenceActive: {
    color: "#2D3436",
    fontWeight: "700",
    backgroundColor: "#F0F9F6",
  },
  sentenceInactive: { color: "#636E72" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stopBtn: {
    backgroundColor: "#F2F9F7",
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  playBtn: {
    flex: 1,
    backgroundColor: "#2D5A4C",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  playText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.8,
  },
  pdfButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#2D5A4C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 10,
  },
  pdfButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  controlIcon: {
    fontSize: 28,
    color: "#2D5A4C",
  },
});