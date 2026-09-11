import { Text } from "@/shared/ui/Typography/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { NotificationProps, NotificationConfig } from "./Notification.types";
import './Notification.style.css';
import { useNotificationStore } from "@/entities/notifications/store/Notification/Notification";

const cssClassByVariant = {
  'cafe.stopped': 'cafe-stopped',
  'cafe.available': 'cafe-available',
} as const;

const withNotification = ({ variant, text }: NotificationConfig) => {
  return function Notification({ id, zoneName }: NotificationProps) {
    const removeAlert = useNotificationStore((state) => state.removeAlert);
    
    return (
      <div className={`notification-container ${cssClassByVariant[variant]}`}>
        <div className="notification-text">
          <Text variant="heading-l-regular-20">{zoneName}</Text>
          <Text variant="heading-l-regular-20">{text}</Text>
        </div>
        <CloseButton onClick={() => removeAlert(id)}/>
      </div>
    );
  };
};

export const CafeStoppedNotification = withNotification({
  variant: "cafe.stopped",
  text: "Внимание! Прием заказов временно приостановлен!",
});

export const CafeAvailableNotification = withNotification({
  variant: "cafe.available",
  text: "Приём заказов возобновлён! Спасибо за ожидание!",
});

const CloseButton = ({onClick}: {onClick: ()=> void}) => (
  <button
    onClick={onClick}
    className="close-button"
  >
    <span className="absolute w-[1.5px] h-[20px] rotate-45  bg-current"/>
    <span className="absolute w-[1.5px] h-[20px] -rotate-45 bg-current"/>
  </button>
);

export const FeedbackNotification = ({ id, message, variant }: { id: string; message: string; variant: 'error' | 'success' }) => {
  const removeAlert = useNotificationStore((state) => state.removeAlert);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => removeAlert(id), 180);
  }, [id, isClosing, removeAlert]);

  useEffect(() => {
    const timeout = window.setTimeout(dismiss, 6000);
    return () => {
      window.clearTimeout(timeout);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, [dismiss]);

  return (
    <div className={`feedback-notification feedback-notification--${variant}${isClosing ? ' feedback-notification--closing' : ''}`} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="feedback-notification__message">{message}</span>
      <button
        type="button"
        className="feedback-notification__close"
        aria-label="Закрыть уведомление"
        onClick={dismiss}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
};
