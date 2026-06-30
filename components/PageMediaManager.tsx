import React, { useState, useEffect, useRef } from 'react'; // ← Added useRef import
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, Upload, X, Edit, Eye, EyeOff, Trash2, 
  Plus, Check, Loader2, RefreshCw, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { mediaService, MediaItem } from '@/lib/media-service';
import { supabase } from '@/integrations/supabase/client';

interface PageMediaManagerProps {
  page: string;
  title?: string;
  description?: string;
  multiple?: boolean;
  maxItems?: number;
  onUpdate?: (media: MediaItem[]) => void;
}

export function PageMediaManager({ 
  page, 
  title = 'Page Images',
  description = 'Manage images for this page',
  multiple = true,
  maxItems = 10,
  onUpdate 
}: PageMediaManagerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    alt: '',
  });
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // ← Now useRef is defined

  useEffect(() => {
    loadMedia();
  }, [page]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await mediaService.getActiveMedia(page);
      setMedia(data);
      if (onUpdate) onUpdate(data);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setUploadForm({
      ...uploadForm,
      file,
      title: file.name.split('.').slice(0, -1).join('.'),
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const result = await mediaService.uploadMedia(uploadForm.file, {
        title: uploadForm.title,
        category: page,
        alt: uploadForm.alt || uploadForm.title,
        description: uploadForm.description,
      });

      if (result) {
        toast.success('Media uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          file: null,
          title: '',
          description: '',
          alt: '',
        });
        loadMedia();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    try {
      const updates = {
        title: editingItem.title,
        description: editingItem.description,
        alt: editingItem.alt,
      };

      const result = await mediaService.updateMedia(editingItem.id, updates);
      if (result) {
        toast.success('Media updated successfully!');
        setShowEditModal(false);
        setEditingItem(null);
        loadMedia();
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update media');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      await mediaService.deleteMedia(id);
      toast.success('Media deleted successfully!');
      loadMedia();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete media');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await mediaService.toggleActive(id);
      loadMedia();
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex gap-2">
          {media.length < maxItems && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Image
            </button>
          )}
          <button
            onClick={loadMedia}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No images for this page yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm"
          >
            Upload First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
            >
              {/* Preview */}
              <div 
                className="aspect-video cursor-pointer relative overflow-hidden"
                onClick={() => setPreviewItem(item)}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-8 h-8 text-white opacity-80" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                {!item.is_active && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    Inactive
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                  {item.title || 'Untitled'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatFileSize(item.size || 0)}
                </p>
              </div>

              {/* Actions */}
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setShowEditModal(true);
                  }}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-md"
                  title="Edit"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button
                  onClick={() => handleToggleActive(item.id)}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-md"
                  title={item.is_active ? 'Hide' : 'Show'}
                >
                  {item.is_active ? (
                    <Eye className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-md"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>

              {/* Type badge */}
              <div className="absolute bottom-2 right-2">
                <span className="text-xs px-1.5 py-0.5 bg-black/50 text-white rounded-full backdrop-blur">
                  {item.type === 'image' ? '📷' : item.type === 'video' ? '🎬' : '📄'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Media</h3>
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-all">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadForm.file ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-4">
                          {uploadForm.file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(uploadForm.file)}
                              alt="Preview"
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ) : uploadForm.file.type.startsWith('video/') ? (
                            <video
                              src={URL.createObjectURL(uploadForm.file)}
                              className="w-20 h-20 rounded-lg object-cover"
                              muted
                            />
                          ) : (
                            <Image className="w-10 h-10 text-gray-400" />
                          )}
                          <div className="text-left">
                            <p className="font-medium">{uploadForm.file.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(uploadForm.file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setUploadForm({ ...uploadForm, file: null });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">Click to upload</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm"
                        >
                          Select File
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Enter title"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={uploadForm.alt}
                      onChange={(e) => setUploadForm({ ...uploadForm, alt: e.target.value })}
                      placeholder="Alt text for accessibility"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Enter description"
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadForm.file || !uploadForm.title}
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Media</h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                    {editingItem.type === 'image' ? (
                      <img src={editingItem.url} alt={editingItem.title} className="w-full h-full object-contain" />
                    ) : editingItem.type === 'video' ? (
                      <video src={editingItem.url} controls className="w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Image className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={editingItem.alt}
                      onChange={(e) => setEditingItem({ ...editingItem, alt: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewItem(null)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl w-full"
              >
                <button
                  onClick={() => setPreviewItem(null)}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="bg-black rounded-2xl overflow-hidden">
                  {previewItem.type === 'image' ? (
                    <img src={previewItem.url} alt={previewItem.title} className="w-full h-auto max-h-[80vh] object-contain" />
                  ) : previewItem.type === 'video' ? (
                    <video src={previewItem.url} controls autoPlay className="w-full h-auto max-h-[80vh]" />
                  ) : (
                    <div className="flex items-center justify-center h-40 text-white">
                      <Image className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <div className="mt-4 text-white">
                  <h3 className="text-lg font-bold">{previewItem.title}</h3>
                  {previewItem.description && (
                    <p className="text-gray-400 text-sm mt-1">{previewItem.description}</p>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}