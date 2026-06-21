# Reeme - Social Media Networking App

A full-stack social media networking application built with:

- **Frontend:** React 19 + TypeScript + TanStack Router
- **Backend:** TanStack Start (SSR) + Nitro
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + Radix UI
- **Package Manager:** Bun

## Getting Started

### Install Dependencies
```bash
bun install
```

### Development
```bash
bun run dev
```

### Build
```bash
bun run build
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── integrations/    # Supabase and external services
├── lib/             # Utilities and helpers
├── routes/          # Page routes
├── server.ts        # SSR error handling
├── start.ts         # App initialization
├── router.tsx       # Router configuration
└── styles.css       # Global styles
```

## Environment Variables

Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_public_key
```

## Contributing

All changes are tracked through Lovable. Every commit to the dev branch syncs back to Lovable.
