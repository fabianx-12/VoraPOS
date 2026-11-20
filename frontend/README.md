# VoraPOS - Frontend Desktop Application (UI Layer)

This directory houses the desktop presentation tier for the **VoraPOS** touchscreen Point of Sale terminal.

---

## 🗂️ Architecture & Organization

```text
frontend/
├── package.json               # Frontend dependencies (React, Vite, Lucide icons)
├── tsconfig.json              # Strict TypeScript bundler configuration
└── src/
    ├── components/            # Reusable design system (Keypad, Modals, Buttons, Receipts)
    ├── views/                 # Top-level screen views
    │   ├── CheckoutView.tsx   # Fast cashier scanning, split payments & cart
    │   ├── CatalogView.tsx    # Product catalog lookup & stock indicators
    │   └── ShiftView.tsx      # Cash drawer opening float, closing count & Z-Report
    ├── hooks/                 # React state hooks (useBarcodeScanner, useCart)
    └── services/              # Type-safe IPC integration with the backend core
        └── ipc-client.ts      # Typed window.electronAPI wrapper
```

---

## 🔌 IPC Communication
The frontend communicates with the local backend core exclusively over typed IPC channels:
- `sales:create`: Dispatches validated checkout orders.
- `sales:void`: Submits supervisor-approved sale void requests.
- `printer:status`: Polls ESC/POS thermal printer health (`READY`, `OUT_OF_PAPER`, etc.).
