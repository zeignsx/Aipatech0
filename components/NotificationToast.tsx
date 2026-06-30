import React from 'react';
import { toast } from 'sonner';
import { Notification } from '@/lib/notification-service';

const iconMap: Record<string, string> = {
  booking_created: '📋',
  booking_approved: '✅',
  booking_rejected: '❌',
  booking_completed: '🎉',
  invoice_created: '📄',
  invoice_paid: '💰',
  invoice_overdue: '⚠️',
  customer_created: '👤',
  rental_created: '🔧',
  system_alert: '🔔',
  general_info: 'ℹ️'
};

export function showNotificationToast(notification: Notification) {
  const icon = iconMap[notification.type] || '🔔';

  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } pointer-events-auto flex w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5`}
      onClick={() => {
        toast.dismiss(t);
        if (notification.link) {
          window.location.href = notification.link;
        }
      }}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="text-2xl">{icon}</div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            {notification.body && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {notification.body}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t);
            // Mark as read logic would go here
          }}
          className="flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-400"
        >
          Dismiss
        </button>
      </div>
    </div>
  ));
}