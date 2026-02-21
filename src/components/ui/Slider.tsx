import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TMDBMedia } from '../../services/tmdb';
import MovieCard from './MovieCard';

interface SliderProps {
    title: string;
    items: TMDBMedia[];
}

const Slider = ({ title, items }: SliderProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <section className="mb-10 w-full relative">
            <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-8 drop-shadow-sm">{title}</h2>

            <div className="group relative">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full w-12 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-white backdrop-blur-sm"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 pt-4 -mt-4 scroll-smooth snap-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item) => (
                        <div key={item.id} className="min-w-[140px] md:min-w-[180px] lg:min-w-[220px] snap-start">
                            <MovieCard media={item} />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full w-12 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-white backdrop-blur-sm"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>
        </section>
    );
};

export default Slider;
