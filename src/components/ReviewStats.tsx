import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ReviewStats, RatingCounts } from "../types/Review";

interface Props {
  stats: ReviewStats;
}

export default function ReviewStatsCard({ stats }: Props) {
  const theme = useTheme();

  const total = stats.total_reviews > 0 ? stats.total_reviews : 1;
  const getPercent = (count: number) => count / total;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#16a34a";
    if (rating >= 3.5) return "#ca8a04";
    if (rating >= 2.5) return "#ea580c";
    return "#dc2626";
  };

  const renderStars = (rating: number, size = 12) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          color={i <= Math.round(rating) ? "#eab308" : theme.colors.surfaceDisabled}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );

  const CustomProgressBar = ({ percent }: { percent: number }) => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressFill, { width: `${percent * 100}%` }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Icon name="star-outline" size={20} color="#eab308" style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Avaliação Geral</Text>
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.bigScore, { color: getRatingColor(stats.overall_average) }]}>
            {stats.overall_average.toFixed(1)}
          </Text>
          <View style={{ marginTop: 4 }}>
            {renderStars(stats.overall_average, 16)}
          </View>
          <Text style={{ color: theme.colors.secondary, fontSize: 12, marginTop: 4 }}>de 5 estrelas</Text>
        </View>
        <View style={{ justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="account-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>{stats.total_reviews} avaliações</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>Distribuição das Notas</Text>
      <View style={styles.barsContainer}>
        {[5, 4, 3, 2, 1].map((star) => {
          const key = String(star) as keyof RatingCounts;
          const count = stats.rating_counts[key] || 0;
          const percent = getPercent(count);

          return (
            <View key={star} style={styles.barRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: 28 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.onSurface, marginRight: 2 }}>{star}</Text>
                <Icon name="star" size={10} color="#eab308" />
              </View>

              <CustomProgressBar percent={percent} />

              <Text style={[styles.percentLabel, { color: theme.colors.secondary }]}>{(percent * 100).toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Icon name="chart-line" size={20} color={theme.colors.onSurface} style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Avaliação por Categoria</Text>
      </View>

      <View style={styles.categoriesGrid}>
        {stats.category_averages.map((cat, index) => (
          <View key={index} style={styles.categoryItem}>
            <Text style={[styles.catName, { color: theme.colors.onSurface }]}>{cat.category}</Text>
            <View style={styles.catRatingRow}>
              <View style={[styles.catBadge, { backgroundColor: theme.colors.elevation.level2 }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 11, color: getRatingColor(cat.average) }}>
                  {cat.average.toFixed(1)}
                </Text>
              </View>
              {renderStars(cat.average, 12)}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  bigScore: { fontSize: 42, fontWeight: '900', lineHeight: 42 },
  barsContainer: { gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressContainer: { flex: 1, height: 8, backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  percentLabel: { width: 35, fontSize: 11, textAlign: 'right' },
  divider: { height: 1, marginVertical: 20, opacity: 0.5 },
  categoriesGrid: { gap: 12 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 13, fontWeight: '500' },
  catRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, minWidth: 36, alignItems: 'center' }
});