import React, { useState, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, Avatar, Button, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Review } from "../types/Review";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";

interface Props {
  review: Review;
  onDelete?: (reviewId: string) => void;
  onShare?: (review: Review) => void; // Nova prop
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

  const renderStars = (rating: number, max = 5) => (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name={i < Math.round(rating) ? "star" : "star-outline"} size={10} color="#eab308" />
      ))}
    </View>
  );

  const handleFeedback = async (type: 'useful' | 'not_useful' | 'report') => {
    if (loadingFeedback) return;
    setLoadingFeedback(true);

    try {
      const response = await api.post(`/users/movie/review/${review.review_id}/feedback`, {
        feedback: type
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

  const categories = [
    { label: "Roteiro", value: review.story_rating },
    { label: "Atuação", value: review.acting_rating },
    { label: "Direção", value: review.direction_rating },
    { label: "Cinematografia", value: review.cinematography_rating },
    { label: "Trilha Sonora", value: review.soundtrack_rating },
    { label: "Efeitos Visuais", value: review.visual_effects_rating },
  ].filter(c => c.value != null);

  const userName = review.user?.name || "Usuário";
  const userHandle = review.user?.username ? `@${review.user.username}` : "";
  const userAvatar = review.user?.avatar;
  const userInitial = userName.charAt(0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      
      <View style={styles.header}>
        {userAvatar ? (
          <Avatar.Image size={40} source={{ uri: userAvatar }} />
        ) : (
          <Avatar.Text size={40} label={userInitial} style={{ backgroundColor: theme.colors.primary }} />
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: theme.colors.onSurface }]}>{userName}</Text>
          <Text style={{ color: theme.colors.secondary, fontSize: 12 }}>{userHandle}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderStars(review.overall_rating)}
            <Text style={{ color: '#eab308', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>
                {review.overall_rating}/5
            </Text>
          </View>
          <Text style={{ color: theme.colors.secondary, fontSize: 10, marginTop: 2 }}>
            {formatDate(review.created_at)}
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 12, marginBottom: 8, fontSize: 12, color: theme.colors.secondary }}>
        Avaliações por categoria:
      </Text>
      
      <View style={styles.grid}>
        {categories.map((cat, idx) => (
          <View key={idx} style={styles.gridItem}>
            <Text style={{ color: theme.colors.secondary, fontSize: 11, marginRight: 4, flex: 1 }}>{cat.label}:</Text>
            {renderStars(cat.value || 0)}
            <Text style={{ color: theme.colors.onSurface, fontSize: 11, marginLeft: 4, fontWeight: 'bold' }}>{cat.value}</Text>
          </View>
        ))}
      </View>

      {review.has_spoilers && !showSpoiler ? (
        <View style={[styles.spoilerBox, { borderColor: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.05)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Icon name="eye-off-outline" size={16} color="#eab308" style={{ marginRight: 8 }} />
            <Text style={{ color: '#eab308', fontWeight: 'bold', fontSize: 12 }}>Este comentário contém spoilers</Text>
          </View>
          <Button 
            mode="outlined" 
            onPress={() => setShowSpoiler(true)} 
            textColor="#eab308" 
            style={{ borderColor: '#eab308', height: 32 }} 
            labelStyle={{ fontSize: 10, marginVertical: 4 }}
            icon="eye"
          >
            Mostrar
          </Button>
        </View>
      ) : (
        <Text style={[styles.comment, { color: theme.colors.onSurface }]}>
          {review.comment || "Sem comentário escrito."}
        </Text>
      )}

      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
      
      <View style={styles.footer}>
        {isOwner ? (
          <>
            {/* AÇÃO DE COMPARTILHAR CONECTADA AQUI */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => onShare && onShare(review)}>
                <Icon name="share-variant-outline" size={16} color={theme.colors.secondary} />
                <Text style={{ color: theme.colors.secondary, fontSize: 12, marginLeft: 4 }}>Compartilhar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete && onDelete(review.review_id)}>
                <Icon name="trash-can-outline" size={16} color={theme.colors.error} />
                <Text style={{ color: theme.colors.error, fontSize: 12, marginLeft: 4 }}>Excluir</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleFeedback('useful')}
              disabled={loadingFeedback}
            >
                <Icon 
                  name={userFeedback === 'useful' ? "thumb-up" : "thumb-up-outline"} 
                  size={16} 
                  color={userFeedback === 'useful' ? theme.colors.primary : theme.colors.secondary} 
                />
                <Text style={{ 
                  color: userFeedback === 'useful' ? theme.colors.primary : theme.colors.secondary, 
                  fontSize: 12, marginLeft: 4 
                }}>
                  Útil ({feedbackCounts?.useful || 0})
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleFeedback('not_useful')}
              disabled={loadingFeedback}
            >
                <Icon 
                  name={userFeedback === 'not_useful' ? "thumb-down" : "thumb-down-outline"} 
                  size={16} 
                  color={userFeedback === 'not_useful' ? theme.colors.error : theme.colors.secondary} 
                />
                <Text style={{ 
                  color: userFeedback === 'not_useful' ? theme.colors.error : theme.colors.secondary, 
                  fontSize: 12, marginLeft: 4 
                }}>
                  Não útil ({feedbackCounts?.not_useful || 0})
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn} 
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
                  fontSize: 12, marginLeft: 4 
                }}>
                  Reportar
                </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  name: { fontWeight: 'bold', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  gridItem: { width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingRight: 8 },
  spoilerBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderRadius: 4, marginTop: 8, justifyContent: 'space-between' },
  comment: { marginTop: 8, lineHeight: 20, fontSize: 14 },
  divider: { height: 1, marginVertical: 12 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' }
});