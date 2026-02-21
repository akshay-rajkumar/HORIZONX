import { useEffect, useState } from 'react';
import Hero from '../components/ui/Hero';
import Slider from '../components/ui/Slider';
import { getTrending, getPopularMovies, getPopularTvSeries, type TMDBMedia } from '../services/tmdb';

// Fallback data in case API key is missing or fails
const fallbackMovies: TMDBMedia[] = [
    { id: 1078605, title: 'Sample Movie', overview: 'A great movie', poster_path: null, backdrop_path: null, vote_average: 8.5, media_type: 'movie' },
    { id: 119051, name: 'Sample TV Show', overview: 'A great show', poster_path: null, backdrop_path: null, vote_average: 9.0, media_type: 'tv' }
];

const Home = () => {
    const [heroMedia, setHeroMedia] = useState<TMDBMedia | null>(null);
    const [trending, setTrending] = useState<TMDBMedia[]>([]);
    const [popular, setPopular] = useState<TMDBMedia[]>([]);
    const [popularTv, setPopularTv] = useState<TMDBMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trendingData, popularData, popularTvData] = await Promise.all([
                    getTrending('all', 'week'),
                    getPopularMovies(),
                    getPopularTvSeries()
                ]);

                setTrending(trendingData);
                setPopular(popularData);
                setPopularTv(popularTvData);

                if (trendingData.length > 0) {
                    // Select a random movie from top 5 trending for hero
                    const randomIndex = Math.floor(Math.random() * Math.min(5, trendingData.length));
                    setHeroMedia(trendingData[randomIndex]);
                }
            } catch (error) {
                console.error("Error fetching TMDB data:", error);
                // Use fallback if API fails (e.g. no key)
                setTrending(fallbackMovies);
                setPopular(fallbackMovies);
                setPopularTv(fallbackMovies);
                setHeroMedia(fallbackMovies[0]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="w-full flex-grow flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full pb-12">
            <Hero media={heroMedia} />

            <div className="container mx-auto px-0 md:px-4 -mt-16 md:-mt-24 relative z-30">
                <Slider title="Trending This Week" items={trending} />
                <Slider title="Popular Movies" items={popular} />
                <Slider title="Popular TV Shows" items={popularTv} />
                {/* We can add more sliders here easily */}
            </div>
        </div>
    );
};

export default Home;
