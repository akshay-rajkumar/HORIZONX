import { useEffect } from 'react';

interface VideoPlayerProps {
    tmdbId: number | string;
    mediaType: 'movie' | 'tv';
    season?: number;
    episode?: number;
}

const VideoPlayer = ({ tmdbId, mediaType, season = 1, episode = 1 }: VideoPlayerProps) => {
    // We remove the '#' from hex color as per the docs
    const brandColor = 'e50914';
    const embedUrl = mediaType === 'movie'
        ? `https://www.vidking.net/embed/movie/${tmdbId}?color=${brandColor}&autoPlay=false`
        : `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=${brandColor}&autoPlay=false&nextEpisode=true&episodeSelector=true`;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.vidking.net') return;

            try {
                const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (payload?.type === 'PLAYER_EVENT') {
                    // Log progression or save to local storage
                    console.log('[VidKing Progress]', payload.data);
                }
            } catch (e) {
                // Ignore parsing errors from other unrelated messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl shadow-brand-primary/20 bg-black/50 border border-white/10 relative">
            <iframe
                src={embedUrl}
                className="w-full h-full border-0 absolute top-0 left-0"
                allowFullScreen
                title="VidKing Video Player"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
        </div>
    );
};

export default VideoPlayer;
