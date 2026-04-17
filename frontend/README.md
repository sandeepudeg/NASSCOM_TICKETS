# Tickets Folder Frontend

React 18 + TypeScript frontend for the AI-powered IT ticket routing and resolution platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **Zustand** - State management
- **TanStack Query** - Server state management
- **React Router v6** - Routing
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client layer
│   │   ├── client.ts     # Axios instance with interceptors
│   │   ├── folders.ts    # Folder API endpoints
│   │   ├── tickets.ts    # Ticket API endpoints
│   │   ├── classification.ts  # Classification API endpoints
│   │   ├── model.ts      # Model metrics API endpoints
│   │   └── types.ts      # TypeScript types
│   ├── auth/             # Authentication
│   │   ├── tokenStorage.ts    # In-memory JWT storage
│   │   ├── authApi.ts         # Auth API endpoints
│   │   ├── useAuth.ts         # Auth state hook
│   │   └── ProtectedRoute.tsx # Route guard component
│   ├── components/       # React components
│   │   ├── Layout.tsx    # Main layout with header
│   │   └── FolderSidebar.tsx  # Folder navigation sidebar
│   ├── stores/           # Zustand stores
│   │   └── folderStore.ts     # Folder selection state
│   ├── App.tsx           # Root component with routes
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Dependencies
```

## API Client

The API client (`src/api/client.ts`) includes:

- **JWT Bearer token injection** - Automatically adds Authorization header
- **RFC 7807 error normalization** - Converts all errors to Problem Details format
- **401 handling** - Clears token and redirects to login on unauthorized
- **Network error handling** - Graceful fallback for connection issues

## Authentication

- **In-memory token storage** - Tokens stored in memory (not localStorage) for security
- **Protected routes** - Route guards redirect unauthenticated users to login
- **Token refresh** - Automatic token refresh on 401 responses (to be implemented)
- **Session expiry handling** - Graceful session expiry with user notification

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test
```

## Development Guidelines

1. **Type Safety** - All API responses and component props must be typed
2. **Error Handling** - Use RFC 7807 Problem Details for all errors
3. **State Management** - Use Zustand for UI state, TanStack Query for server state
4. **Code Style** - Follow ESLint rules, use Prettier for formatting
5. **Component Structure** - Keep components small and focused

## Next Steps

The following pages need to be implemented (Task 15):

- TicketSubmissionForm (`/tickets/new`)
- ClassificationResultPanel (`/tickets/:id`)
- TicketListPage (`/tickets`)
- EscalationQueuePage (`/escalations`)
- PatternAlertsPage (`/pattern-alerts`)
- DashboardPage (`/dashboard`)
- ModelPerformancePage (`/model/metrics`)

## License

See root project LICENSE file.
