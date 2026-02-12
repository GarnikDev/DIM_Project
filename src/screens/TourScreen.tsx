import React, { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";

export default function ToursScreen({ navigation }: any) {
  const [tours, setTours] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        // Obtenemos el usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        // Corregimos el error de TypeScript: user?.id ?? null
        setCurrentUserId(user?.id ?? null);
        fetchTours();
      };
      init();
    }, []),
  );

  async function fetchTours() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar los tours");
    } else if (data) {
      setTours(data);
    }
    setLoading(false);
  }

  // FUNCIÓN DE LOGOUT CORREGIDA
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Error al cerrar sesión", error.message);
      } else {
        // Forzamos el salto a la pantalla de Login y limpiamos el historial
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }], // <--- VERIFICA QUE TU PANTALLA SE LLAME "Login"
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mis Aventuras</Text>
          {/* ICONO DE PERFIL */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-outline" size={22} color="#2D5A4C" />
          </TouchableOpacity>

          {/* ICONO DE LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF7675" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("TourForm")}
        >
          <Text style={styles.buttonText}>+ Nuevo Tour</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5CC2A3" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={tours}
          contentContainerStyle={{ padding: 20 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isOwner = item.created_by === currentUserId;

            return (
              <View style={styles.card}>
                {/* Renderizado de imagen simple */}
                {item.cover_image && (
                  <Image
                    source={{ uri: item.cover_image }}
                    style={styles.image}
                  />
                )}

                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{item.price}€</Text>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.tourTitle}>{item.title}</Text>
                  <Text style={styles.locationText}>
                    {item.city} · {item.duration} min
                  </Text>

                  <TouchableOpacity
                    style={styles.viewMapBtn}
                    onPress={() =>
                      navigation.navigate("MapaDetallado", {
                        tourId: item.id,
                        tourTitle: item.title,
                      })
                    }
                  >
                    <Text style={styles.viewMapBtnText}>
                      ABRIR MAPA Y AUDIO
                    </Text>
                  </TouchableOpacity>

                  {/* Lógica de botones de gestión */}
                  {isOwner && (
                    <View style={styles.ownerActionsRow}>
                      <TouchableOpacity
                        style={styles.addStopBtn}
                        onPress={() =>
                          navigation.navigate("EditStops", { tourId: item.id })
                        }
                      >
                        <Text style={styles.addStopBtnText}>
                          Gestionar Paradas
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() =>
                          navigation.navigate("TourForm", { tourId: item.id })
                        }
                      >
                        <Text style={styles.editBtnText}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F2F9F7" },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#2D5A4C" },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
  },
  logoutText: { color: "#FF7675", fontWeight: "bold" },
  createButton: {
    backgroundColor: "#5CC2A3",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 4,
  },
  image: { width: "100%", height: 180, backgroundColor: "#DDD" },
  priceBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 8,
    borderRadius: 12,
  },
  profileBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#F2F9F7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0F0E9",
  },
  priceText: { color: "#2D5A4C", fontWeight: "800" },
  infoContainer: { padding: 15 },
  tourTitle: { fontSize: 18, fontWeight: "800", color: "#2D3436" },
  locationText: { color: "#636E72", marginVertical: 5 },
  viewMapBtn: {
    backgroundColor: "#2D5A4C",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 10,
  },
  viewMapBtnText: { color: "white", fontWeight: "bold" },
  ownerActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  addStopBtn: {
    backgroundColor: "#F2F9F7",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  addStopBtnText: { color: "#5CC2A3", fontWeight: "bold" },
  editBtn: {
    backgroundColor: "#FFF9F2",
    padding: 10,
    borderRadius: 10,
    width: 80,
    alignItems: "center",
  },
  editBtnText: { color: "#E67E22", fontWeight: "bold" },
});
