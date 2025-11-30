import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import MovieCard from "./MovieCard";
import { api } from "../services/api";
import { Movie } from "../types/Movie";

interface Props {
  title: string;
  endpoint: string;
}

export default function MovieList({ title, endpoint }: Props) {
  const [data, setData] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get(endpoint);
        setData(response.data.data);
      } catch (error) {
        console.log("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <View style={{ marginBottom: 24 }}>
      <Text variant="titleSmall" style={{ marginBottom: 8 }}>
        {title}
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <MovieCard movie={item} />}
        />
      )}
    </View>
  );
}
