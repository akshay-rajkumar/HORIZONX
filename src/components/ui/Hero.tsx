import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import type { TMDBMedia } from '../../services/tmdb';

interface HeroProps {
    media: TMDBMedia | null;
}

const Hero = ({ media }: HeroProps) => {
    if (!media) {
        return (
            <section className="relative h-[75vh] md:h-[85vh] w-full flex items-center justify-center bg-gray-900 overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/50 to-transparent z-10" />
            </section>
        );
    }

    const isMovie = media.media_type === 'movie' || !media.media_type;
    const link = isMovie ? `/movie/${media.id}` : `/tv/${media.id}`;
    const title = media.title || media.name;
    const backdropUrl = media.backdrop_path
        ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
        : `https://image.tmdb.org/t/p/original${media.poster_path}`;

    return (
        <section className="relative h-[75vh] md:h-[85vh] w-full flex items-center bg-gray-900 overflow-hidden">
            <div className="absolute inset-0">
                <img
                    src={backdropUrl}
                    alt={title}
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/60 to-transparent" />
            </div>

            <div className="container mx-auto px-4 md:px-8 relative z-20">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 drop-shadow-lg text-white">
                        {title}
                    </h1>

                    <div className="flex items-center gap-4 text-sm md:text-base text-gray-300 mb-6 drop-shadow-md">
                        <span className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            {media.vote_average?.toFixed(1) || 'NR'}
                        </span>
                        <span>|</span>
                        <span>{(media.release_date || media.first_air_date)?.split('-')[0]}</span>
                        <span>|</span>
                        <span className="uppercase text-brand-secondary font-semibold">{media.media_type || 'Movie'}</span>
                    </div>

                    <p className="text-base md:text-lg text-gray-200 mb-8 line-clamp-3 md:line-clamp-4 drop-shadow-md">
                        {media.overview}
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            to={link}
                            className="px-8 py-3 md:py-4 bg-brand-primary text-white rounded-full flex items-center gap-2 font-semibold hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-brand-primary/30"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Watch Free
                        </Link>
                        <Link
                            to={link}
                            className="px-8 py-3 md:py-4 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center gap-2 font-semibold hover:bg-white/30 hover:scale-105 transition-all border border-white/10"
                        >
                            <Info className="w-5 h-5" />
                            More Info
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
