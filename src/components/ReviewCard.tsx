import React, { useState, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Review } from "../types/Review";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";

interface Props {
  review: Review;
  onDelete?: (reviewId: string) => void;
  onShare?: (review: Review) => void;
}

export default function ReviewCard({ review, onDelete, onShare }: Props) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [showSpoiler, setShowSpoiler] = useState(!review.has_spoilers);
  const [feedbackCounts, setFeedbackCounts] = useState(review.feedback_counts);
  const [userFeedback, setUserFeedback] = useState(review.user_feedback);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const isOwner = user?.id === review.user?.id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#16a34a"; // green
    if (rating >= 3.5) return "#ca8a04"; // yellow
    if (rating >= 2.5) return "#ea580c"; // orange
    return "#dc2626"; // red
  };

  const renderStars = (rating: number) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(rating) ? "star" : "star-outline"} size={12} color="#eab308" style={{ marginRight: 1 }} />
      ))}
    </View>
  );

  const handleFeedback = async (type: 'useful' | 'not_useful' | 'report') => {
    if (loadingFeedback) return;
    setLoadingFeedback(true);

    try {
      const feedbackToSend = userFeedback === type ? null : type;
      const response = await api.post(`/users/movie/review/${review.review_id}/feedback`, {
        feedback: feedbackToSend
      });

      if (response.data) {
        setUserFeedback(response.data.user_feedback);
        setFeedbackCounts(response.data.feedback_counts);
      }
    } catch (error) {
      console.log("Erro ao enviar feedback:", error);
      Alert.alert("Erro", "Não foi possível registrar sua ação.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Prepara as categorias para exibição (filtra as que tem valor 0 ou null)
  const categories = [
    { label: "Roteiro", value: review.story_rating },
    { label: "Atuação", value: review.acting_rating },
    { label: "Direção", value: review.direction_rating },
    { label: "Cinematografia", value: review.cinematography_rating },
    { label: "Trilha Sonora", value: review.soundtrack_rating },
    { label: "Efeitos Visuais", value: review.visual_effects_rating },
  ].filter(c => c.value != null && c.value > 0);

  const userName = review.user?.name || "Usuário";
  const userHandle = review.user?.username ? `@${review.user.username}` : "";
  const userAvatar = review.user?.avatar;
  const userInitial = userName.charAt(0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>

      {/* HEADER: Avatar, Nome, Data, Nota */}
      <View style={styles.header}>
        {userAvatar ? (
          <Avatar.Image size={42} source={{ uri: userAvatar }} />
        ) : (
          <Avatar.Text size={42} label={userInitial} style={{ backgroundColor: theme.colors.primary }} />
        )}

        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: theme.colors.onSurface }]}>{userName}</Text>
          <Text style={{ color: theme.colors.secondary, fontSize: 12 }}>{userHandle}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderStars(review.overall_rating)}
            <Text style={{ color: getRatingColor(review.overall_rating), fontWeight: 'bold', marginLeft: 6, fontSize: 14 }}>
              {review.overall_rating}/5
            </Text>
          </View>
          <Text style={{ color: theme.colors.secondary, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
            {formatDate(review.created_at)}
          </Text>
        </View>
      </View>

      {/* AVALIAÇÕES DETALHADAS (GRID) */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={{ fontSize: 12, color: theme.colors.secondary, marginBottom: 8 }}>Avaliações por categoria:</Text>
          <View style={styles.grid}>
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.gridItem}>
                <Text style={{ color: theme.colors.secondary, fontSize: 10, flex: 1 }}>{cat.label}:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {renderStars(cat.value || 0)}
                  <Text style={{ color: theme.colors.onSurface, fontSize: 11, marginLeft: 4, fontWeight: 'bold' }}>{cat.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CONTEÚDO (SPOILER OU TEXTO) */}
      <View style={styles.content}>
        {review.has_spoilers && !showSpoiler ? (
          <View style={[styles.spoilerBox, { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Icon name="eye-off-outline" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <View>
                <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 13 }}>Este comentário contém spoilers</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowSpoiler(true)} style={[styles.showBtn, { borderColor: '#f59e0b' }]}>
              <Icon name="eye" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: 'bold' }}>Mostrar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {review.has_spoilers && (
              <TouchableOpacity onPress={() => setShowSpoiler(false)} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.errorContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Icon name="eye-off" size={12} color={theme.colors.onErrorContainer} />
                  <Text style={{ color: theme.colors.onErrorContainer, fontSize: 10, marginLeft: 4, fontWeight: 'bold' }}>Ocultar Spoiler</Text>
                </View>
              </TouchableOpacity>
            )}
            {review.comment && (
              <Text style={[styles.comment, { color: theme.colors.onSurface }]}>
                {review.comment}
              </Text>
            )}
          </View>
        )}
      </View>

      {(feedbackCounts?.useful > 0 || feedbackCounts?.not_useful > 0 || feedbackCounts?.report > 0) && (
        <View style={styles.feedbackSummary}>
          {feedbackCounts.useful > 0 && (
            <Text style={{ fontSize: 12, color: theme.colors.secondary, marginRight: 12 }}>
              {feedbackCounts.useful} acharam útil
            </Text>
          )}
          {feedbackCounts.not_useful > 0 && (
            <Text style={{ fontSize: 12, color: theme.colors.secondary, marginRight: 12 }}>
              {feedbackCounts.not_useful} não acharam útil
            </Text>
          )}
          {feedbackCounts.report > 0 && (
            <Text style={{ fontSize: 12, color: theme.colors.secondary }}>
              {feedbackCounts.report} reportaram
            </Text>
          )}
        </View>
      )}

      {/* DIVISOR */}
      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      {/* BOTÕES DE AÇÃO */}
      <View style={styles.footer}>
        {isOwner ? (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onShare && onShare(review)}>
              <Icon name="share-variant-outline" size={18} color={theme.colors.secondary} />
              <Text style={[styles.actionText, { color: theme.colors.secondary }]}>Compartilhar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete && onDelete(review.review_id)}>
              <Icon name="trash-can-outline" size={18} color={theme.colors.error} />
              <Text style={[styles.actionText, { color: theme.colors.error }]}>Excluir</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>

              {/* BOTÃO ÚTIL (ESTILO VERDE IGUAL PRINT) */}
              <TouchableOpacity
                style={[
                  styles.feedbackBtn,
                  {
                    backgroundColor: userFeedback === 'useful' ? 'rgba(22, 163, 74, 0.15)' : theme.colors.elevation.level1,
                    borderColor: userFeedback === 'useful' ? 'transparent' : 'transparent'
                  }
                ]}
                onPress={() => handleFeedback('useful')}
                disabled={loadingFeedback}
              >
                <Icon
                  name={userFeedback === 'useful' ? "thumb-up" : "thumb-up-outline"}
                  size={16}
                  color={userFeedback === 'useful' ? '#16a34a' : theme.colors.onSurfaceVariant}
                />
                <Text style={{
                  color: userFeedback === 'useful' ? '#16a34a' : theme.colors.onSurfaceVariant,
                  fontSize: 12, marginLeft: 6, fontWeight: userFeedback === 'useful' ? 'bold' : 'normal'
                }}>
                  Útil ({feedbackCounts?.useful || 0})
                </Text>
              </TouchableOpacity>

              {/* BOTÃO NÃO ÚTIL */}
              <TouchableOpacity
                style={[
                  styles.feedbackBtn,
                  { backgroundColor: userFeedback === 'not_useful' ? 'rgba(220, 38, 38, 0.15)' : 'transparent' }
                ]}
                onPress={() => handleFeedback('not_useful')}
                disabled={loadingFeedback}
              >
                <Icon
                  name={userFeedback === 'not_useful' ? "thumb-down" : "thumb-down-outline"}
                  size={16}
                  color={userFeedback === 'not_useful' ? '#dc2626' : theme.colors.secondary}
                />
                <Text style={{
                  color: userFeedback === 'not_useful' ? '#dc2626' : theme.colors.secondary,
                  fontSize: 12, marginLeft: 6, fontWeight: userFeedback === 'not_useful' ? 'bold' : 'normal'
                }}>
                  Não útil
                </Text>
              </TouchableOpacity>
            </View>

            {/* BOTÃO REPORTAR */}
            <TouchableOpacity
              style={[styles.feedbackBtn]}
              onPress={() => handleFeedback('report')}
              disabled={loadingFeedback}
            >
              <Icon
                name={userFeedback === 'report' ? "flag" : "flag-outline"}
                size={16}
                color={userFeedback === 'report' ? '#fbbf24' : theme.colors.secondary}
              />
              <Text style={{
                color: userFeedback === 'report' ? '#fbbf24' : theme.colors.secondary,
                fontSize: 12, marginLeft: 6
              }}>
                Reportar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  headerInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontWeight: 'bold', fontSize: 15, marginBottom: 2 },

  categoriesContainer: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'space-between' },

  content: { marginTop: 4 },
  spoilerBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderRadius: 8, marginTop: 4 },
  showBtn: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  comment: { lineHeight: 22, fontSize: 14 },

  feedbackSummary: { marginTop: 12, marginBottom: 8 },

  divider: { height: 1, marginBottom: 12, opacity: 0.5 },

  footer: { flexDirection: 'row', alignItems: 'center' },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  actionText: { fontSize: 13, marginLeft: 6 }
});