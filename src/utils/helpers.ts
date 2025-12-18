export function getCertificationColor(certification: string): string {
  switch (certification) {
    case "L":
      return "#22c55e"; // verde
    case "10":
      return "#3b82f6"; // azul
    case "12":
      return "#eab308"; // amarelo
    case "14":
      return "#f97316"; // laranja
    case "16":
      return "#ef4444"; // vermelho
    case "18":
      return "#b91c1c"; // vermelho escuro
    default:
      return "#6b7280"; // cinza
  }
}

export function getMediaYear(media: any): string | undefined {
  if (media.release_date) {
    return media.release_date?.slice(0, 4);
  }
  if (media.episode_air_date) {
    return media.episode_air_date?.slice(0, 4);
  }
  if (media.air_date) {
    return media.air_date?.slice(0, 4);
  }
  return '';
}

export function getMediaImageUrl(posterPath: any, size = "w500"): string {
  if (!posterPath) {
    return "/placeholder.svg?height=750&width=500&text=No+Image"
  }

  try {
    const provider = Object.keys(posterPath)[0]
    const path = posterPath[provider]

    if (!path) {
      return "/placeholder.svg?height=750&width=500&text=No+Image"
    }

    if (provider === "tmdb") {
      return `https://image.tmdb.org/t/p/${size}${path}`
    }

    if (provider === "igdb") {
      return `https://images.igdb.com/igdb/image/upload/${size}${path}`
    }

    return path
  } catch {
    return "/placeholder.svg?height=750&width=500&text=No+Image"
  }
}

export const formatCurrency = (value?: string) => {
  if (!value || value === "0") return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
};

export const formatRuntime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const getSocialData = (platform: string) => {
  switch (platform) {
    case 'imdb': return { icon: 'movie-open', color: '#F5C518', label: 'IMDb', url: 'https://www.imdb.com/title/' };
    case 'tmdb': return { icon: 'movie-roll', color: '#01B4E4', label: 'TMDb', url: 'https://www.themoviedb.org/movie/' };
    case 'facebook': return { icon: 'facebook', color: '#1877F2', label: 'Facebook', url: 'https://www.facebook.com/' };
    case 'twitter': return { icon: 'twitter', color: '#1DA1F2', label: 'Twitter', url: 'https://twitter.com/' };
    case 'instagram': return { icon: 'instagram', color: '#E1306C', label: 'Instagram', url: 'https://instagram.com/' };
    case 'wikidata': return { icon: 'barcode-scan', color: '#999', label: 'Wikidata', url: 'https://www.wikidata.org/wiki/' };
    default: return { icon: 'web', color: '#fff', label: platform, url: '' };
  }
};

type RatingKey =
  | 'rating_rotten_average'
  | 'rating_metacritic_average'
  | 'rating_imdb_average'
  | 'rating_tmdb_average'
  | 'rating_letterboxd_average';

export type NormalizedRating = {
  platform: string;
  label: string;
  rating: number;
  normalized: number;
  color: string;
  status: string;
  link: string;
};

const RATING_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  gray: '#6b7280',
};

export const getRatings = (movie: any | null, type: string): { normalizedRatings: NormalizedRating[], average: number | null } => {
  if (!movie) {
    return { normalizedRatings: [], average: null };
  }

  const platforms = [
    { key: 'rating_rotten_average' as RatingKey, label: 'Rotten Tomatoes', linkKey: 'rottentomatoes' },
    { key: 'rating_metacritic_average' as RatingKey, label: 'Metacritic', linkKey: 'metacritic' },
    { key: 'rating_imdb_average' as RatingKey, label: 'IMDb', linkKey: 'imdb' },
    { key: 'rating_tmdb_average' as RatingKey, label: 'TMDb', linkKey: 'tmdb' },
    { key: 'rating_letterboxd_average' as RatingKey, label: 'Letterboxd', linkKey: 'letterboxd' },
  ];

  const normalizedRatings: NormalizedRating[] = [];
  let totalNormalized = 0;
  let validRatingsCount = 0;

  platforms.forEach(platform => {
    const rawValue = movie[platform.key];

    if (rawValue) {
      const value = parseFloat(rawValue);
      let color = RATING_COLORS.gray;
      let status = 'Not Rated';
      let normalizedValue = 0;

      switch (platform.label) {
        case 'Rotten Tomatoes':
          normalizedValue = value / 20;
          if (value >= 75) { color = RATING_COLORS.green; status = 'Certified Fresh'; }
          else if (value >= 60) { color = RATING_COLORS.red; status = 'Fresh'; }
          else { color = RATING_COLORS.gray; status = 'Rotten'; }
          break;
        case 'Metacritic':
          normalizedValue = value / 20;
          if (value >= 75) { color = RATING_COLORS.green; status = 'Generally Favorable'; }
          else if (value >= 50) { color = RATING_COLORS.yellow; status = 'Mixed or Average'; }
          else { color = RATING_COLORS.red; status = 'Generally Unfavorable'; }
          break;
        case 'IMDb':
        case 'TMDb':
          normalizedValue = value / 2;
          if (normalizedValue >= 4) { color = RATING_COLORS.green; status = 'Favorable'; }
          else if (normalizedValue >= 2.5) { color = RATING_COLORS.yellow; status = 'Mixed'; }
          else { color = RATING_COLORS.red; status = 'Unfavorable'; }
          break;
        case 'Letterboxd':
          normalizedValue = value;
          if (value >= 4) { color = RATING_COLORS.green; status = 'Favorable'; }
          else if (value >= 2.5) { color = RATING_COLORS.yellow; status = 'Mixed'; }
          else { color = RATING_COLORS.red; status = 'Unfavorable'; }
          break;
      }

      const linkId = movie.external_ids?.find((ext: any) => ext.platform === platform.linkKey)?.external_id;
      let linkUrl = "#";

      if (linkId) {
        if (platform.label === 'Rotten Tomatoes') linkUrl = `https://www.rottentomatoes.com/${type == 'movie' ? 'm' : 'tv'}/${linkId}`;
        else if (platform.label === 'Metacritic') linkUrl = `https://www.metacritic.com/${type == 'movie' ? 'movie' : 'tv'}/${linkId}`;
        else if (platform.label === 'IMDb') linkUrl = `https://www.imdb.com/title/${linkId}`;
        else if (platform.label === 'TMDb') linkUrl = `https://www.themoviedb.org/${type == 'movie' ? 'movie' : 'tv'}/${linkId}`;
        else if (platform.label === 'Letterboxd') linkUrl = `https://letterboxd.com/${type == 'movie' ? 'film' : 'film'}/${linkId}`;
      }

      normalizedRatings.push({
        platform: platform.label,
        label: platform.label,
        rating: value,
        normalized: normalizedValue,
        color,
        status,
        link: linkUrl
      });

      totalNormalized += normalizedValue;
      validRatingsCount++;
    }
  });

  const average = validRatingsCount > 0 ? parseFloat((totalNormalized / validRatingsCount).toFixed(1)) : null;
  return { normalizedRatings, average };
};