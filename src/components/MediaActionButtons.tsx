import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { UserInteraction } from "../types/Interactions";

interface Props {
  userInteraction: UserInteraction | null;
  onInteraction: (field: 'status' | 'feedback', value: string) => void;
  onAddList: () => void;
  loading: boolean;
}

export default function MediaActionButtons({ userInteraction, onInteraction, onAddList, loading }: Props) {
  const theme = useTheme();

  const getButtonProps = (isActive: boolean, activeColor: string) => ({
    mode: isActive ? "contained" : "outlined" as "contained" | "outlined",
    buttonColor: isActive ? activeColor : undefined,
    textColor: isActive ? "white" : theme.colors.onSurfaceVariant,
    style: [styles.gridButton, !isActive && { borderColor: theme.colors.outline }]
  });

  return (
    <View style={styles.container}>
      {/* Linha 1 */}
      <View style={[styles.actionsBar, { marginTop: 16 }]}>
        <Button
          {...getButtonProps(userInteraction?.status === 'want_to_watch', theme.colors.primary)}
          icon={userInteraction?.status === 'want_to_watch' ? "bookmark" : "bookmark-outline"}
          onPress={() => onInteraction('status', 'want_to_watch')}
          loading={loading}
        >
          Quero Ver
        </Button>
        <Button 
          {...getButtonProps(userInteraction?.status === 'watched', '#0ea5e9')}
          icon="check"
          onPress={() => onInteraction('status', 'watched')}
        >
          Assistido
        </Button>
      </View>

      {/* Linha 2 */}
      <View style={[styles.actionsBar, { marginTop: 8 }]}>
        <Button 
          {...getButtonProps(userInteraction?.feedback === 'liked', '#22c55e')}
          icon="thumb-up"
          onPress={() => onInteraction('feedback', 'liked')}
        >
          Gostei
        </Button>
        <Button 
          {...getButtonProps(userInteraction?.feedback === 'not_like', '#ef4444')}
          icon="thumb-down"
          onPress={() => onInteraction('feedback', 'not_like')}
        >
          Não Gostei
        </Button>
      </View>

      {/* Linha 3 */}
      <View style={[styles.actionsBar, { marginTop: 8 }]}>
        <Button 
          {...getButtonProps(userInteraction?.feedback === 'favorite', '#eab308')}
          icon={userInteraction?.feedback === 'favorite' ? "star" : "star-outline"}
          onPress={() => onInteraction('feedback', 'favorite')}
        >
          Favorito
        </Button>
        
        <Button
          mode="outlined"
          icon="playlist-plus"
          textColor={theme.colors.onSurfaceVariant}
          style={[styles.gridButton, { borderColor: theme.colors.outline }]}
          onPress={onAddList}
        >
          Add à Lista
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  actionsBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  gridButton: { flex: 1, borderRadius: 4 },
});