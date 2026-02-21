import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';
import type { TMDBMedia } from '../../services/tmdb';

interface MovieCardProps {
    media: TMDBMedia;
}

const MovieCard = ({ media }: MovieCardProps) => {
    const isMovie = media.media_type === 'movie' || !media.media_type;
    const link = isMovie ? `/movie/${media.id}` : `/tv/${media.id}`;
    const title = media.title || media.name;
    const releaseYear = (media.release_date || media.first_air_date)?.split('-')[0] || '';
    const imageUrl = media.poster_path
        ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';

    return (
        <Link to={link} className="group relative block w-full aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-brand-secondary/20 bg-white/5 border border-white/5">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 mb-1">{title}</h3>

                    <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                        <span>{releaseYear}</span>
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>{media.vote_average?.toFixed(1) || 'NR'}</span>
                        </div>
                    </div>

                    <button className="w-full py-1.5 bg-brand-primary text-white rounded-md flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-700 transition-colors">
                        <Play className="w-4 h-4 fill-current" />
                        Watch Now
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default MovieCard;
