# Greenfield Farm Desk

Greenfield Farm Desk is a React dashboard backed by an authenticated Express API and MongoDB. Farmers can create, edit, and remove their farm records, then search by farm name, location, or crop and filter by season stage.

## Requirements

- Node.js 20.19+ or 22.12+ and npm
- MongoDB locally, or a MongoDB Atlas connection string
- Git for hosted deployments

## Local Setup

1. Install backend dependencies:

   ```powershell
   cd backend
   npm install
   ```

2. Create `backend/.env` with the following values. Use a private, randomly generated `JWT_SECRET` outside local development.

   ```dotenv
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/greenfield-farm-coop
   JWT_SECRET=replace-with-a-long-random-secret
   CLIENT_ORIGIN=http://localhost:3000
   ```

   For Atlas, replace `MONGODB_URI` with the Atlas URI and make sure the database user's permissions and Atlas network access rules allow the backend to connect.

3. Start the API in one terminal:

   ```powershell
   cd backend
   npm run dev
   ```

   The API listens on `http://localhost:5000`. Check `http://localhost:5000/api/health` for its health response.

4. Install and start the frontend in another terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`. The frontend defaults to `http://localhost:5000/api`; set `VITE_API_URL` in `frontend/.env.local` only when the API is hosted somewhere else.

## Tests and Production Build

Run the backend integration suite:

```powershell
cd backend
npm test
```

The tests use `mongodb-memory-server` and cover registration, authentication, farm ownership, and combined search/stage filtering. Run the frontend production build with:

```powershell
cd frontend
npm run build
```

## Farm List API

`GET /api/farms` requires a bearer token. Optional query parameters are:

- `search`: case-insensitive literal match against `farmName`, `location`, or `cropType` (maximum 100 characters)
- `filter`: `all`, `growing`, `planning`, `upcoming`, or `harvested`; defaults to `all`

For example:

```text
GET /api/farms?search=rice&filter=growing
Authorization: Bearer <token>
```

The API always scopes results to the authenticated owner. An unsupported filter returns HTTP 400.

## Deploy Backend to Render

The repository includes a Render Blueprint at `render.yaml`. Create a free MongoDB Atlas cluster first, then:

1. Push this repository to a Git provider supported by Render.
2. In Render, create a new Blueprint deployment from the repository and select the `render.yaml` service `greenfield-farm-api`.
3. Set `MONGODB_URI` to the Atlas connection string. Atlas must allow connections from Render; for a quick free-tier setup, configure Atlas network access accordingly and use a database-specific user.
4. Wait for the service to deploy and verify `https://<render-service>.onrender.com/api/health`.
5. Keep the Render service URL for the Vercel `VITE_API_URL` setting. Render's free web service may spin down while idle, so the first request after inactivity can take longer.

The Blueprint creates a random `JWT_SECRET`. Do not commit `.env` files or put secrets in frontend variables.

## Deploy Frontend to Vercel

The frontend includes `frontend/vercel.json` for Vite output and SPA routing.

1. Import the repository in Vercel and set the project root (Root Directory) to `frontend`.
2. Set the production environment variable `VITE_API_URL` to `https://<render-service>.onrender.com/api`.
3. Deploy. Vercel builds with `npm run build` and serves `dist`.
4. Copy the production Vercel origin, such as `https://greenfield-farm-desk.vercel.app`, into Render's `CLIENT_ORIGIN` environment variable. Use only the origin, without a trailing path or `/api`.
5. Redeploy/restart the Render service so the CORS change takes effect, then verify registration/login and farm filtering from the Vercel URL.

If using a Vercel preview URL, add its exact origin to Render's `CLIENT_ORIGIN` as a comma-separated entry alongside the production origin. The API intentionally rejects browser origins that are not configured.

## Environment Variables

Backend variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000` and is supplied by Render in production. |
| `NODE_ENV` | No | Set to `production` on the host. |
| `MONGODB_URI` | Yes in production | MongoDB connection string. |
| `JWT_SECRET` | Yes in production | Secret used to sign and verify login tokens. |
| `CLIENT_ORIGIN` | Yes for hosted browser access | Comma-separated allowed frontend origins. |

Frontend variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes for production | API base URL, including `/api`, for example `https://api.example.com/api`. |