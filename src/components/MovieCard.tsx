import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Movie } from "../types/Movie";
import { getCertificationColor } from "../utils/certificationColor";

interface Props {
  movie: Movie;
}

export default function MovieCard({ movie }: Props) {
  const poster =
    "https://image.tmdb.org/t/p/w342" + movie.poster_path?.tmdb;

  return (
    <TouchableOpacity style={{ marginRight: 12, width: 140, paddingBottom: 8 }}>
      {movie.certification && (
        <View
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            backgroundColor: getCertificationColor(movie.certification),
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
            {movie.certification}
          </Text>
        </View>
      )}
      <Image
        source={{ uri: poster }}
        style={{
          width: 140,
          height: 210,
          borderRadius: 8,
          backgroundColor: "#ddd",
        }}
      />
      <Text variant="bodySmall" numberOfLines={2} style={{ marginTop: 6 }}>
        {movie.title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        {/* Ano */}
        <Text variant="bodySmall" style={{ opacity: 0.8, marginRight: 6 }}>
          {movie.release_date?.slice(0, 4)}
        </Text>

        {/* Ícone da estrela */}
        <Text style={{ marginRight: 2 }}>⭐</Text>

        {/* Nota */}
        <Text variant="bodySmall" style={{ opacity: 0.8 }}>
          {Number(movie.rating_tmdb_average).toFixed(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
