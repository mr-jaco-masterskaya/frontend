import type { Meta, StoryObj } from '@storybook/react-vite';
import { CafeStoppedNotification, CafeAvailableNotification } from './Notification';
import { useNotificationStore } from '@/entities/notifications/store/Notification/Notification';

const meta: Meta<typeof CafeStoppedNotification> = {
  title: 'Widgets/Notification',
  component: CafeStoppedNotification,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof CafeStoppedNotification>;

export const Default: Story = {
  loaders: [
    () => {
      useNotificationStore.setState({
        alerts: [
          { id: '1', zoneName: 'Зона №1', variant: 'cafe.stopped' },
          { id: '2', zoneName: 'Зона №2', variant: 'cafe.available' },
        ],
      });
    },
  ],
  render: () => {
    const alerts = useNotificationStore((state) => state.alerts);

    return (
      <div className="notifications-wrapper">
        {alerts.map((alert) =>
          alert.variant === 'cafe.stopped'
            ? <CafeStoppedNotification key={alert.id} id={alert.id} zoneName={alert.zoneName} />
            : alert.variant === 'cafe.available'
              ? <CafeAvailableNotification key={alert.id} id={alert.id} zoneName={alert.zoneName} />
              : null
        )}
      </div>
    );
  },
};

