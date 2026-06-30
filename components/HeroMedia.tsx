import { useEffect, useState } from 'react';
import { mediaService, MediaItem } from '@/lib/media-service';

interface HeroMediaProps {
  category?: string;
  key?: string;
  fallback?: string;
  className?: string;
  children?: React.ReactNode;
}

export function HeroMedia({ 
  category = 'hero', 
  key: mediaKey, 
  fallback = '',
  className = '',
  children 
}: HeroMediaProps) {
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [mediaKey, category]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      let data;
      if (mediaKey) {
        data = await mediaService.getMediaByKey(mediaKey);
      } else {
        const items = await mediaService.getActiveMedia(category);
        data = items.length > 0 ? items[0] : null;
      }
      setMedia(data);
    } catch (error) {
      console.error('Error loading hero media:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  if (!media) {
    if (fallback) {
      return (
        <div className={`w-full h-full ${className}`}>
          <img src={fallback} alt="Hero" className="w-full h-full object-cover" />
          {children}
        </div>
      );
    }
    return <div className={`w-full h-full bg-gradient-to-br from-blue-900 to-cyan-900 ${className}`} />;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {media.type === 'image' ? (
        <img
          src={media.url}
          alt={media.alt || media.title}
          className="w-full h-full object-cover"
        />
      ) : media.type === 'video' ? (
        <video
          src={media.url}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : null}
      {children}
    </div>
  );
}