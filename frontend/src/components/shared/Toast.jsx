import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { X } from 'lucide-react';

/**
 * Toast Notification Component
 * Displays notifications from the notification store
 */
export default function Toast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast Item
 */
function ToastItem({ notification, onClose }) {
  const { type, title, message, duration } = notification;

  // Auto-close after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Determine background color based on type
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type] || 'bg-gray-500';

  return (
    <div
      className={`${bgColor} text-white rounded-lg shadow-lg p-4 flex items-start justify-between min-w-[300px] animate-slide-in`}
      role="alert"
    >
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        {message && (
          <p className="text-sm opacity-90">{message}</p>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}   