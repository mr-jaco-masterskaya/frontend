'use client';

import { useEffect, useRef } from 'react';
import { notificationsApi } from '@/entities/notifications/api/notificationsApi';
import { useNotificationStore } from '@/entities/notifications/store/Notification/Notification';
import { CafeAvailableNotification, CafeStoppedNotification, FeedbackNotification } from '../Notification/Notification';
import './NotificationHost.styles.css';

const POLL_INTERVAL_MS = 30_000;

export const NotificationHost = () => {
  const alerts = useNotificationStore((state) => state.alerts);
  const addAlert = useNotificationStore((state) => state.addAlert);
  const cursor = useRef<number | undefined>(undefined);
  const seen = useRef(new Set<number>());

  useEffect(() => {
    let disposed = false;
    const poll = async () => {
      try {
        const page = await notificationsApi.list({ afterId: cursor.current, unread: true, limit: 50 });
        if (disposed) return;
        if (page.nextAfterId !== null) cursor.current = page.nextAfterId;
        for (const notification of page.items) {
          if (seen.current.has(notification.id)) continue;
          seen.current.add(notification.id);
          if (notification.type !== 'cafe.stopped' && notification.type !== 'cafe.available') continue;
          const pointId = notification.data.point_id;
          addAlert({
            id: String(notification.id),
            zoneName: typeof pointId === 'number' || typeof pointId === 'string' ? `Точка №${pointId}` : 'Жако',
            variant: notification.type,
          });
          void notificationsApi.markRead(notification.id).catch(() => undefined);
        }
      } catch {
        // Notifications are advisory; a failed poll must not affect the workspace.
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [addAlert]);

  return (
    <aside className="notification-host" aria-live="polite" aria-label="Уведомления">
      {alerts.map((alert) => {
        if ('message' in alert) {
          return <FeedbackNotification key={alert.id} id={alert.id} message={alert.message} variant={alert.variant} />;
        }
        return alert.variant === 'cafe.stopped'
          ? <CafeStoppedNotification key={alert.id} id={alert.id} zoneName={alert.zoneName} />
          : <CafeAvailableNotification key={alert.id} id={alert.id} zoneName={alert.zoneName} />;
      })}
    </aside>
  );
};
