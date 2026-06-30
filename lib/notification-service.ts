import { supabase } from "@/integrations/supabase/client";
import { showNotificationToast } from "@/components/NotificationToast";

export type NotificationType = 
  | 'booking_created'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_completed'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'customer_created'
  | 'rental_created'
  | 'system_alert'
  | 'general_info';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
  priority: number;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationCallbacks: ((notification: Notification) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  subscribe(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as Notification[];
  }

  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  }

  async markAllAsRead(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return false;
    }

    return true;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  }

  async deleteAllRead(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true);

    if (error) {
      console.error('Error deleting read notifications:', error);
      return false;
    }

    return true;
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    link?: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
        console.error('Only admins can create notifications');
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          link,
          metadata: metadata || {},
          priority: 0,
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  showToast(notification: Notification) {
    showNotificationToast(notification);
  }
}

export const notificationService = NotificationService.getInstance();