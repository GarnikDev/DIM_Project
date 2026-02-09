import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Tour = {
  id: string;
  title: string;
  city: string;
  language: string;
  cover_image?: string;
  duration: number;
  price: number;
  created_by: string; // Agregado para chequeo dueño
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Tours">;
};

export default function ToursScreen({ navigation }: Props) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchTours();
  }, []);

  async function fetchCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error al obtener usuario:", error);
        Alert.alert("Atención", "No se pudo verificar tu sesión.");
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(user?.id ?? null);
    } catch (err) {
      console.error("Excepción al obtener usuario:", err);
      setCurrentUserId(null);
    }
  }

  async function fetchTours() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tours")
      .select(
        "id, title, description, city, language, cover_image, duration, price, created_by",
      );

    if (error) {
      Alert.alert("Error", "No se pudieron cargar los tours: " + error.message);
    } else if (data) {
      setTours(data);
    }
    setLoading(false);
  }

  async function deleteTour(tourId: string, createdBy: string) {
    if (createdBy !== currentUserId) {
      Alert.alert("Error", "No eres el dueño de este tour.");
      return;
    }

    const { error } = await supabase.from("tours").delete().eq("id", tourId);
    if (error) {
      Alert.alert("Error", "No se pudo eliminar el tour.");
    } else {
      Alert.alert("Éxito", "Tour eliminado.");
      fetchTours(); // Refetch inmediato
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", "No se pudo cerrar sesión.");
    } else {
      navigation.navigate("Login");
    }
  }
  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Button
        title="Crear Tour"
        onPress={() => navigation.navigate("TourForm")}
      />
      <Button title="Cerrar Sesión" onPress={handleLogout} color="red" />

      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.cover_image && (
              <Image source={{ uri: item.cover_image }} style={styles.image} />
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text>
              {item.city} - {item.language}
            </Text>
            <Text>Duración: {item.duration} min</Text>
            <Text>Precio: {item.price} €</Text>

            <Button
              title="Ver Mapa"
              onPress={() =>
                navigation.navigate("MapaDetallado", {
                  tourId: item.id,
                  tourTitle: item.title,
                })
              }
            />
            {item.created_by === currentUserId && (
              <>
                <Button
                  title="Editar Tour"
                  onPress={() =>
                    navigation.navigate("TourForm", { tourId: item.id })
                  }
                />
                <Button
                  title="Gestionar Paradas"
                  onPress={() =>
                    navigation.navigate("EditStops", { tourId: item.id })
                  }
                />
                <Button
                  title="Eliminar"
                  onPress={() => deleteTour(item.id, item.created_by)}
                  color="red"
                />
              </>
            )}
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
  image: { width: "100%", height: 150, borderRadius: 8, marginBottom: 10 },
});
