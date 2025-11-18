# FitTrack Editing Guide

## Project Overview

FitTrack is a gym workout tracking application with a React TypeScript frontend and Node.js Express backend using SQLite database. It supports user authentication, workout templates, active workout sessions, history tracking, and barcode scanning.

### Architecture

- **Frontend**: React + TypeScript + Vite, using TanStack Query for data fetching, React Router for routing, ShadCN UI components, Tailwind CSS for styling.
- **Backend**: Express.js server with routes for /auth, /templates, /history, /data. SQLite database with tables for users, exercises, templates, etc.
- **Deployment**: Docker setup with nginx for production.

### Directory Structure

```
/
├── public/         # Static assets (favicon, manifest, etc.)
├── src/
│   ├── components/ # Reusable UI components (NavBar, WorkoutCard, etc.)
│   ├── pages/      # Route components (Index, ActiveWorkout, etc.)
│   ├── context/    # React contexts (AuthContext)
│   ├── hooks/      # Custom hooks (useRemoteStorage, etc.)
│   ├── services/   # API service functions (workoutService.ts)
│   ├── types/      # TypeScript type definitions (workout.ts)
│   ├── utils/      # Utility functions (api.ts, auth.ts)
│   ├── App.tsx     # Main app component with routing
│   └── main.tsx    # React entry point
├── backend/
│   ├── routes/     # Express route handlers
│   ├── db.js       # SQLite database setup
│   └── server.js   # Express app setup
└── docker-compose.yml  # Docker services for frontend/backend/nginx
```

## How to Run the Application

### Development (with npm)
1. Create `.env.development` with `VITE_BASE_URL=http://localhost:3001/`
2. Install dependencies: `npm install` (root and backend/)
3. Start backend: `cd backend && npm start`
4. Start frontend: `npm run dev`
5. Frontend at localhost:5173, backend at localhost:3001/

### Docker Compose (with nginx proxy)
1. In production, set `VITE_BASE_URL=https://apimuscu.chocot.be/`
2. Run: `docker-compose up --build`
3. Frontend at localhost:8080, backend proxied at localhost:3001/ directly

### Production
- Docker build with env var `VITE_BASE_URL=https://apimuscu.chocot.be/`
- Works via nginx proxy.

## Editing the Frontend

### Adding a New Page
1. Create new component in `src/pages/`
2. Add route in `src/App.tsx` in the appropriate section (public or auth-required)
3. If auth-required, add to routes inside `<RequireAuth>`
4. Add NavBar link if needed in `src/components/NavBar.tsx`

### Modifying Components
- Use ShadCN UI components from `src/components/ui/` for consistency
- Apply Tailwind classes for styling
- Check TypeScript types in `src/types/`
- Use custom hooks in `src/hooks/` for data fetching/API calls

### Authentication
- Auth context in `src/context/AuthContext.tsx`
- Auth utilities in `src/utils/auth.ts`
- Requires JWT token stored in localStorage

## Editing the Backend

### Adding a New API Route
1. Create new file in `backend/routes/`
2. Export Express router with endpoints
3. Import and use in `backend/server.js`
4. Update CORS in server.js if needed

### Database Changes
- Schema in `backend/db.js`
- Migration: Add new table creates or ALTER TABLE in db.serialize()
- Use SQLite3 queries for CRUD operations

### Example: Adding User Profile Endpoint
1. In `backend/routes/data.js` or new file:
   ```js
   router.get('/profile/:userId', authMiddleware, (req, res) => {
     // Query db for user data
   });
   ```
2. Call from frontend using `src/services/workoutService.ts`

## Common Modification Patterns

### Service Layer
- Add new API calls to `src/services/workoutService.ts`
- Use TanStack Query hooks for caching/state management

### Forms
- Use React Hook Form with Zod validation
- UI components in `src/components/ui/`

### State Management
- Local component state with useState
- Server state with TanStack Query (async)
- Global: Context for auth

### Styling
- Tailwind: Utility-first classes
- Custom: Modify `tailwind.config.ts`
- Consistent components: ShadCN

### Authentication
- Check presence of localStorage "token"
- Wrap routes with RequireAuth component
- Clear token on logout

## Deployment

CI/CD with GitHub Actions in `.github/workflows/deploy.yml`
Builds and pushes Docker images to production.
Set environment variable `VITE_BASE_URL=https://apimuscu.chocot.be` in the build process.

## Database Access

The app uses SQLite stored in `/backend/data/data.sqlite3`.
- In development: Access directly in `backend/data/data.sqlite3`
- In Docker: Copy to local: `docker cp muscu-app-back:/app/data/data.sqlite3 ./local_db.sqlite3`
- View/edit with DB Browser for SQLite (free cross-platform tool) or sqlite3 CLI.

## Best Practices

- TypeScript: Strong typing for reliability
- Component composition over inheritance
- Separation: Backend API, frontend UI, database schema
- Version control: Frequent commits, descriptive messages
