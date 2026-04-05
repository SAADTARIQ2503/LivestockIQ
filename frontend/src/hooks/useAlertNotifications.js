import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsAPI } from '@/api/alerts';
import { useNotificationStore } from '@/store/notificationStore';
import { playAlertSound } from '@/utils/alertSound';

const SEVERITY_CONFIG = {
  critical: { toast: 'error',   label: '🚨 Critical Alert', duration: 8000, requireInteraction: true  },
  warning:  { toast: 'warning', label: '⚠️ Warning Alert',  duration: 5000, requireInteraction: false },
  info:     { toast: 'info',    label: 'ℹ️ Info Alert',     duration: 4000, requireInteraction: false },
};

/**
 * Polls active alerts every 30 s.
 *
 * Tracks which alert IDs have already been seen so notifications only
 * fire for alerts that were NOT present on the previous poll — regardless
 * of whether other alerts were resolved in between.
 *
 * On first successful fetch the current IDs become the silent baseline.
 * Every subsequent fetch compares against that baseline.
 */
export function useAlertNotifications() {
  const { addNotification } = useNotificationStore();
  const seenIds          = useRef(null);   // null = not yet initialised
  const permissionAsked  = useRef(false);

  // Request browser notification permission once
  useEffect(() => {
    if (permissionAsked.current || !('Notification' in window)) return;
    permissionAsked.current = true;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const { data, isSuccess } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn:  () => alertsAPI.getActiveAlerts(),
    refetchInterval: 30 * 1000,
    staleTime:       15 * 1000,
  });

  const raw          = data?.data?.results ?? data?.data ?? [];
  const activeAlerts = Array.isArray(raw) ? raw : [];

  // Stable string that only changes when the set of IDs changes
  const alertIdKey = activeAlerts.map(a => a.id).sort().join(',');

  useEffect(() => {
    // Don't do anything until we have a real response
    if (!isSuccess) return;

    if (seenIds.current === null) {
      // First successful fetch — silently record baseline, no notifications
      seenIds.current = new Set(activeAlerts.map(a => a.id));
      return;
    }

    // Find alerts whose ID was not in the previous snapshot
    const newAlerts = activeAlerts.filter(a => !seenIds.current.has(a.id));

    if (newAlerts.length > 0) {
      // Sound — use the highest severity in the batch
      const topSeverity = newAlerts.some(a => a.severity === 'critical') ? 'critical'
                        : newAlerts.some(a => a.severity === 'warning')  ? 'warning'
                        : 'info';
      playAlertSound(topSeverity);

      // Toast + browser push per alert
      newAlerts.forEach(alert => {
        const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;

        addNotification({
          type:     cfg.toast,
          title:    cfg.label,
          message:  alert.title,
          duration: cfg.duration,
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`LivestockIQ — ${cfg.label}`, {
            body:               `${alert.title}\n${alert.message}`,
            icon:               '/favicon.ico',
            tag:                `livestockiq-alert-${alert.id}`,
            requireInteraction: cfg.requireInteraction,
          });
        }
      });
    }

    // Update snapshot to current IDs
    seenIds.current = new Set(activeAlerts.map(a => a.id));

  }, [isSuccess, alertIdKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { activeAlerts, activeCount: activeAlerts.length };
}
