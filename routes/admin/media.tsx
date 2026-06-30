import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, Image, Video, File, Trash2, Edit, 
  Eye, EyeOff, RefreshCw, Search,
  Plus, X, Check, AlertCircle, Loader2,
  Grid, List, Play, Shield, ArrowLeft,
  FolderOpen, Tag, Calendar, User, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mediaService, MediaItem, MediaCategory } from "@/lib/media-service";

export const Route = createFileRoute("/admin/media")({
  component: AdminMedia,
});

function AdminMedia() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    category: '',
    description: '',
    alt: '',
    tags: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    alt: '',
    category: '',
    tags: '',
    is_active: true,
  });

  useEffect(() => {
    checkAdmin();
    loadData();
    loadCategories();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [selectedCategory, selectedType, isAdmin]);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      
      const { data: isAdminUser } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (!isAdminUser) {
        navigate({ to: "/dashboard" });
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate({ to: "/auth" });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await mediaService.getMedia(
        selectedCategory === 'all' ? undefined : selectedCategory,
        selectedType === 'all' ? undefined : selectedType
      );
      setMediaItems(data);
    } catch (error: any) {
      console.error('Error loading media:', error);
      toast.error(error.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await mediaService.getCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
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
    if (!uploadForm.file || !uploadForm.title || !uploadForm.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await mediaService.uploadMedia(uploadForm.file, {
        title: uploadForm.title,
        category: uploadForm.category,
        alt: uploadForm.alt || uploadForm.title,
        description: uploadForm.description,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()) : [],
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result) {
        toast.success('Media uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          file: null,
          title: '',
          category: '',
          description: '',
          alt: '',
          tags: '',
        });
        setUploadProgress(0);
        loadData();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEdit = async () => {
    if (!selectedMedia) return;

    try {
      const updates = {
        title: editForm.title,
        description: editForm.description,
        alt: editForm.alt,
        category: editForm.category,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
        is_active: editForm.is_active,
      };

      const result = await mediaService.updateMedia(selectedMedia.id, updates);
      if (result) {
        toast.success('Media updated successfully!');
        setShowEditModal(false);
        setSelectedMedia(null);
        loadData();
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
      loadData();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete media');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await mediaService.toggleActive(id);
      loadData();
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const openEditModal = (media: MediaItem) => {
    setSelectedMedia(media);
    setEditForm({
      title: media.title || '',
      description: media.description || '',
      alt: media.alt || '',
      category: media.category || '',
      tags: media.tags ? media.tags.join(', ') : '',
      is_active: media.is_active,
    });
    setShowEditModal(true);
  };

  const openPreview = (media: MediaItem) => {
    setPreviewMedia(media);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await mediaService.syncExistingImages();
      toast.success('Existing images synced successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to sync existing images');
    } finally {
      setSyncing(false);
    }
  };

  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Admin privileges required</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  to="/admin/dashboard"
                  className="p-2 rounded-xl bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-white">Media Management</h1>
                  <p className="text-blue-100 mt-1">Upload and manage images, videos, and documents</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Sync Existing
                  </>
                )}
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Media
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Total Media</p>
              <p className="text-2xl font-bold text-white">{mediaItems.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Images</p>
              <p className="text-2xl font-bold text-white">
                {mediaItems.filter(m => m.type === 'image').length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Videos</p>
              <p className="text-2xl font-bold text-white">
                {mediaItems.filter(m => m.type === 'video').length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No media found</p>
          <p className="text-gray-400 text-sm mt-1">Click "Sync Existing Images" to import existing images, or upload new media</p>
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Existing Images
                </>
              )}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload New Media
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
            >
              {/* Media Preview */}
              <div 
                className="aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer relative overflow-hidden"
                onClick={() => openPreview(item)}
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
                      <Play className="w-12 h-12 text-white opacity-80" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <File className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                {!item.is_active && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    Inactive
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                  {item.title || 'Untitled'}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.category} • {formatFileSize(item.size || 0)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full capitalize">
                    {item.type}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-md"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleToggleActive(item.id)}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-md"
                  title={item.is_active ? 'Hide' : 'Show'}
                >
                  {item.is_active ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-md"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Type badge */}
              <div className="absolute bottom-3 right-3">
                <span className="text-xs px-2 py-1 bg-black/50 text-white rounded-full backdrop-blur">
                  {item.type === 'image' ? '📷' : item.type === 'video' ? '🎬' : '📄'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMedia.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-700"
                        onClick={() => openPreview(item)}
                      >
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                        ) : item.type === 'video' ? (
                          <div className="flex items-center justify-center h-full bg-gray-800">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <File className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.title || 'Untitled'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(item.id)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={item.is_active ? 'Hide' : 'Show'}
                        >
                          {item.is_active ? (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl z-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Media</h3>
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* File Drop Area */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-all">
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
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                          ) : uploadForm.file.type.startsWith('video/') ? (
                            <video
                              src={URL.createObjectURL(uploadForm.file)}
                              className="w-24 h-24 rounded-lg object-cover"
                              muted
                            />
                          ) : (
                            <File className="w-12 h-12 text-gray-400" />
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
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Drag & drop or click to upload</p>
                        <p className="text-sm text-gray-500 mt-2">Supports images, videos (Max 50MB)</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
                        >
                          Select File
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload Form */}
                  <div className="grid gap-4 md:grid-cols-2">
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
                        Category *
                      </label>
                      <select
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description
                      </label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                        placeholder="Enter description"
                        rows={3}
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
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={uploadForm.tags}
                        onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3"
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadForm.file || !uploadForm.title || !uploadForm.category}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Media
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
        {showEditModal && selectedMedia && (
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
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Media</h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Preview */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                    {selectedMedia.type === 'image' ? (
                      <img src={selectedMedia.url} alt={selectedMedia.title} className="w-full h-full object-contain" />
                    ) : selectedMedia.type === 'video' ? (
                      <video src={selectedMedia.url} controls className="w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <File className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Category
                      </label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={editForm.alt}
                        onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      Active (visible on website)
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
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
        {previewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewMedia(null)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full"
              >
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>

                <div className="bg-black rounded-2xl overflow-hidden">
                  {previewMedia.type === 'image' ? (
                    <img src={previewMedia.url} alt={previewMedia.title} className="w-full h-auto max-h-[80vh] object-contain" />
                  ) : previewMedia.type === 'video' ? (
                    <video src={previewMedia.url} controls autoPlay className="w-full h-auto max-h-[80vh]" />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-white">
                      <File className="w-16 h-16" />
                    </div>
                  )}
                </div>

                <div className="mt-4 text-white">
                  <h3 className="text-xl font-bold">{previewMedia.title}</h3>
                  <p className="text-gray-400 mt-1">{previewMedia.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                    <span>Category: {previewMedia.category}</span>
                    <span>Type: {previewMedia.type}</span>
                    {previewMedia.tags && previewMedia.tags.length > 0 && (
                      <span>Tags: {previewMedia.tags.join(', ')}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}