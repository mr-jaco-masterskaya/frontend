import { create } from 'zustand';

import type { FeedbackAlert, NotificationVariant } from '@/entities/notifications/model/types';

export interface NotificationAlert {
  id: string;
  zoneName: string;
  variant: NotificationVariant;
}

export type AppAlert = NotificationAlert | FeedbackAlert;

interface NotificationStore {
  alerts: AppAlert[];
  addAlert: (alert: AppAlert) => void;
  addFeedback: (message: string, variant?: FeedbackAlert['variant']) => string;
  removeAlert: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  alerts: [],

  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, alert],
    })),

  addFeedback: (message, variant = 'error') => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({ alerts: [...state.alerts, { id, variant, message }] }));
    return id;
  },

  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
}));
