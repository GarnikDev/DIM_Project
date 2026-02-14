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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
  created_by: string;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Tours">;
};

export default function ToursScreen({ navigation }: Props) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const drawerNavigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);
        await fetchTours();
      };
      init();
    }, [])
  );

  async function fetchTours() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tours")
      .select("id, title, city, language, cover_image, duration, price, created_by")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar los tours: " + error.message);
    } else if (data) {
      setTours(data);
    }
    setLoading(false);
  }

  // ────────────────────────────────────────────────
  // FUNCIÓN PARA ELIMINAR TOUR (nueva)
  // ────────────────────────────────────────────────
  const deleteTour = (tourId: string, tourTitle: string) => {
    Alert.alert(
      "Eliminar Tour",
      `¿Estás seguro de que deseas eliminar "${tourTitle}"?\nEsta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("tours")
                .delete()
                .eq("id", tourId);

              if (error) throw error;

              Alert.alert("Éxito", "El tour ha sido eliminado correctamente.");
              fetchTours(); // Refrescar la lista inmediatamente
            } catch (err: any) {
              console.error("Error al eliminar tour:", err);
              Alert.alert("Error", err.message || "No se pudo eliminar el tour. Intenta de nuevo.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error al cerrar sesión", error.message);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const openChatDrawer = () => {
    drawerNavigation.getParent()?.openDrawer();
  };

  const renderTour = ({ item }: { item: Tour }) => {
    const isOwner = item.created_by === currentUserId;

    return (
      <View style={styles.card}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{item.price}€</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.tourTitle}>{item.title}</Text>
          <Text style={styles.locationText}>
            {item.city} · {item.duration} min · {item.language || "Español"}
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
            <Text style={styles.viewMapBtnText}>ABRIR MAPA Y AUDIO</Text>
          </TouchableOpacity>

          {isOwner && (
            <View style={styles.ownerActionsRow}>
              <TouchableOpacity
                style={styles.addStopBtn}
                onPress={() => navigation.navigate("EditStops", { tourId: item.id })}
              >
                <Text style={styles.addStopBtnText}>+ Parada</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate("TourForm", { tourId: item.id })}
              >
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>

              {/* NUEVO BOTÓN DE ELIMINAR */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteTour(item.id, item.title)}
              >
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mis Aventuras</Text>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons name="person-outline" size={24} color="#2D5A4C" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF7675" />
            </TouchableOpacity>
          </View>
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
      ) : tours.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no tienes aventuras creadas</Text>
        </View>
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(item) => item.id}
          renderItem={renderTour}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity style={styles.chatButton} onPress={openChatDrawer}>
        <Text style={styles.chatButtonText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F2F9F7" },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2D5A4C",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#F2F9F7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0F0E9",
  },
  createButton: {
    backgroundColor: "#5CC2A3",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#5CC2A3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#E8F3F1",
  },
  priceBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
  },
  priceText: {
    color: "#2D5A4C",
    fontWeight: "800",
    fontSize: 16,
  },
  infoContainer: {
    padding: 16,
  },
  tourTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 6,
  },
  locationText: {
    color: "#636E72",
    fontSize: 15,
    marginBottom: 12,
  },
  viewMapBtn: {
    backgroundColor: "#2D5A4C",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 8,
  },
  viewMapBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  ownerActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F9F6",
    gap: 8,
  },
  addStopBtn: {
    flex: 1,
    backgroundColor: "#F2F9F7",
    paddingVertical: 14,          // ↑ more vertical padding
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",     // ← ensures vertical centering
    minHeight: 52,                // better touch target
  },
  addStopBtnText: {
    color: "#5CC2A3",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",          // ← explicit centering (good practice)
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#FFF9F2",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  editBtnText: {
    color: "#E67E22",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#FFF0F0",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  deleteBtnText: {
    color: "#FF7675",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  chatButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    backgroundColor: "#5CC2A3",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  chatButtonText: {
    fontSize: 28,
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#8DA39E",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});