# AI PRO STUDIO ULTIMATE V3 — Vercel Deploy Guide (Online + Offline)

1. Extract `AI_PRO_STUDIO_VERCEL_PRO.zip` and upload all files (`index.html`, `sw.js`, `vercel.json`, `package.json`, `api/`, `firebase/`) to a GitHub repository.
2. Open **Vercel** -> **Add New -> Project** -> Import your GitHub repo.
3. Framework Preset: **Other** (leave Build Command & Output Directory blank/default).
4. Under **Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: *(your free Google AI Studio key)*
5. Click **Deploy**. Live in ~30 seconds at `https://your-project.vercel.app`!
6. Add `your-project.vercel.app` to **Firebase Console -> Authentication -> Settings -> Authorized domains** for Google Sign-In.
7. Open on Android Chrome -> **Install App** — works **BOTH Online (Gemini Cloud AI + Firebase) AND Offline (`sw.js` PWA + Magic AI Clean 5MP->HD + All-in-One Editing Dock + 432 Poses + 1,080+ Frames + Video Maker)**!
