import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../services/supabase";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Stop = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  stop_order: number;
};

type Props = {
  route: RouteProp<RootStackParamList, "EditStops">;
  navigation: NativeStackNavigationProp<RootStackParamList, "EditStops">;
};

export default function EditStopsScreen({ route, navigation }: Props) {
  const { tourId } = route.params;
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresca la lista cada vez que volvemos a esta pantalla (después de crear/editar parada)
  useFocusEffect(
    useCallback(() => {
      fetchStops();
    }, [tourId])
  );

  async function fetchStops() {
    setLoading(true);
    const { data, error } = await supabase
      .from("stops")
      .select("*")
      .eq("tour_id", tourId)
      .order("stop_order", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar las paradas.");
    } else if (data) {
      setStops(data);
    }
    setLoading(false);
  }

  async function deleteStop(stopId: string) {
    Alert.alert(
      "Eliminar parada",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("stops")
              .delete()
              .eq("id", stopId);

            if (error) {
              Alert.alert("Error", error.message);   // ← muestra el mensaje real (RLS, etc.)
            } else {
              fetchStops();
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestionar Paradas</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("StopForm", { tourId })}
        >
          <Text style={styles.addBtnText}>+ Añadir Nueva Parada</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5CC2A3" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={stops}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{item.stop_order}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopTitle}>{item.title}</Text>
                  <Text style={styles.coordsText}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    navigation.navigate("StopForm", { tourId, stopId: item.id })
                  }
                >
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteStop(item.id)}
                >
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aún no has añadido paradas a este tour.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F2F9F7" },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 25,
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 15,
  },
  addBtn: {
    backgroundColor: "#5CC2A3",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    marginBottom: 15,
    padding: 15,
    elevation: 4,
  },
  cardInfo: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  orderBadge: {
    backgroundColor: "#F2F9F7",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#5CC2A3",
  },
  orderText: { color: "#5CC2A3", fontWeight: "bold", fontSize: 18 },
  stopTitle: { fontSize: 17, fontWeight: "800", color: "#2D3436" },
  coordsText: { color: "#636E72", fontSize: 13, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F9F6",
    paddingTop: 12,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FFF9F2",
    borderRadius: 10,
    marginRight: 8,
  },
  editBtnText: { color: "#E67E22", fontWeight: "bold" },
  deleteBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
  },
  deleteBtnText: { color: "#FF7675", fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#A0A0A0",
    fontSize: 16,
  },
});
