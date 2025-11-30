import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { api } from "../services/api";

interface CommonItem {
  id: string;
}

interface Props<T extends CommonItem> {
  title: string;
  endpoint: string;
  renderItem: (item: T) => React.ReactElement; 
}

export default function MediaList<T extends CommonItem>({ title, endpoint, renderItem }: Props<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchMedia = async (pageParam: number): Promise<T[]> => {
    const response = await api.get(`${endpoint}?page=${pageParam}`);
    return response.data.data;
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    const nextPage = page + 1;
    const result = await fetchMedia(nextPage);

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
        const result = await fetchMedia(1);
        setData(result);
      } catch (error) {
        console.log(`Erro ao carregar ${title}:`, error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [endpoint, title]);

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
          renderItem={({ item }) => renderItem(item)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" />
            ) : null
          }
        />
      )}
    </View>
  );
}