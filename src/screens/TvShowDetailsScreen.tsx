import React, { useState, useContext } from "react";
import { ScrollView, View, StyleSheet, StatusBar, TouchableOpacity, Linking, Modal, Share, Image, Dimensions, FlatList } from "react-native";
import { Text, ActivityIndicator, Chip, useTheme } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTvShowDetails } from "../hooks/useTvShowDetails";
import { getCertificationColor, formatCurrency, formatDate, getSocialData } from "../utils/helpers";
import { Country, Language } from "../types/Movie";
import { MediaImage } from "../types/Interactions";
import { AuthContext } from "../context/AuthContext";

import AddToListModal from "../components/AddToListModal";
import MediaHeader from "../components/MediaHeader";
import MediaActionButtons from "../components/MediaActionButtons";

const { width, height } = Dimensions.get("window");

export default function TvShowDetailsScreen({ route }: any) {
  const { slug } = route.params;
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const {
    tvShow, providers, cast, crew, images, videos,
    userInteraction, loading, interactionLoading,
    handleInteraction
  } = useTvShowDetails(slug);

  const [activeTab, setActiveTab] = useState<"about" | "seasons" | "cast" | "crew" | "videos" | "images">("about");
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);

  const openImageModal = (image: MediaImage) => { setSelectedImage(image); setIsImageModalVisible(true); };
  const closeImageModal = () => { setIsImageModalVisible(false); setSelectedImage(null); };

  const handleShare = async () => {
    if (!tvShow) return;
    try {
      await Share.share({
        message: `Confira a série "${tvShow.title}" no WikiNerd!\nhttps://wikinerd.com.br/series/${slug}`,
        url: `https://wikinerd.com.br/series/${slug}`,
        title: `WikiNerd: ${tvShow.title}`
      });
    } catch (error: any) { console.log("Erro ao compartilhar:", error.message); }
  };

  const renderTabButton = (key: typeof activeTab, label: string) => (
    <TouchableOpacity onPress={() => setActiveTab(key)}>
      <Text style={[
        key === activeTab ? styles.tabActive : styles.tabInactive,
        {
          backgroundColor: key === activeTab ? theme.colors.surfaceVariant : 'transparent',
          color: key === activeTab ? theme.colors.onSurface : theme.colors.onSurfaceVariant
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const availableSections = [
    { title: "Streaming", data: providers.filter(p => p.type === 'flatrate'), type: "flatrate" },
    { title: "Comprar", data: providers.filter(p => p.type === 'buy'), type: "buy" },
    { title: "Alugar", data: providers.filter(p => p.type === 'rent'), type: "rent" }
  ].filter(s => s.data.length > 0);
  const remainingOptionsCount = Math.max(0, availableSections.length - 1);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tvShow) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Série não encontrada.</Text>
      </View>
    );
  }

  const creators = tvShow.creators?.map(c => c.name).join(", ");

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

        <MediaHeader media={tvShow} handleShare={handleShare} />

        <MediaActionButtons
          userInteraction={userInteraction}
          onInteraction={handleInteraction}
          onAddList={() => setListModalVisible(true)}
          loading={interactionLoading}
        />

        <View style={styles.genresContainer}>
          {tvShow.genres?.map((g) => (
            <Chip key={g.id} style={[styles.genreChip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{g.name}</Chip>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
            {renderTabButton("about", "Sobre")}
            {renderTabButton("seasons", "Temporadas")}
            {renderTabButton("cast", "Elenco")}
            {renderTabButton("crew", "Equipe")}
            {renderTabButton("images", "Imagens")}
            {renderTabButton("videos", "Vídeos")}
          </View>

          {activeTab === "about" && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Sinopse</Text>
              <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{tvShow.overview}</Text>

              {creators && creators.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, fontSize: 16, marginBottom: 4 }]}>Criação</Text>
                  <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant, lineHeight: 20 }]}>{creators}</Text>
                </View>
              )}

              <View style={styles.innerSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Informações da Série</Text>
                <View style={styles.techGrid}>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>País de Origem</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.countries && tvShow.countries.length > 0 ? tvShow.countries.map((c: Country) => c.name).join(', ') : "Desconhecido"}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Idioma Original</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.languages && tvShow.languages.length > 0 ? tvShow.languages.map((l: Language) => l.name).join(', ') : "Desconhecido"}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Temporadas</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.number_of_seasons}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Episódios</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.number_of_episodes}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Status</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.status}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Tipo</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.type}</Text></View>
                </View>
              </View>

              <View style={styles.innerSection}>
                <View style={styles.providersHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Onde Assistir</Text>
                  {remainingOptionsCount > 0 && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAllProviders(!showAllProviders)}>
                      <View style={[styles.seeMoreBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                        <Text style={[styles.seeMoreText, { color: theme.colors.onSurface }]}>
                          {showAllProviders ? "Mostrar menos" : `Ver mais ${remainingOptionsCount} opç${remainingOptionsCount > 1 ? 'ões' : 'ão'}`}
                        </Text>
                        <Icon name={showAllProviders ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.onSurface} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {availableSections.length > 0 ? (
                  availableSections.map((section, index) => {
                    if (index === 0 || showAllProviders) {
                      return (
                        <View key={section.type} style={{ marginBottom: 16 }}>
                          <Text style={[styles.providerSubTitle, { color: theme.colors.secondary }]}>{section.title}</Text>
                          <View style={styles.providersGrid}>
                            {section.data.map((prov, idx) => (
                              <View key={`${prov.id}-${prov.type}-${idx}`} style={styles.providerItem}>
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w92${prov.logo_path.tmdb}` }} style={styles.providerLogo} />
                                <Text style={[styles.providerName, { color: theme.colors.onBackground }]} numberOfLines={2}>{prov.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })
                ) : (
                  <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhum serviço de streaming encontrado.</Text>
                )}
              </View>

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Classificação Etária</Text>
                <View style={styles.contentRow}>
                  <View style={[styles.largeCertBadge, { backgroundColor: tvShow.certification ? getCertificationColor(tvShow.certification) : "#666" }]}>
                    <Text style={styles.largeCertText}>{tvShow.certification || "?"}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>ClassInd</Text>
                    <Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>{tvShow.certification ? `${tvShow.certification} anos` : "Não informado"}</Text>
                  </View>
                  <View style={[styles.countryBadge, { backgroundColor: theme.colors.surfaceVariant }]}><Text style={[styles.countryText, { color: theme.colors.onSurfaceVariant }]}>Brasil</Text></View>
                </View>
              </View>

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Links Externos</Text>
                {tvShow.external_ids?.map((item) => {
                  const { icon, color, label, url } = getSocialData(item.platform);
                  return (
                    <TouchableOpacity key={item.platform} style={styles.linkRow} onPress={() => Linking.openURL(`${url}${item.external_id}`)}>
                      <View style={[styles.linkIconBox, { backgroundColor: color }]}>
                        <Icon name={icon} size={16} color="white" />
                      </View>
                      <Text style={[styles.linkText, { color: theme.colors.onSurface }]}>{label}</Text>
                      <Icon name="open-in-new" size={16} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {tvShow.keywords && tvShow.keywords.length > 0 && (
                <View style={styles.innerSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Palavras-chave</Text>
                  <View style={styles.keywordContainer}>
                    {tvShow.keywords.map(k => (<View key={k.id} style={[styles.keywordBadge, { borderColor: theme.colors.outline }]}><Text style={[styles.keywordText, { color: theme.colors.onBackground }]}>{k.name}</Text></View>))}
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === "seasons" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Temporadas</Text>
              {tvShow.seasons?.map((season) => (
                <View key={season.id} style={[styles.seasonCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                    <Image 
                        source={{ uri: season.poster_path?.tmdb ? `https://image.tmdb.org/t/p/w185${season.poster_path.tmdb}` : undefined }} 
                        style={[styles.seasonPoster, { backgroundColor: theme.colors.surfaceVariant }]} 
                    />
                    <View style={styles.seasonInfo}>
                        <Text style={[styles.seasonTitle, { color: theme.colors.onSurface }]}>{season.title}</Text>
                        <Text style={[styles.seasonMeta, { color: theme.colors.secondary }]}>
                            {season.episodes?.length || 0} Episódios • {season.air_date ? season.air_date.split('-')[0] : 'N/A'}
                        </Text>
                        <Text style={[styles.seasonOverview, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>{season.overview || "Sem descrição disponível."}</Text>
                        {season.rating_tmdb_average && (
                            <View style={styles.seasonRating}>
                                <Icon name="star" size={14} color="#f5c518" />
                                <Text style={[styles.ratingValue, { color: theme.colors.onSurface }]}>{Number(season.rating_tmdb_average).toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "cast" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Elenco Principal</Text>
              {cast.map((person) => (
                <View key={person.id} style={[styles.personRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: theme.colors.onBackground }]}>{person.name}</Text>
                    <Text style={[styles.personRole, { color: theme.colors.secondary }]}>{person.character}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "crew" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Equipe Técnica</Text>
              {crew.map((person) => (
                <View key={person.id + person.job.job} style={[styles.personRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: theme.colors.onBackground }]}>{person.name}</Text>
                    <Text style={[styles.personRole, { color: theme.colors.secondary }]}>{person.job.job}</Text>
                    <Text style={[styles.personDept, { color: theme.colors.tertiary }]}>{person.job.department}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "images" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Imagens</Text>
              {images.length === 0 && <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhuma imagem encontrada.</Text>}
              <View style={styles.imagesGrid}>
                {images.map((img) => (
                  <TouchableOpacity key={img.id} style={[styles.galleryImageContainer, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => openImageModal(img)} activeOpacity={0.8}>
                    <Image source={{ uri: `https://image.tmdb.org/t/p/w500${img.file_path}` }} style={styles.galleryImage} resizeMode="cover" />
                    <View style={styles.imageBadge}><Text style={styles.imageBadgeText}>{img.type ? img.type.charAt(0).toUpperCase() + img.type.slice(1) : 'Imagem'}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === "videos" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Vídeos</Text>
              {videos.length === 0 && <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhum vídeo disponível no momento.</Text>}
              {videos.map((vid) => (
                <TouchableOpacity key={vid.id} style={[styles.videoItem, { backgroundColor: theme.colors.surface }]} onPress={() => vid.site === "YouTube" && Linking.openURL(`https://www.youtube.com/watch?v=${vid.key}`)}>
                  <Image source={{ uri: `https://img.youtube.com/vi/${vid.key}/0.jpg` }} style={[styles.videoThumbnail, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoName, { color: theme.colors.onSurface }]} numberOfLines={2}>{vid.name}</Text>
                    <Text style={[styles.videoType, { color: theme.colors.secondary }]}>{vid.type}</Text>
                  </View>
                  <Icon name="play-circle-outline" size={32} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAIS */}
      <Modal visible={isImageModalVisible} transparent={true} onRequestClose={closeImageModal} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={closeImageModal}>
            {selectedImage && (
              <Image source={{ uri: `https://image.tmdb.org/t/p/original${selectedImage.file_path}` }} style={styles.fullscreenImage} resizeMode="contain" />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
              <Icon name="close-circle" size={40} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      {tvShow && (
        <AddToListModal
          visible={listModalVisible}
          onDismiss={() => setListModalVisible(false)}
          mediaId={tvShow.id}
          mediaType="tv"
          mediaTitle={tvShow.title}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  genresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  genreChip: { height: 32 },
  section: { padding: 16, borderTopWidth: 1, marginTop: 16 },
  innerSection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bodyText: { lineHeight: 22, textAlign: 'justify' },
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 8, marginBottom: 16, flexWrap: 'wrap', rowGap: 4 },
  tabActive: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, fontWeight: 'bold', overflow: 'hidden' },
  tabInactive: { paddingVertical: 6, paddingHorizontal: 12 },
  providersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seeMoreBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  seeMoreText: { fontSize: 12, fontWeight: 'bold' },
  providerSubTitle: { fontSize: 14, marginBottom: 12 },
  providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  providerItem: { width: 60, alignItems: 'center', marginBottom: 8 },
  providerLogo: { width: 50, height: 50, borderRadius: 8, marginBottom: 4, backgroundColor: '#333' },
  providerName: { fontSize: 10, textAlign: 'center', height: 30 },
  cardContainer: { marginHorizontal: 0, marginTop: 24, borderRadius: 8, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  contentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  largeCertBadge: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  largeCertText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  infoTitle: { fontWeight: 'bold', fontSize: 14 },
  infoSubtitle: { fontSize: 12 },
  countryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countryText: { fontSize: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  linkIconBox: { width: 24, height: 24, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  linkText: { flex: 1, fontWeight: '500' },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  techItem: { width: '50%', paddingRight: 8 },
  techLabel: { fontSize: 12, marginBottom: 2 },
  techValue: { fontSize: 14, fontWeight: '500' },
  keywordContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordBadge: { backgroundColor: 'transparent', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  keywordText: { fontSize: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, paddingBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: 'bold' },
  personRole: { fontSize: 14 },
  personDept: { fontSize: 12 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImageContainer: { width: (width - 40) / 2, height: 120, borderRadius: 4, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  imageBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  imageBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fullscreenImage: { width: width, height: height },
  closeButton: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  videoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderRadius: 8, padding: 8 },
  videoThumbnail: { width: 120, height: 68, borderRadius: 4 },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  videoType: { fontSize: 12 },
  metaText: { fontSize: 12 },
  seasonCard: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  seasonPoster: { width: 100, height: 150 },
  seasonInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  seasonTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  seasonMeta: { fontSize: 12, marginBottom: 8 },
  seasonOverview: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  seasonRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontSize: 12, fontWeight: 'bold' }
});