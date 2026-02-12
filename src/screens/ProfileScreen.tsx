import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { supabase } from "../services/supabase";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // 1. Obtener el ID del usuario logueado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 2. BUSCAR EN TU TABLA (cambia 'profiles' por el nombre real de tu tabla si es otro)
        const { data, error } = await supabase
          .from("profiles") // <--- Pon aquí el nombre de la tabla de la foto
          .select("*")
          .eq("id", user.id) // Suponiendo que la columna del ID se llama 'id'
          .single();

        if (data) {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#5CC2A3" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {/* Leemos la columna de la URL que se ve en tu captura */}
          {profile?.profile_image ? ( // Cambia 'avatar_url' por el nombre exacto de la columna de la foto
            <Image
              source={{ uri: profile.profile_image }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.placeholderText}>
                {profile?.username?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </View>

        {/* Mostramos el nombre 'elena' que sale en tu captura */}
        <Text style={styles.userName}>{profile?.username || "Usuario"}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID Único:</Text>
          <Text style={styles.infoValue}>{profile?.id}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F9F7",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 30,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#FFF",
    backgroundColor: "#E1E8EE",
  },
  placeholderAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#5CC2A3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  placeholderText: {
    fontSize: 60,
    color: "#FFF",
    fontWeight: "900",
  },
  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 25,
  },
  infoRow: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 20,
    marginBottom: 25,
  },
  infoLabel: {
    color: "#A0A0A0",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#2D5A4C",
    fontSize: 13,
    marginTop: 5,
  },
  editBtn: {
    backgroundColor: "#5CC2A3",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 20,
    alignItems: "center",
  },
  editBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
