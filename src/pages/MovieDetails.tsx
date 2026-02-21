import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import VideoPlayer from '../components/ui/VideoPlayer';
import Slider from '../components/ui/Slider';
import { getMovieDetails, getTvDetails, type TMDBMedia } from '../services/tmdb';

const MovieDetails = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const mediaType = location.pathname.includes('/tv/') ? 'tv' : 'movie';

    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // For TV Shows
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const data = mediaType === 'movie'
                    ? await getMovieDetails(id)
                    : await getTvDetails(id);

                setDetails(data);
            } catch (error) {
                console.error("Error fetching details", error);
                // Set mock data if API gets blocked/fails
                setDetails({
                    id: id,
                    title: mediaType === 'movie' ? 'Placeholder Movie' : undefined,
                    name: mediaType === 'tv' ? 'Placeholder Show' : undefined,
                    overview: 'This is a beautifully crafted placeholder description because the API key might be missing or the request failed. Please enjoy the VidKing player functionality!',
                    vote_average: 8.4,
                    release_date: '2025-01-01',
                    first_air_date: '2025-01-01',
                    backdrop_path: null,
                    poster_path: null,
                    number_of_seasons: 3,
                    similar: { results: [] }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, mediaType]);

    if (loading) {
        return (
            <div className="w-full flex-grow flex items-center justify-center min-h-[80vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!details) return <div className="p-8 text-center text-red-500">Failed to load content.</div>;

    const title = details.title || details.name;
    const backdropUrl = details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : 'https://via.placeholder.com/1920x1080?text=No+Backdrop';
    const similarItems: TMDBMedia[] = details.similar?.results || [];

    return (
        <div className="w-full min-h-screen pb-12">
            {/* Detail Hero Section */}
            <div className="relative w-full h-[40vh] md:h-[50vh]">
                <img src={backdropUrl} alt={title} className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 container mx-auto transform translate-y-12 z-20">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 drop-shadow-md">
                        {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300 mb-6 drop-shadow">
                        <span className="px-3 py-1 bg-white/10 rounded-md backdrop-blur-sm border border-white/10 uppercase tracking-widest text-brand-primary">
                            {mediaType}
                        </span>
                        <span>★ {details.vote_average?.toFixed(1) || 'NR'}</span>
                        <span>{(details.release_date || details.first_air_date)?.split('-')[0]}</span>
                    </div>
                    <p className="max-w-3xl text-gray-200 text-sm md:text-base leading-relaxed drop-shadow-sm">
                        {details.overview}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 mt-24">
                {/* TV Show Season/Episode Selectors */}
                {mediaType === 'tv' && (
                    <div className="mb-6 flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                        <h3 className="text-white font-semibold">Select Episode:</h3>

                        <select
                            className="bg-bg-dark border border-white/20 rounded-md px-4 py-2 text-white focus:outline-none focus:border-brand-primary transition-colors"
                            value={season}
                            onChange={(e) => {
                                setSeason(Number(e.target.value));
                                setEpisode(1); // Reset episode when changing season
                            }}
                        >
                            {[...Array(details.number_of_seasons || 1)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEpisode(Math.max(1, episode - 1))}
                                disabled={episode <= 1}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-md transition-colors"
                            >
                                Prev
                            </button>
                            <span className="px-4 font-semibold text-brand-secondary">Ep {episode}</span>
                            <button
                                onClick={() => setEpisode(episode + 1)}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Video Player */}
                <div className="mb-16">
                    <VideoPlayer
                        tmdbId={id as string}
                        mediaType={mediaType}
                        season={season}
                        episode={episode}
                    />
                </div>

                {/* Similar Media Slider */}
                {similarItems.length > 0 && (
                    <div>
                        <Slider title={`More Like ${title}`} items={similarItems} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieDetails;
