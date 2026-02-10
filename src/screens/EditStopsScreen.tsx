import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, StyleSheet, Alert } from "react-native";
import { supabase } from "../services/supabase";
import { RouteProp } from "@react-navigation/native";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchStops();
  }, []);

  async function fetchCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null); //purque me sale error aqui? user?.id no es string | null?
  }

  async function fetchStops() {
    const { data, error } = await supabase
      .from("stops")
      .select("*")
      .eq("tour_id", tourId)
      .order("stop_order", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar las paradas.");
      return;
    }
    if (data) setStops(data);
  }

  async function deleteStop(stopId: string) {
    // Chequeo dueño se hace en RLS, pero agregamos feedback
    const { error } = await supabase.from("stops").delete().eq("id", stopId);
    if (error) {
      Alert.alert("Error", error.message); // Ej: si no es dueño, RLS lo bloquea
    } else {
      Alert.alert("Éxito", "Parada eliminada.");
      fetchStops();
    }
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Button
        title="Agregar Parada"
        onPress={() => navigation.navigate("StopForm", { tourId })}
      />

      <FlatList
        data={stops}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>
              {item.title} (Orden: {item.stop_order})
            </Text>
            <Text>
              Lat: {item.latitude}, Lng: {item.longitude}
            </Text>
            <Button
              title="Editar"
              onPress={() =>
                navigation.navigate("StopForm", { tourId, stopId: item.id })
              }
            />
            <Button
              title="Eliminar"
              onPress={() => deleteStop(item.id)}
              color="red"
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  title: { fontSize: 16, fontWeight: "bold" },
});
