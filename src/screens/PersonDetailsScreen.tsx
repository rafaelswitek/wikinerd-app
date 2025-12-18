// src/screens/PersonDetailsScreen.tsx

import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Image, Dimensions, TouchableOpacity, FlatList } from "react-native";
import { Text, useTheme, ActivityIndicator, Chip, Divider, SegmentedButtons } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { api } from "../services/api";
import { Person, PersonCredit } from "../types/Person";

const { width } = Dimensions.get("window");

export default function PersonDetailsScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const theme = useTheme();

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [movieCast, setMovieCast] = useState<PersonCredit[]>([]);
  const [movieCrew, setMovieCrew] = useState<PersonCredit[]>([]);
  const [tvCast, setTvCast] = useState<PersonCredit[]>([]);
  const [tvCrew, setTvCrew] = useState<PersonCredit[]>([]);

  const [tab, setTab] = useState('acting'); // acting | production

  useEffect(() => {
    async function loadPerson() {
      try {
        setLoading(true);
        const res = await api.get(`/people/${slug}`);
        const data = res.data;
        setPerson(data);

        const promises = [];
        if (data.has_movie_cast) promises.push(api.get(`/people/${data.id}/movies/cast`).then(r => setMovieCast(r.data)));
        if (data.has_movie_crew) promises.push(api.get(`/people/${data.id}/movies/crew`).then(r => setMovieCrew(r.data)));
        if (data.has_tv_show_cast) promises.push(api.get(`/people/${data.id}/tv-shows/cast`).then(r => setTvCast(r.data)));
        if (data.has_tv_show_crew) promises.push(api.get(`/people/${data.id}/tv-shows/crew`).then(r => setTvCrew(r.data)));

        await Promise.all(promises);
      } catch (error) {
        console.error("Erro ao carregar pessoa", error);
      } finally {
        setLoading(false);
      }
    }
    loadPerson();
  }, [slug]);

  const formatDate = (date?: string) => {
    if (!date) return null;
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const getAge = (birthday?: string, deathday?: string) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const renderCreditItem = ({ item, isMovie }: { item: PersonCredit, isMovie: boolean }) => {
    const imgUrl = item.poster_path?.tmdb 
      ? `https://image.tmdb.org/t/p/w154${item.poster_path.tmdb}` 
      : "https://via.placeholder.com/100x150?text=No+Img";
    
    return (
      <TouchableOpacity 
        style={styles.creditItem}
        onPress={() => navigation.push("MediaDetails", { slug: item.slug, title: item.title })}
      >
        <Image source={{ uri: imgUrl }} style={styles.creditImage} />
        <Text style={styles.creditTitle} numberOfLines={2}>{item.title || item.name}</Text>
        <Text style={[styles.creditRole, { color: theme.colors.secondary }]} numberOfLines={1}>
          {item.character || item.job || item.department}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!person) return null;

  const age = getAge(person.birthday, person.deathday);
  const imageUrl = person.profile_path?.tmdb 
    ? `https://image.tmdb.org/t/p/h632${person.profile_path.tmdb}`
    : "https://via.placeholder.com/300x450?text=No+Image";

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Image source={{ uri: imageUrl }} style={styles.profileImage} resizeMode="cover" />
        <View style={styles.headerInfo}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>{person.name}</Text>
          
          <View style={styles.badges}>
            <Chip style={styles.chip} textStyle={{ fontSize: 10 }}>{person.known_for_department}</Chip>
            {person.place_of_birth && (
               <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, flex: 1 }}>
                  <Icon name="map-marker" size={14} color={theme.colors.secondary} />
                  <Text style={{ fontSize: 12, color: theme.colors.secondary, marginLeft: 2 }} numberOfLines={1}>
                    {person.place_of_birth}
                  </Text>
               </View>
            )}
          </View>

          <View style={{ marginTop: 8 }}>
             {person.birthday && (
               <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
                 Nascimento: {formatDate(person.birthday)} {age !== null && !person.deathday ? `(${age} anos)` : ''}
               </Text>
             )}
             {person.deathday && (
               <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
                 Falecimento: {formatDate(person.deathday)} {age !== null ? `(${age} anos)` : ''}
               </Text>
             )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>Biografia</Text>
        <Text style={{ lineHeight: 22, color: theme.colors.onSurfaceVariant }}>
          {person.biography || "Biografia não disponível."}
        </Text>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      <View style={styles.section}>
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.onBackground }}>Filmografia</Text>

        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'acting', label: 'Atuação' },
            { value: 'production', label: 'Produção' },
          ]}
          style={{ marginBottom: 16 }}
        />

        {tab === 'acting' ? (
          <>
            {movieCast.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.subTitle, { color: theme.colors.onSurface }]}>Filmes ({movieCast.length})</Text>
                <FlatList 
                  data={movieCast}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={(props) => renderCreditItem({ ...props, isMovie: true })}
                  keyExtractor={item => item.id}
                />
              </View>
            )}
            
            {tvCast.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.subTitle, { color: theme.colors.onSurface }]}>Séries ({tvCast.length})</Text>
                <FlatList 
                  data={tvCast}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={(props) => renderCreditItem({ ...props, isMovie: false })}
                  keyExtractor={item => item.id}
                />
              </View>
            )}
            {movieCast.length === 0 && tvCast.length === 0 && (
                <Text style={{textAlign: 'center', color: theme.colors.secondary, marginTop: 20}}>Nenhum registro de atuação.</Text>
            )}
          </>
        ) : (
          <>
             {movieCrew.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.subTitle, { color: theme.colors.onSurface }]}>Filmes ({movieCrew.length})</Text>
                <FlatList 
                  data={movieCrew}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={(props) => renderCreditItem({ ...props, isMovie: true })}
                  keyExtractor={item => item.id + item.job}
                />
              </View>
            )}
            
            {tvCrew.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.subTitle, { color: theme.colors.onSurface }]}>Séries ({tvCrew.length})</Text>
                <FlatList 
                  data={tvCrew}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={(props) => renderCreditItem({ ...props, isMovie: false })}
                  keyExtractor={item => item.id + item.job}
                />
              </View>
            )}
            {movieCrew.length === 0 && tvCrew.length === 0 && (
                <Text style={{textAlign: 'center', color: theme.colors.secondary, marginTop: 20}}>Nenhum registro de produção.</Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', padding: 16 },
  profileImage: { width: 120, height: 180, borderRadius: 12, backgroundColor: '#ccc' },
  headerInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  chip: { height: 28 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  subTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  listSection: { marginBottom: 24 },
  creditItem: { width: 110, marginRight: 12 },
  creditImage: { width: 110, height: 165, borderRadius: 8, backgroundColor: '#333', marginBottom: 4 },
  creditTitle: { fontSize: 12, fontWeight: 'bold' },
  creditRole: { fontSize: 11 },
});