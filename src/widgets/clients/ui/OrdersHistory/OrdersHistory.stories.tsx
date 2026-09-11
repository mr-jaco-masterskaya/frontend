import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { OrdersHistory } from './OrdersHistory';
import { orderHistoryMock } from '../../data/mocks';

const meta = {
  title: 'Widgets/OrdersHistory',
  component: OrdersHistory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrdersHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return <OrdersHistory {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />;
  },
  args: { 
    orders: orderHistoryMock, 
    isOpen: false,
    onClose: () => {},
  },
};

export const ManyOrders: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return <OrdersHistory {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />;
  },
  args: {
    orders: Array(15).fill(null).map((_, i) => ({
      orderId: i + 1,
      pointId: 1,
      date: '01.10.25',
      orderNumber: `#0${i + 1}`,
      status: 'Доставлен',
      total: 1000 + i * 100,
      canRepeat: i < 3,
      onShowComposition: () => alert(`Состав #${i + 1}`),
      onRepeat: () => alert(`Повторить #${i + 1}`),
    })),
    isOpen: false,
    onClose: () => {},
  },
};