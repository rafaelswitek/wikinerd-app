import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ReviewStats } from "../types/Review";

interface Props {
  stats: ReviewStats;
}

export default function ReviewStatsCard({ stats }: Props) {
  const theme = useTheme();

  const total = stats.total_reviews > 0 ? stats.total_reviews : 1;
  const getPercent = (count: number) => count / total;

  const renderStars = (rating: number, size = 12) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon 
          key={i} 
          name={i <= Math.round(rating) ? "star" : "star-outline"} 
          size={size} 
          color="#eab308" 
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Icon name="star-outline" size={20} color="#eab308" style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Avaliação Geral</Text>
      </View>
      
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.bigScore, { color: '#e64a19' }]}>{stats.overall_average.toFixed(1)}</Text>
          {renderStars(stats.overall_average, 16)}
          <Text style={{ color: theme.colors.secondary, fontSize: 12, marginTop: 2 }}>de 5 estrelas</Text>
        </View>
        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
            <Icon name="account-outline" size={16} color={theme.colors.onSurfaceVariant}/>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{stats.total_reviews} avaliações</Text>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>Distribuição das Notas</Text>
      <View style={styles.barsContainer}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.rating_counts[star as keyof typeof stats.rating_counts] || 0;
          const percent = getPercent(count);
          return (
            <View key={star} style={styles.barRow}>
              <Text style={[styles.starLabel, { color: theme.colors.onSurface }]}>{star} ★</Text>
              <ProgressBar 
                progress={percent} 
                color="#3b82f6" 
                style={styles.progressBar} 
              />
              <Text style={[styles.percentLabel, { color: theme.colors.secondary }]}>{(percent * 100).toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Icon name="chart-line" size={20} color={theme.colors.onSurface} style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Avaliação por Categoria</Text>
      </View>
      
      <View style={styles.categoriesGrid}>
        {stats.category_averages.map((cat, index) => (
          <View key={index} style={styles.categoryItem}>
            <Text style={[styles.catName, { color: theme.colors.onSurface }]}>{cat.category}</Text>
            <View style={styles.catRatingRow}>
              <View style={[styles.catBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 10, color: theme.colors.onSurface }}>{cat.average.toFixed(1)}</Text>
              </View>
              {renderStars(cat.average)}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bigScore: { fontSize: 42, fontWeight: 'bold', lineHeight: 48 },
  barsContainer: { gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starLabel: { width: 24, fontSize: 12, fontWeight: 'bold' },
  percentLabel: { width: 30, fontSize: 10, textAlign: 'right' },
  progressBar: { flex: 1, height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  divider: { height: 1, marginVertical: 16 },
  categoriesGrid: { gap: 10 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 13, fontWeight: '500' },
  catRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }
});