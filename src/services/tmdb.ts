import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json;charset=utf-8'
    },
});

export const getTrending = async (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') => {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
    return response.data.results;
};

export const getPopularMovies = async () => {
    const response = await tmdbApi.get('/movie/popular');
    return response.data.results;
};

export const getMovieDetails = async (id: string | number) => {
    const response = await tmdbApi.get(`/movie/${id}`, {
        params: { append_to_response: 'credits,videos,similar' }
    });
    return response.data;
};

export const getTvDetails = async (id: string | number) => {
    const response = await tmdbApi.get(`/tv/${id}`, {
        params: { append_to_response: 'credits,videos,similar' }
    });
    return response.data;
};

export const searchMedia = async (query: string) => {
    const response = await tmdbApi.get('/search/multi', {
        params: { query }
    });
    return response.data.results;
};

export interface TMDBMedia {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    media_type?: 'movie' | 'tv';
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
}
