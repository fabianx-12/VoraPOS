import React, { useState } from 'react';
import { PosIpcClient } from '../services/ipc-client.js';

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  taxAmountCents: number;
}

export const CheckoutView: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: 'p0000001-0000-4000-8000-000000000001',
      name: 'Natural Mineral Water 500ml',
      quantity: 1,
      unitPriceCents: 150,
      taxAmountCents: 24,
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const totalCents = cart.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await PosIpcClient.createSale({
        registerSessionId: 'rs000001-0000-4000-8000-000000000001',
        userId: 'u0000001-0000-4000-8000-000000000001',
        customerId: null,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineDiscountCents: 0,
          taxAmountCents: item.taxAmountCents,
        })),
        payments: [
          {
            method: 'CASH',
            amountCents: totalCents,
            transactionReference: 'CASH-EXACT',
          },
        ],
      });

      if (response.success && response.data) {
        setLastReceipt(response.data.receiptNumber);
        setCart([]);
      } else {
        alert(`Checkout failed: ${response.error?.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>VoraPOS - Cashier Checkout</h1>
      {lastReceipt && (
        <div style={{ padding: '12px', background: '#e6fffa', border: '1px solid #38b2ac', borderRadius: '6px' }}>
          Sale completed successfully! Receipt: <strong>{lastReceipt}</strong>
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <h3>Current Cart ({cart.length} items)</h3>
        <ul>
          {cart.map((item, idx) => (
            <li key={idx}>
              {item.name} x{item.quantity} - ${(item.unitPriceCents / 100).toFixed(2)}
            </li>
          ))}
        </ul>
        <h2>Total: ${(totalCents / 100).toFixed(2)}</h2>
        <button
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            background: '#3182ce',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {isProcessing ? 'Processing Transaction...' : 'Pay Exact Cash ($' + (totalCents / 100).toFixed(2) + ')'}
        </button>
      </div>
    </div>
  );
};
