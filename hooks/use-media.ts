import { useEffect, useState } from 'react';
import { mediaService, MediaItem } from '@/lib/media-service';

export function useMedia(category?: string, type?: string) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, [category, type]);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mediaService.getActiveMedia(category, type);
      setMedia(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
      console.error('Error loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  return { media, loading, error, reload: loadMedia };
}

export function useMediaByKey(key: string) {
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    loadMedia();
  }, [key]);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mediaService.getMediaByKey(key);
      setMedia(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
      console.error('Error loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  return { media, loading, error, reload: loadMedia };
}