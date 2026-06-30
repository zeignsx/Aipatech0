import { supabase } from "@/integrations/supabase/client";

export interface MediaItem {
  id: string;
  key: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail_url: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  size: number;
  alt: string;
  uploaded_by: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

class MediaService {
  private static instance: MediaService;

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // Check if we're in browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  // Get image dimensions - ONLY runs in browser
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new (window as any).Image();
      const url = URL.createObjectURL(file);
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      img.onload = () => {
        cleanup();
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        cleanup();
        resolve({ width: 0, height: 0 });
      };
      
      img.src = url;
    });
  }

  // Upload media file
  async uploadMedia(
    file: File,
    metadata: {
      title: string;
      category: string;
      alt?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<MediaItem | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let type: 'image' | 'video' | 'document' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('image/')) type = 'image';
      else type = 'document';

      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const key = `${metadata.category}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(key, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(key);

      let width = 0;
      let height = 0;
      if (type === 'image' && this.isBrowser()) {
        try {
          const dimensions = await this.getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        } catch (e) {
          console.log('Could not get image dimensions:', e);
        }
      }

      const { data, error } = await supabase
        .from('media')
        .insert({
          key,
          title: metadata.title,
          description: metadata.description || '',
          type,
          url: publicUrl,
          thumbnail_url: publicUrl,
          category: metadata.category,
          tags: metadata.tags || [],
          width,
          height,
          size: file.size,
          alt: metadata.alt || metadata.title,
          uploaded_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Get all media
  async getMedia(category?: string, type?: string): Promise<MediaItem[]> {
    try {
      let query = supabase
        .from('media')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Get media error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Get media error:', error);
      return [];
    }
  }

  // Get active media (for frontend)
  async getActiveMedia(category?: string, type?: string): Promise<MediaItem[]> {
    try {
      let query = supabase
        .from('media')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Get active media error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Get active media error:', error);
      return [];
    }
  }

  // Update media
  async updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> {
    try {
      const { data, error } = await supabase
        .from('media')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update media error:', error);
      throw error;
    }
  }

  // Delete media
  async deleteMedia(id: string): Promise<boolean> {
    try {
      const { data: media, error: getError } = await supabase
        .from('media')
        .select('key')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      try {
        await supabase.storage
          .from('media')
          .remove([media.key]);
      } catch (e) {
        console.error('Storage delete error:', e);
      }

      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete media error:', error);
      throw error;
    }
  }

  // Get categories
  async getCategories(): Promise<MediaCategory[]> {
    try {
      const { data, error } = await supabase
        .from('media_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Get categories error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  // Toggle active status
  async toggleActive(id: string): Promise<MediaItem | null> {
    try {
      const { data: current } = await supabase
        .from('media')
        .select('is_active')
        .eq('id', id)
        .single();

      if (!current) return null;

      return this.updateMedia(id, { is_active: !current.is_active });
    } catch (error) {
      console.error('Toggle active error:', error);
      throw error;
    }
  }

  // Get media by key
  async getMediaByKey(key: string): Promise<MediaItem | null> {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Get media by key error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Get media by key error:', error);
      return null;
    }
  }

  // Sync existing images from site_images table
  async syncExistingImages(): Promise<{ synced: number; skipped: number }> {
    try {
      const { data: siteImages, error } = await supabase
        .from('site_images')
        .select('*')
        .not('url', 'is', null);

      if (error) {
        console.error('Error fetching site_images:', error);
        return { synced: 0, skipped: 0 };
      }

      let synced = 0;
      let skipped = 0;

      for (const img of siteImages || []) {
        const { data: existing } = await supabase
          .from('media')
          .select('id')
          .eq('key', img.key)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        let category = 'gallery';
        if (img.key.includes('hero') || img.key.includes('home')) category = 'hero';
        else if (img.key.includes('rental')) category = 'rentals';
        else if (img.key.includes('project')) category = 'projects';
        else if (img.key.includes('team')) category = 'team';

        const { error: insertError } = await supabase
          .from('media')
          .insert({
            key: img.key,
            title: img.label || img.key,
            description: img.alt || '',
            type: 'image',
            url: img.url,
            thumbnail_url: img.url,
            category: category,
            tags: [img.category || ''],
            alt: img.alt || '',
            is_active: true,
            uploaded_by: img.updated_by || null,
          });

        if (insertError) {
          console.error(`Error syncing image ${img.key}:`, insertError);
        } else {
          synced++;
        }
      }

      return { synced, skipped };
    } catch (error) {
      console.error('Error syncing existing images:', error);
      return { synced: 0, skipped: 0 };
    }
  }
}

export const mediaService = MediaService.getInstance();