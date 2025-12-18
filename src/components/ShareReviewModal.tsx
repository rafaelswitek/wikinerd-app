import React, { useRef } from "react";
import { View, StyleSheet, Image, Alert, ScrollView, Dimensions } from "react-native";
import { Modal, Portal, Text, Button, useTheme, IconButton } from "react-native-paper";
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Review } from "../types/Review";

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  subtitle: string;
  image: string;
  review: Review;
}

export default function ShareReviewModal({ visible, onDismiss, title, subtitle, image, review }: Props) {
  const theme = useTheme();
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar Avaliação do WikiNerd',
          UTI: 'public.png'
        });
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar a imagem para compartilhamento.");
      console.error(error);
    }
  };

  const categories = [
    { label: "Roteiro", value: review.story_rating },
    { label: "Atuação", value: review.acting_rating },
    { label: "Direção", value: review.direction_rating },
    { label: "Cinematografia", value: review.cinematography_rating },
    { label: "Trilha Sonora", value: review.soundtrack_rating },
    { label: "Efeitos Visuais", value: review.visual_effects_rating },
  ].filter(c => c.value != null);

  const renderStars = (rating: number) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name={i <= rating ? "star" : "star-outline"} size={14} color="#eab308" />
      ))}
    </View>
  );

  const userName = review.user?.name || "Usuário";
  const userHandle = review.user?.username ? `@${review.user.username}` : "";
  const userAvatar = review.user?.avatar;
  const userInitial = userName.charAt(0);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>

        {/* Header Fixo */}
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Compartilhar Avaliação</Text>
          <IconButton icon="close" onPress={onDismiss} iconColor={theme.colors.onSurface} />
        </View>

        {/* Conteúdo Rolável */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Área de Preview (O que será gerado) */}
          <View style={styles.previewContainer}>
            <Text style={{ marginBottom: 12, color: theme.colors.secondary, fontSize: 12 }}>Preview da Imagem</Text>

            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={styles.captureArea}>
              {/* CARD DO VISUAL (Estilo Instagram Stories) */}
              <View style={styles.card}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={styles.movieTitle}>{title}</Text>
                  <Text style={styles.movieYear}>{subtitle}</Text>
                </View>

                <Image
                  source={{ uri: image }}
                  style={styles.poster}
                />
                <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => <Icon key={i} name={i <= review.overall_rating ? "star" : "star-outline"} size={24} color="#eab308" />)}
                </View>
                <Text style={styles.bigScore}>{review.overall_rating}/5</Text>

                {/* Lista de Categorias (Renderiza todas disponíveis) */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsTitle}>AVALIAÇÃO DETALHADA</Text>
                  {categories.map((cat, idx) => (
                    <View key={idx} style={styles.catRow}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      {renderStars(cat.value || 0)}
                    </View>
                  ))}
                </View>

                {review.comment && (
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>"{review.comment.length > 100 ? review.comment.substring(0, 100) + '...' : review.comment}"</Text>
                  </View>
                )}

                <View style={styles.footerUser}>
                  {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#6200ee', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>{userInitial}</Text>
                    </View>
                  )}
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.userHandle}>{userHandle}</Text>
                  </View>
                </View>

                <View style={styles.brandBadge}>
                  <Text style={styles.brandText}>WIKINERD</Text>
                </View>
              </View>
            </ViewShot>
          </View>

          <View style={styles.actionsContainer}>
            <Text style={{ marginBottom: 16, color: theme.colors.onSurface, textAlign: 'center' }}>Compartilhar em:</Text>

            <Button mode="contained" icon="share-variant" style={styles.actionBtn} onPress={handleShare} buttonColor={theme.colors.primary}>Compartilhar</Button>

          </View>

        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 12, height: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  previewContainer: { alignItems: 'center', marginBottom: 24 },
  captureArea: { backgroundColor: 'transparent' },
  card: {
    width: 300,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  movieTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', textAlign: 'center', lineHeight: 24 },
  movieYear: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 12 },
  poster: { width: 140, height: 210, borderRadius: 8, backgroundColor: '#e2e8f0' },
  bigScore: { fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginVertical: 8 },
  detailsBox: { width: '100%', backgroundColor: 'white', padding: 12, borderRadius: 8, marginTop: 8 },
  detailsTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catLabel: { fontSize: 11, color: '#334155', fontWeight: '600' },
  commentBox: { marginTop: 16, backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, width: '100%' },
  commentText: { fontStyle: 'italic', color: '#475569', fontSize: 12, textAlign: 'center' },
  footerUser: { flexDirection: 'row', alignItems: 'center', marginTop: 24, alignSelf: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  userName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  userHandle: { fontSize: 10, color: '#64748b' },
  brandBadge: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  brandText: { color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  actionsContainer: { width: '100%', alignItems: 'stretch' },
  actionBtn: { marginBottom: 12 },
  hintText: { fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }
});