import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { Button, useTheme, Text, Surface } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { UserInteraction } from "../types/Interactions";
import { AuthContext } from "../context/AuthContext";

interface Props {
  userInteraction: UserInteraction | null;
  onInteraction: (field: 'status' | 'feedback', value: string | null) => void;
  onAddList: () => void;
  loading: boolean;
  isTv: boolean;
}

export default function MediaActionButtons({ userInteraction, onInteraction, onAddList, loading, isTv }: Props) {
  const theme = useTheme();
  const { signed } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  if (!signed) {
    return (
      <View style={styles.container}>
        <Surface style={[styles.guestContainer, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
          <View style={styles.guestIconContainer}>
            <Icon name="account-lock-outline" size={24} color={theme.colors.onSecondaryContainer} />
          </View>

          <View style={styles.guestTextContainer}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer }}>
              Faça login para interagir
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>
              Marque como assistido, avalie e crie listas.
            </Text>
          </View>

          <Button
            mode="contained"
            compact
            onPress={() => navigation.navigate("Login")}
            style={{ marginLeft: 8 }}
          >
            Entrar
          </Button>
        </Surface>
      </View>
    );
  }

  const getButtonProps = (isActive: boolean, activeColor: string) => ({
    mode: isActive ? "contained" : "outlined" as "contained" | "outlined",
    buttonColor: isActive ? activeColor : undefined,
    textColor: isActive ? "white" : theme.colors.onSurfaceVariant,
    style: [styles.gridButton, !isActive && { borderColor: theme.colors.outline }]
  });

  const handleStatusChange = (status: string) => {
    if (userInteraction?.status === status) {
      onInteraction('status', null);
    } else {
      onInteraction('status', status);
    }
  };

  const handleFeedbackChange = (feedback: string) => {
    if (userInteraction?.feedback === feedback) {
      onInteraction('feedback', null);
    } else {
      onInteraction('feedback', feedback);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsBar}>
        <Button
          {...getButtonProps(userInteraction?.status === 'want_to_watch', '#2563eb')}
          icon={userInteraction?.status === 'want_to_watch' ? "bookmark" : "bookmark-outline"}
          onPress={() => handleStatusChange('want_to_watch')}
          loading={loading}
          style={styles.flexBtn}
        >
          {userInteraction?.status === 'want_to_watch' ? 'Na Lista' : 'Quero Ver'}
        </Button>
        <Button
          {...getButtonProps(userInteraction?.status === (isTv ? 'watching' : 'watched'), '#ea580c')}
          icon={userInteraction?.status === (isTv ? 'watching' : 'watched') ? "bookmark-check" : "bookmark-check-outline"}
          onPress={() => handleStatusChange(isTv ? 'watching' : 'watched')}
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
            onPress={() => handleStatusChange('completed')}
            style={styles.flexBtn}
          >
            {userInteraction?.status === 'completed' ? 'Finalizado' : 'Já terminei'}
          </Button>

          <Button
            {...getButtonProps(userInteraction?.feedback === 'favorite', '#eab308')}
            icon={userInteraction?.feedback === 'favorite' ? "star" : "star-outline"}
            onPress={() => handleFeedbackChange('favorite')}
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
          onPress={() => handleFeedbackChange('liked')}
          style={styles.flexBtn}
        >
          Gostei
        </Button>
        <Button
          {...getButtonProps(userInteraction?.feedback === 'not_like', '#ef4444')}
          icon="thumb-down"
          onPress={() => handleFeedbackChange('not_like')}
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

  guestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  guestIconContainer: {
    marginRight: 12,
  },
  guestTextContainer: {
    flex: 1,
  },
});