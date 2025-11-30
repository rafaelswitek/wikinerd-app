import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Movie } from "../types/Movie";

interface Props {
  movie: Movie;
}

export default function MovieCard({ movie }: Props) {
  const poster =
    "https://image.tmdb.org/t/p/w342" + movie.poster_path?.tmdb;

  return (
    <TouchableOpacity style={{ marginRight: 12, width: 140 }}>
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
    </TouchableOpacity>
  );
}
