import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import SeriesCard from "./SeriesCard";
import { api } from "../services/api";
import { Series } from "../types/Series";

interface Props {
  title: string;
  endpoint: string;
}

export default function SeriesList({ title, endpoint }: Props) {
  const [data, setData] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchSeries = async (pageParam: number) => {
    const response = await api.get(`${endpoint}?page=${pageParam}`);
    return response.data.data;
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    const nextPage = page + 1;
    const result = await fetchSeries(nextPage);

    if (result.length === 0) {
      setHasMore(false);
    } else {
      setData((prev) => [...prev, ...result]);
      setPage(nextPage);
    }

    setIsLoadingMore(false);
  };

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchSeries(1);
        setData(result);
      } catch (error) {
        console.log("Erro ao carregar séries:", error);
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
          keyExtractor={(item, index) => `${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <SeriesCard serie={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator size="small" /> : null
          }
        />
      )}
    </View>
  );
}
