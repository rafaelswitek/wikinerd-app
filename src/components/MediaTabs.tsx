import React from "react";
import { View, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import MovieList from "./MovieList";
import SeriesList from "./SeriesList";

interface Props {
  mediaType: string;
}

export default function MediaTabs({ mediaType }: Props) {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {mediaType === "movies" && (
        <>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            Filmes
          </Text>

          <MovieList
            title="Em Breve"
            endpoint="https://api.wikinerd.com.br/api/movies/upcoming"
          />

          <MovieList
            title="Em Cartaz"
            endpoint="https://api.wikinerd.com.br/api/movies/now-playing"
          />

          <MovieList
            title="Mais Avaliados"
            endpoint="https://api.wikinerd.com.br/api/movies/top-rated"
          />
        </>
      )}

      {mediaType === "tv" && (
        <>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            Séries
          </Text>

          <SeriesList
            title="Saindo Hoje"
            endpoint="https://api.wikinerd.com.br/api/tv-shows/airing-today"
          />

          <SeriesList
            title="No Ar"
            endpoint="https://api.wikinerd.com.br/api/tv-shows/on-the-air"
          />

          <SeriesList
            title="Mais Avaliadas"
            endpoint="https://api.wikinerd.com.br/api/tv-shows/top-rated"
          />
        </>
      )}

      {mediaType === "games" && (
        <Text variant="titleMedium">Jogos (em construção futura)</Text>
      )}

      {mediaType === "books" && (
        <Text variant="titleMedium">Livros (em construção futura)</Text>
      )}

      {mediaType === "others" && (
        <Text variant="titleMedium">Outras Mídias (em construção)</Text>
      )}
    </ScrollView>
  );
}
