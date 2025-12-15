import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { UserInteraction } from "../types/Interactions";

interface Props {
  userInteraction: UserInteraction | null;
  onInteraction: (field: 'status' | 'feedback', value: string) => void;
  onAddList: () => void;
  loading: boolean;
  isTv: boolean;
}

export default function MediaActionButtons({ userInteraction, onInteraction, onAddList, loading, isTv }: Props) {
  const theme = useTheme();

  const getButtonProps = (isActive: boolean, activeColor: string) => ({
    mode: isActive ? "contained" : "outlined" as "contained" | "outlined",
    buttonColor: isActive ? activeColor : undefined,
    textColor: isActive ? "white" : theme.colors.onSurfaceVariant,
    style: [styles.gridButton, !isActive && { borderColor: theme.colors.outline }]
  });

  return (
    <View style={styles.container}>
      <View style={styles.actionsBar}>
        <Button
          {...getButtonProps(userInteraction?.status === 'want_to_watch', '#2563eb')}
          icon={userInteraction?.status === 'want_to_watch' ? "bookmark" : "bookmark-outline"}
          onPress={() => onInteraction('status', 'want_to_watch')}
          loading={loading}
          style={styles.flexBtn}
        >
          {userInteraction?.status === 'want_to_watch' ? 'Na Lista' : 'Quero Ver'}
        </Button>
        <Button
          {...getButtonProps(userInteraction?.status === (isTv ? 'watching' : 'watched'), '#ea580c')}
          icon={userInteraction?.status === (isTv ? 'watching' : 'watched') ? "bookmark-check" : "bookmark-check-outline"}
          onPress={() => onInteraction('status', (isTv ? 'watching' : 'watched'))}
          style={styles.flexBtn}
        >
          {isTv
            ? (userInteraction?.status === 'watching' ? 'Assistindo' : 'Tô Assistindo')
            : (userInteraction?.status === 'watched' ? 'Assistido' : 'Já Vi')
          }
        </Button>
      </View>

      {isTv && (
        <View style={[styles.actionsBar, { marginTop: 8 }]}>
          <Button
            {...getButtonProps(userInteraction?.status === 'completed', '#0ea5e9')}
            icon={userInteraction?.status === 'completed' ? "bookmark-check" : "bookmark-check-outline"}
            onPress={() => onInteraction('status', 'completed')}
            style={styles.flexBtn}
          >
            {userInteraction?.status === 'completed' ? 'Finalizado' : 'Já terminei'}
          </Button>

          <Button
            {...getButtonProps(userInteraction?.feedback === 'favorite', '#eab308')}
            icon={userInteraction?.feedback === 'favorite' ? "star" : "star-outline"}
            onPress={() => onInteraction('feedback', 'favorite')}
            style={isTv ? styles.fullBtn : styles.flexBtn}
          >
            Favorito
          </Button>
        </View>
      )}

      <View style={[styles.actionsBar, { marginTop: 8 }]}>
        <Button
          {...getButtonProps(userInteraction?.feedback === 'liked', '#22c55e')}
          icon="thumb-up"
          onPress={() => onInteraction('feedback', 'liked')}
          style={styles.flexBtn}
        >
          Gostei
        </Button>
        <Button
          {...getButtonProps(userInteraction?.feedback === 'not_like', '#ef4444')}
          icon="thumb-down"
          onPress={() => onInteraction('feedback', 'not_like')}
          style={styles.flexBtn}
        >
          Não Gostei
        </Button>
      </View>

      <View style={[styles.actionsBar, { marginTop: 8 }]}>
        <Button
          mode="outlined"
          icon="playlist-plus"
          textColor={theme.colors.onSurfaceVariant}
          style={[styles.flexBtn, { borderColor: theme.colors.outline }]}
          onPress={onAddList}
        >
          Add à Lista
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  flexBtn: {
    flex: 1,
    marginHorizontal: 0,
  },
  fullBtn: {
    flex: 1,
  },
  gridButton: { flex: 1, borderRadius: 4 },
});