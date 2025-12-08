import React, { useState, useContext, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Dimensions, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { Text, Avatar, Button, useTheme, Surface, ProgressBar, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";
import UserReviewsModal from "../components/UserReviewsModal";

const { width } = Dimensions.get("window");

type MediaType = "movies" | "tv_shows" | "games" | "books" | "podcasts";

interface StatHighlight {
    label: string;
    value: string | number;
    icon: string;
    color: string;
}

interface ChartItem {
    name: string;
    count: number;
    color: string;
    percent: number;
}

interface TopItem {
    id: string;
    title: string;
    image: string;
    rating: string;
    year: string | number;
    rank: number;
}

interface MediaStatsData {
    highlights: StatHighlight[];
    genres: ChartItem[];
    platforms: ChartItem[];
    topItems: TopItem[];
    reviewsCount: number;
}

const CHART_COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316"
];

export default function ProfileScreen({ navigation }: any) {
    const theme = useTheme();
    const { user } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState<MediaType>("movies");
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [statsData, setStatsData] = useState<Record<MediaType, MediaStatsData> | null>(null);
    const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

    const resolveImage = (posterPath: any) => {
        if (!posterPath) return "https://via.placeholder.com/150";

        let pathObj = posterPath;

        if (typeof posterPath === 'string') {
            try {
                if (posterPath.startsWith('{') || posterPath.startsWith('[')) {
                    pathObj = JSON.parse(posterPath);
                } else {
                    return `https://image.tmdb.org/t/p/w342${posterPath}`;
                }
            } catch (e) {
                return "https://via.placeholder.com/150";
            }
        }

        if (pathObj?.tmdb) return `https://image.tmdb.org/t/p/w342${pathObj.tmdb}`;
        if (pathObj?.igdb) return `https://images.igdb.com/igdb/image/upload/t_cover_big${pathObj.igdb}`;
        if (pathObj?.skoob) return pathObj.skoob;
        if (pathObj?.spotify) return pathObj.spotify;

        return "https://via.placeholder.com/150";
    };

    const resolveRating = (item: any) => {
        if (item.rating_tmdb_average) return Number(item.rating_tmdb_average).toFixed(1);
        if (item.rating_igdb_average) return Number(item.rating_igdb_average).toFixed(1);
        if (item.rating_skoob_average) return Number(item.rating_skoob_average).toFixed(1);
        if (item.rating_spotify_average) return Number(item.rating_spotify_average).toFixed(1);
        return "-";
    };

    const resolveYear = (item: any) => {
        if (item.release_date) return item.release_date.split("-")[0];
        if (item.first_air_date) return item.first_air_date.split("-")[0];
        return "";
    };

    const processMediaStats = (
        type: MediaType,
        generalRaw: any,
        genresRaw: any[],
        platformsRaw: any[],
        topItemsRaw: any[],
        customReviewsCount?: number
    ): MediaStatsData => {
        const general = generalRaw?.[type] || {};

        let totalValue = 0;
        let timeLabel = "Horas";
        let timeIcon = "clock-outline";

        const timeArrays = general.runtime || general.playtime || general.page_count || general.duration || [];

        if (type === 'books') {
            timeLabel = "Páginas";
            timeIcon = "book-open-page-variant-outline";
            totalValue = timeArrays.reduce((acc: number, curr: any) => acc + (curr.total_pages || 0), 0);
        } else {
            const totalMinutes = timeArrays.reduce((acc: number, curr: any) =>
                acc + (curr.total_runtime || curr.total_playtime || curr.total_duration || 0), 0);
            totalValue = Math.floor(totalMinutes / 60);
        }

        const highlights: StatHighlight[] = [
            {
                label: "Ano Favorito",
                value: general.mostWatchedYear || general.mostPlayedYear || general.mostReadedYear || general.mostListenedYear || '-',
                icon: "calendar-star",
                color: "#3b82f6"
            },
            {
                label: "Sequência Atual",
                value: general.streak ? `${general.streak.current_streak} dias` : '0 dias',
                icon: "fire",
                color: "#f97316"
            },
            {
                label: "Maior Sequência",
                value: general.streak ? `${general.streak.longest_streak} dias` : '0 dias',
                icon: "trophy-outline",
                color: "#eab308"
            },
            {
                label: `Total ${timeLabel}`,
                value: type === 'books' ? totalValue : `${totalValue}h`,
                icon: timeIcon,
                color: "#10b981"
            }
        ];

        const processChart = (data: any[]) => {
            if (!data || data.length === 0) return [];
            const totalCount = Math.max(data.reduce((acc, curr) => acc + curr.count, 0), 1);

            return data
                .slice(0, 5)
                .map((item, index) => ({
                    name: item.name,
                    count: item.count,
                    percent: (item.count / totalCount) * 100,
                    color: CHART_COLORS[index % CHART_COLORS.length]
                }));
        };

        const processedTopItems = (topItemsRaw || []).slice(0, 5).map((item, index) => ({
            id: item.id,
            title: item.title,
            image: resolveImage(item.poster_path),
            rating: resolveRating(item),
            year: resolveYear(item),
            rank: index + 1
        }));

        return {
            highlights,
            genres: processChart(genresRaw),
            platforms: processChart(platformsRaw),
            topItems: processedTopItems,
            reviewsCount: customReviewsCount !== undefined ? customReviewsCount : (general.reviews_count || 0)
        };
    };

    const loadData = async () => {
        try {
            const [
                generalRes,
                genresRes,
                platformsRes,
                moviesRes,
                tvRes,
                gamesRes,
                booksRes,
                podcastsRes,
                episodeStatsRes
            ] = await Promise.all([
                api.get('/stats/general'),
                api.get('/stats/genres'),
                api.get('/stats/streaming-platforms'),
                api.get('/stats/top-movies'),
                api.get('/stats/top-tv-shows'),
                api.get('/stats/top-games'),
                api.get('/stats/top-books'),
                api.get('/stats/top-podcasts'),
                api.get('/users/episode/reviews/stats').catch(() => ({ data: { total_reviews: 0 } }))
            ]);

            const general = generalRes.data;
            const genres = genresRes.data;
            const platforms = platformsRes.data;

            setStatsData({
                movies: processMediaStats('movies', general, genres.movies, platforms.movies, moviesRes.data),
                tv_shows: processMediaStats('tv_shows', general, genres.tv_shows, platforms.tv_shows, tvRes.data, episodeStatsRes.data?.total_reviews),
                games: processMediaStats('games', general, genres.games, platforms.games, gamesRes.data),
                books: processMediaStats('books', general, genres.books, platforms.books, booksRes.data),
                podcasts: processMediaStats('podcasts', general, genres.podcasts, platforms.podcasts, podcastsRes.data),
            });

        } catch (error) {
            console.error("Falha ao carregar estatísticas:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleOpenReviews = () => {
        if (activeTab === "movies" || activeTab === "tv_shows") {
            setReviewsModalVisible(true);
        } else {
            Alert.alert("Em breve", "Histórico de reviews para esta categoria será implementado em breve.");
        }
    };

    const renderTabButton = (key: MediaType, label: string, icon: string) => {
        const isActive = activeTab === key;
        return (
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    isActive && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }
                ]}
                onPress={() => setActiveTab(key)}
            >
                <Icon name={icon} size={18} color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                <Text style={[
                    styles.tabText,
                    { color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant, fontWeight: isActive ? 'bold' : 'normal' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderHighlights = (stats: MediaStatsData) => (
        <View style={styles.highlightsGrid}>
            {stats.highlights.map((item, index) => (
                <Surface key={index} style={[styles.highlightCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Text variant="labelSmall" style={{ color: theme.colors.secondary, marginBottom: 4 }}>{item.label}</Text>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{item.value}</Text>
                    <View style={{ position: 'absolute', right: 12, top: 12, opacity: 0.1 }}>
                        <Icon name={item.icon} size={40} color={theme.colors.onSurface} />
                    </View>
                </Surface>
            ))}
        </View>
    );

    const renderChart = (title: string, data: ChartItem[]) => {
        if (!data || data.length === 0) return null;

        return (
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: 'bold', color: theme.colors.onSurface }}>{title}</Text>

                {data.map((item, index) => (
                    <View key={index} style={styles.chartRow}>
                        <View style={styles.chartLabelRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.chartDot, { backgroundColor: item.color }]} />
                                <Text variant="bodySmall" style={{ fontWeight: '500', color: theme.colors.onSurface }}>{item.name}</Text>
                            </View>
                            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.count}</Text>
                        </View>
                        <View style={styles.barBackground}>
                            <View style={[styles.barFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                        </View>
                    </View>
                ))}
            </Surface>
        );
    };

    const currentStats = statsData ? statsData[activeTab] : null;

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View style={styles.headerContainer}>
                    <View style={[styles.cover, { backgroundColor: theme.colors.primaryContainer }]} />

                    <View style={styles.profileHeader}>
                        <View style={styles.avatarWrapper}>
                            {user?.avatar ? (
                                <Avatar.Image size={90} source={{ uri: user.avatar }} style={[styles.avatarBorder, { borderColor: theme.colors.surface }]} />
                            ) : (
                                <Avatar.Text size={90} label={user?.name?.charAt(0) || "U"} style={[styles.avatarBorder, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]} />
                            )}
                            <View style={[styles.levelBadge, { backgroundColor: theme.colors.surface }]}>
                                <Icon name="trophy-variant" size={12} color="#eab308" />
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginLeft: 2, color: theme.colors.onSurface }}>Lvl 5</Text>
                            </View>
                        </View>

                        <View style={styles.userInfo}>
                            <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>{user?.name || "Visitante"}</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>@{user?.username || "usuario"}</Text>
                        </View>
                    </View>

                    <View style={styles.gamificationBar}>
                        <Surface style={[styles.gamificationCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text variant="labelMedium" style={{ fontWeight: 'bold' }}>Cinéfilo Iniciante</Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>450 / 1000 XP</Text>
                            </View>
                            <ProgressBar progress={0.45} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
                        </Surface>
                    </View>
                </View>

                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                        {renderTabButton("movies", "Filmes", "movie-open")}
                        {renderTabButton("tv_shows", "Séries", "television")}
                        {renderTabButton("games", "Jogos", "controller")}
                        {renderTabButton("books", "Livros", "book-open-page-variant")}
                        {renderTabButton("podcasts", "Podcasts", "microphone")}
                    </ScrollView>
                </View>

                {loading && !refreshing ? (
                    <View style={{ padding: 40 }}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : currentStats ? (
                    <View style={styles.contentSection}>

                        <Surface style={[styles.reviewsBanner, { backgroundColor: theme.colors.surface }]} elevation={1}>
                            <View>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Reviews Escritas</Text>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>{currentStats.reviewsCount}</Text>
                            </View>
                            <Button mode="outlined" onPress={handleOpenReviews} compact>Ver Todas</Button>
                        </Surface>

                        {renderHighlights(currentStats)}
                        {renderChart("Gêneros Favoritos", currentStats.genres)}
                        {renderChart("Plataformas Mais Usadas", currentStats.platforms)}

                        {currentStats.topItems.length > 0 && (
                            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                                        {activeTab === 'movies' ? 'Filmes' : activeTab === 'tv_shows' ? 'Séries' : activeTab === 'games' ? 'Jogos' : activeTab === 'books' ? 'Livros' : 'Podcasts'} mais bem avaliados
                                    </Text>
                                    <Icon name="trophy" size={20} color="#eab308" />
                                </View>

                                {currentStats.topItems.map((item, index) => (
                                    <View key={item.id}>
                                        {index > 0 && <Divider style={{ marginVertical: 12 }} />}
                                        <TouchableOpacity style={styles.topItemRow} activeOpacity={0.7}>
                                            <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : theme.colors.primaryContainer }]}>
                                                <Text style={{ fontWeight: 'bold', color: index < 3 ? 'white' : theme.colors.onPrimaryContainer, fontSize: 12 }}>{item.rank}</Text>
                                            </View>

                                            <Image source={{ uri: item.image }} style={styles.topItemImage} resizeMode="cover" />

                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }} numberOfLines={1}>{item.title}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.year}</Text>
                                            </View>

                                            <View style={styles.ratingBox}>
                                                <Icon name="star" size={14} color="#eab308" />
                                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.onSurface, marginLeft: 4 }}>{item.rating}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </Surface>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Icon name="database-off" size={48} color={theme.colors.outline} />
                        <Text style={{ marginTop: 12, color: theme.colors.secondary }}>Nenhuma estatística encontrada.</Text>
                    </View>
                )}
            </ScrollView>

            <UserReviewsModal
                visible={reviewsModalVisible}
                onDismiss={() => setReviewsModalVisible(false)}
                mediaType={activeTab}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { marginBottom: 12 },
    cover: { height: 100, width: '100%' },
    profileHeader: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', marginTop: -40 },
    avatarWrapper: { position: 'relative' },
    avatarBorder: { borderWidth: 4 },
    levelBadge: { position: 'absolute', bottom: 0, right: -4, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, elevation: 2 },
    userInfo: { marginLeft: 16, paddingBottom: 0, flex: 1, paddingTop: 45 },
    gamificationBar: { paddingHorizontal: 16, marginTop: 16 },
    gamificationCard: { padding: 12, borderRadius: 12 },

    tabsContainer: { marginBottom: 16 },
    tabsContent: { paddingHorizontal: 16, gap: 10 },
    tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
    tabText: { marginLeft: 6, fontSize: 13 },

    contentSection: { paddingHorizontal: 16 },
    reviewsBanner: { padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    highlightCard: { width: (width - 44) / 2, padding: 16, borderRadius: 12, minHeight: 100, justifyContent: 'center' },

    card: { padding: 16, borderRadius: 12, marginBottom: 16 },

    chartRow: { marginBottom: 12 },
    chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    chartDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    barBackground: { height: 6, backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    topItemRow: { flexDirection: 'row', alignItems: 'center' },
    rankBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    topItemImage: { width: 40, height: 60, borderRadius: 4, backgroundColor: '#ccc' },
    ratingBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(128,128,128,0.1)' },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
});