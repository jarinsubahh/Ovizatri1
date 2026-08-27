# OVIZATRI

A frontend prototype for **OVIZATRI**, a Bangladesh tourism guide and tour-booking platform, built as a DBMS course project. This repository contains the **frontend only** — there is no backend or database connected yet.

## Tech stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/) for routing
- Plain CSS with a shared design-token stylesheet (no CSS framework)
- Mock data + `localStorage` standing in for a backend API (see [Data layer](#data-layer))

## Getting started

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Project structure

```
src/
  assets/images/        The 5 supplied photographs (hero slideshow + destination imagery)
  components/
    common/              Shared small components (StarRating, ProtectedRoute)
    home/                Hero slideshow
    layout/              Navbar, Footer, DashboardShell (sidebar layout for dashboards)
  context/
    AuthContext.jsx      Mock authentication (traveler / agency / admin roles)
  data/
    mockData.js          Static seed data modeled on the ERD entities
    store.js             localStorage-backed mutable data (bookings, saved items, blogs,
                          agency packages/schedules, audit log) — swap for real API calls later
  pages/
    auth/                Traveler & agency sign in/up, admin sign in
    destinations/        Destination discovery + details
    packages/            Tour package listing + details
    booking/             Booking flow (schedule → review → payment placeholder) + confirmation
    blog/                Blog listing, details, create/edit
    user/                Traveler dashboard (bookings, saved items, blogs, profile)
    agency/              Agency dashboard, package management, package form, agency profile
    admin/                Admin dashboard, agency verification, agency audit log
  styles/                Shared CSS for listing grids and detail pages
  App.jsx                Route table
  main.jsx               Entry point
```

## Data model

The frontend structure follows the project ERD directly: `ACCOUNT`, `USER`, `AGENCY`, `ADMIN`,
`ADDRESS`, `DESTINATION`, `TOUR_PACKAGE`, `TOUR_SCHEDULE`, `ITINERARY`, `ITINERARY_DAY`,
`DAY_ACTIVITY`, `AMENITY`, `BOOKING`, `PAYMENT`, `REVIEW`, `BLOG`, and `AGENCY_AUDIT_LOG`.
Field names in `mockData.js` and throughout the forms match the ERD's attribute names so that
wiring up a real PostgreSQL-backed API later should mostly mean replacing the functions in
`src/data/` with `fetch` calls — page components should not need to change shape.

### Data layer

- **`mockData.js`** — static seed data: destinations, agencies, packages, schedules, amenities,
  demo login accounts, reviews, and blog seed content.
- **`store.js`** — a small `localStorage`-backed layer for data the user can create or change
  during a session (bookings, saved destinations/packages, blog posts, agency-managed packages
  and schedules, the agency audit log). Each function here is a natural place to swap in a real
  API call once the backend exists.
- **`AuthContext.jsx`** — mock sign-in/sign-up for the three account types. Validates against the
  demo accounts in `mockData.js` and persists the "session" to `localStorage`.

### Demo accounts

| Role     | Email                          | Password      |
|----------|--------------------------------|---------------|
| Traveler | traveler@ovizatri.test         | password123   |
| Agency   | contact@bengaltrails.example.com | agency123   |
| Admin    | admin@ovizatri.test             | admin123     |

Sign-up forms also work and log you in immediately as a new mock account.

## Homepage hero images

The homepage hero uses exactly the 5 photographs supplied for the project
(`src/assets/images/`), corresponding to Kuakata Beach, Sajek Valley, Bichanakandi, the
Sundarbans, and Cox's Bazar. They cross-fade continuously with no blank frame between
transitions (`src/components/home/Hero.jsx` / `Hero.css`). To swap an image, replace the
corresponding file in `src/assets/images/` (keep the same filename) or update the import in
`src/data/mockData.js`.

## Connecting a real backend later

This app is intentionally structured so a future PostgreSQL + API backend can be wired in with
minimal rewrites:

1. Replace the functions in `src/data/store.js` and `src/data/mockData.js` with calls to your
   API (e.g. `fetch('/api/packages')`), keeping the same function names and return shapes where
   possible.
2. Replace `AuthContext.jsx`'s `login` / `signUpUser` / `signUpAgency` with real API calls and
   token/session handling.
3. Page components only import from `data/` and `context/`, so most of the UI should not need to
   change.

## Notes

- This is a frontend-only prototype for a course project — there is no real payment gateway,
  email delivery, or file upload handling behind the forms shown.
- Data created during a session (bookings, blog posts, new packages) is stored in the browser's
  `localStorage` and will reset if it is cleared.
