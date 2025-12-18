import React, { useState, useContext, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { Text, Button } from "react-native-paper";
import { Movie } from "../types/Movie";
import { TvShow } from "../types/TvShow";
import MediaCard from "./MediaCard";
import MediaList from "./MediaList";
import UserWatchlist from "./UserWatchlist";
import { AuthContext } from "../context/AuthContext";

const renderMovieCard = (item: Movie) => <MediaCard media={item} />;
const renderTvShowCard = (item: TvShow) => <MediaCard media={item} />;

interface Props {
  mediaType: string;
}

export default function MediaTabs({ mediaType }: Props) {
  const { signed } = useContext(AuthContext);
  const [showWatchlist, setShowWatchlist] = useState(signed);

  useEffect(() => {
    setShowWatchlist(signed);
  }, [signed]);

  if (mediaType === "movies") {
    const renderExploreContent = () => (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <MediaList<Movie>
          title="Em Breve"
          endpoint="https://api.wikinerd.com.br/api/movies/upcoming"
          renderItem={renderMovieCard}
        />

        <MediaList<Movie>
          title="Em Cartaz"
          endpoint="https://api.wikinerd.com.br/api/movies/now-playing"
          renderItem={renderMovieCard}
        />

        <MediaList<Movie>
          title="Mais Avaliados"
          endpoint="https://api.wikinerd.com.br/api/movies/top-rated"
          renderItem={renderMovieCard}
        />
      </ScrollView>
    );

    if (!signed) {
      return (
        <View style={{ flex: 1 }}>
          {renderExploreContent()}
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', gap: 10 }}>
          <Button
            mode={!showWatchlist ? "contained" : "outlined"}
            onPress={() => setShowWatchlist(false)}
            style={{ flex: 1 }}
          >
            Explorar
          </Button>
          <Button
            mode={showWatchlist ? "contained" : "outlined"}
            onPress={() => setShowWatchlist(true)}
            style={{ flex: 1 }}
          >
            Quero Ver
          </Button>
        </View>

        {showWatchlist ? (
          <UserWatchlist />
        ) : (
          renderExploreContent()
        )}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {mediaType === "tv" && (
        <>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            Séries
          </Text>

          <MediaList<TvShow>
            title="Saindo Hoje"
            endpoint="https://api.wikinerd.com.br/api/tv-shows/airing-today"
            renderItem={renderTvShowCard}
          />

          <MediaList<TvShow>
            title="No Ar"
            endpoint="https://api.wikinerd.com.br/api/tv-shows/on-the-air"
            renderItem={renderTvShowCard}
          />

          <MediaList<TvShow>
            title="Mais Avaliadas"
            endpoint="https://api.wikinerd.com.br/api/tv-shows/top-rated"
            renderItem={renderTvShowCard}
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