import React from "react";
import { View, Image, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Movie } from "../types/Movie";
import { TvShow } from "../types/TvShow";
import { getCertificationColor, getMediaYear } from "../utils/helpers";

export type Media = Movie | TvShow;

interface Props {
  media: Media;
  style?: StyleProp<ViewStyle>;
}

export default function MediaCard({ media, style }: Props) {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const poster = media.poster_path?.tmdb
    ? "https://image.tmdb.org/t/p/w342" + media.poster_path.tmdb
    : "https://via.placeholder.com/140x210?text=No+Image";

  const year = getMediaYear(media);

  const handlePress = () => {
    if (!media.slug) return;
    if ('number_of_seasons' in media) {
      navigation.push("TvShowDetails", { slug: media.slug });
    } else {
      navigation.push("MediaDetails", { slug: media.slug });
    }
  };

  return (
    <TouchableOpacity
      style={[{ marginRight: 12, width: 140, paddingBottom: 8 }, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {media.certification && (
        <View
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            backgroundColor: getCertificationColor(media?.certification),
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 10,
          }}
        >
          <Text
            variant="labelSmall"
            style={{ color: "white", fontWeight: "bold" }}
          >
            {media?.certification}
          </Text>
        </View>
      )}
      <Image
        source={{ uri: poster }}
        style={{
          width: '100%',
          height: 210,
          borderRadius: 8,
          backgroundColor: theme.colors.surfaceVariant,
        }}
        resizeMode="cover"
      />
      <Text
        variant="bodySmall"
        numberOfLines={2}
        style={{ marginTop: 6, fontWeight: '600', color: theme.colors.onSurface }}
      >
        {media.title}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        {year && (
          <Text variant="bodySmall" style={{ color: theme.colors.secondary, marginRight: 6 }}>
            {year}
          </Text>
        )}

        <Text style={{ marginRight: 2, fontSize: 10 }}>⭐</Text>

        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
          {Number(media.rating_tmdb_average).toFixed(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}