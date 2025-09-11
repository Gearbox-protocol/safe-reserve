# Safe Reserve

## Getting Started

Follow these steps to start the application:

1. **Install Dependencies**
   ```sh
   pnpm install
   ```
2. **Configure Environment Variables**
   ```sh
   cp .env.example .env.local
   ```
3. **Start the Development Server**
   ```sh
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Environment Variables

Ensure the following environment variables are properly configured:

- `NEXT_PUBLIC_ADDRESS_PROVIDER` – Address provider address
- `NEXT_PUBLIC_RPC_URL` – Mainnet RPC URL
- `NEXT_PUBLIC_DRPC_API_KEY` – DRPC RPC access key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` – WalletConnect Project ID
  - You can get this from [WalletConnect Cloud](https://cloud.walletconnect.com/)

---

## Scripts Information

Available scripts for development and maintenance:

- **Development**

  ```sh
  pnpm dev
  ```

  Starts the development server.

- **Build**

  ```sh
  pnpm build
  ```

  Creates a production build.

- **Production**

  ```sh
  pnpm start
  ```

  Runs the production server.

- **Type Checking**
  ```sh
  pnpm typecheck:ci
  ```
  Runs TypeScript type checking.

---

## Project Structure

The project follows a modular architecture with the following key directories:

- `app/` – Next.js app directory containing pages and layouts
- `components/` – Reusable React components
- `contracts/` – Smart contract definitions and ABIs
- `core/` – Core application logic and business rules
- `hooks/` – Custom React hooks
- `lib/` – Utility functions and shared libraries
- `public/` – Static assets
- `routes/` – Application routing configuration
- `utils/` – Helper functions and utilities
- `views/` – Page-specific components and logic
