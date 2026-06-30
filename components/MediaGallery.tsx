import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ChevronLeft, ChevronRight, Image as ImageIcon, Film, File } from 'lucide-react';
import { mediaService, MediaItem } from '@/lib/media-service';

interface MediaGalleryProps {
  category?: string;
  type?: 'image' | 'video' | 'all';
  limit?: number;
  columns?: number;
  showTitle?: boolean;
  className?: string;
}

export function MediaGallery({ 
  category, 
  type = 'all', 
  limit = 12, 
  columns = 3,
  showTitle = true,
  className = ''
}: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadMedia();
  }, [category, type]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await mediaService.getActiveMedia(
        category === 'all' ? undefined : category,
        type === 'all' ? undefined : type
      );
      setMedia(data.slice(0, limit));
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (item: MediaItem, index: number) => {
    setSelectedMedia(item);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % media.length 
      : (currentIndex - 1 + media.length) % media.length;
    setCurrentIndex(newIndex);
    setSelectedMedia(media[newIndex]);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No media found</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-4 ${className}`}>
        {media.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
            onClick={() => openLightbox(item, index)}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.alt || item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : item.type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all">
                  <Play className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <File className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {showTitle && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
              </div>
            )}
            
            {item.type === 'video' && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur">
                🎬 Video
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {media.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                  className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full bg-black/30 hover:bg-black/50"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                  className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full bg-black/30 hover:bg-black/50"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <div 
              className="max-w-5xl w-full max-h-[80vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt || selectedMedia.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <File className="w-16 h-16 mb-4" />
                  <p className="text-lg">{selectedMedia.title}</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center max-w-2xl">
              <h3 className="text-xl font-bold">{selectedMedia.title}</h3>
              {selectedMedia.description && (
                <p className="text-gray-400 text-sm mt-1">{selectedMedia.description}</p>
              )}
              <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-500">
                <span>Category: {selectedMedia.category}</span>
                <span>•</span>
                <span>Type: {selectedMedia.type}</span>
                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Tags: {selectedMedia.tags.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}