# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app focused on rendering and user interaction only. Use the existing shared API client and relative `/api` requests so the browser never depends on a public Codespaces URL. UI work should remain thin and should not contain business rules or data access logic.
- Logic tier decision: Implement all behavior in Express route handlers plus explicit service functions under `octofit-tracker/backend/src/services`. Validate incoming payloads in the service layer, return deliberate `4xx` errors for client mistakes, and keep database concerns out of the route code.
- Data tier decision: Keep Mongoose schemas responsible for required-field validation and stable identifiers. Use `seed.ts` for demo fixtures and upserts so repeat runs preserve unrelated records while reconciling the seeded demo user’s previous team membership.
- Activity tracking approach: Add validation for `userId`, `teamId`, `type`, and `minutes`; reject invalid or unknown IDs with a 400/404-style API response instead of a cast error or 500. Compute points from duration and activity type (for example, run, cycle, strength) and stamp `occurredAt` automatically.
- Team management approach: Ensure `name` and `mascot` are required, `members` defaults to an empty array, and team creation updates each referenced member’s `team` field so the relationship stays consistent. Team listing should expose member IDs in a predictable order.
- Leaderboard approach: Aggregate activity points by team, group across all team activities, and sort descending by `totalPoints` with a 1-based `rank`. Keep the result deterministic by ordering ties on team id or name in a stable way.
- Workout suggestions approach: Resolve the user by email, then rank workouts by similarity to the user's recent activities and fitness goal. Return a top suggestion with a `focus` matching that pattern and a human-readable `reason` explaining why it was chosen. Unknown email addresses should produce a 4xx response.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Confirms the Mongoose validation rules and fixture seed behavior are correct. Failures here usually mean the schema is missing required fields or that the demo seed is not reconciling team membership properly.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Verifies `/api/activities`, `/api/teams`, `/api/leaderboard`, and `/api/workouts/suggestions/:userEmail` match the expected contract. Failures indicate missing validation, empty aggregator output, or incorrect recommendation logic.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Ensures the presentation layer handles API data correctly and that UI state matches the expected OctoFit workflow.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Checks TypeScript compilation for the server and data layer, catching invalid types or incorrect imports.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Verifies the React app bundles successfully and that the API client contracts still line up with the backend response shapes.

Implementation flow order:

1. Fix the schema validation in the data tier so the contract failures are eliminated at the source.
2. Implement the activity and team services with deliberate 4xx validation and stable creation behavior.
3. Implement leaderboard aggregation and workout suggestion ranking against the seeded users.
4. Validate the frontend with its tests and build commands once the API contract is stable.
5. Re-run the backend build and targeted tests after each change to confirm the fix remains narrow and correct.
