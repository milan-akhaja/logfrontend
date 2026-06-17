# LOG Frontend

React/Vite frontend for the LOG storefront.

## Local Run

```bash
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the backend host, for example:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
VITE_APP_BASE_PATH=/
```

If the frontend is deployed under a subpath, set `VITE_APP_BASE_PATH` to that path, for example `/logfrontend/`.

## Build

```bash
npm run build
```

The deployable frontend output is generated in `dist/`.

## AWS Amplify

Use the root `amplify.yml` file in this repository. In Amplify environment variables, set:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

Add a single-page app rewrite in Amplify:

```text
Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|webp|woff|woff2)$)([^.]+$)/>
Target: /index.html
Type: 200 (Rewrite)
```
