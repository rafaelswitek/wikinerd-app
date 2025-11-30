import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Movie } from "../types/Movie";
import { TvShow } from "../types/TvShow";
import { getCertificationColor, getMediaYear } from "../utils/helpers";

export type Media = Movie | TvShow;

interface Props {
  media: Media;
}

export default function MediaCard({ media }: Props) {
  const poster =
    "https://image.tmdb.org/t/p/w342" + media.poster_path?.tmdb;

  const year = getMediaYear(media);

  return (
    <TouchableOpacity style={{ marginRight: 12, width: 140, paddingBottom: 8 }}>
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
          width: 140,
          height: 210,
          borderRadius: 8,
          backgroundColor: "#ccc",
        }}
      />
      <Text variant="bodySmall" numberOfLines={2} style={{ marginTop: 6 }}>
        {media.title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        {year && (
          <Text variant="bodySmall" style={{ opacity: 0.8, marginRight: 6 }}>
            {year}
          </Text>
        )}

        <Text style={{ marginRight: 2 }}>⭐</Text>

        <Text variant="bodySmall" style={{ opacity: 0.8 }}>
          {Number(media.rating_tmdb_average).toFixed(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}