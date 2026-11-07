# Sky Duet ☁️ — long-distance karaoke for two

A mobile-first sky-blue duet room with six-character codes, browser-to-browser video calling, synchronized scrolling lyrics, English/తెలుగు lyric toggle, timed `.lrc` import, local audio playback, camera/mic controls, and optional soft-focus video background, floating heart reactions, a shared note, and an in-room together timer.

## Deploy on GitHub Pages

1. Create a **new public repository** named `karaoke` (do not add these files to an existing repository).
2. Upload `index.html`, `style.css`, and `app.js` to its root, or push the contents of this folder to its default branch.
3. Go to **Settings → Pages → Build and deployment → Deploy from a branch**, choose your default branch and `/ (root)`, then save.
4. Open `https://YOUR-USERNAME.github.io/karaoke/` over HTTPS. Browser camera/microphone require a secure origin.

## Live calls and pairing configuration

GitHub Pages only hosts static files. WebRTC needs signaling. This app uses **Supabase Realtime Broadcast and Presence** and needs a Supabase project.

1. Create a Supabase project at <https://supabase.com>.
2. In the app's **Connection settings**, paste your **project URL** and **publishable/anon public key**, never a secret or service-role key.
3. Configure the same project in each browser, grant camera/mic permission, create a room on one device, and open its invite link on the other.
4. If Supabase Realtime private-channel policies are enabled, configure appropriate policies or use public channels for this demo. Public-channel pairing codes are **not secure authentication**; use only for casual private sessions, not sensitive information.
5. WebRTC uses public STUN only: calls may fail on restrictive networks. For dependable worldwide use, provision a properly authenticated TURN service; TURN credentials should be issued by a backend, not placed permanently into public source code.

## Lyrics and music

- Paste **lyrics you own or are allowed to reproduce** into the English/transliteration and Telugu fields. Matching lyric rows let each partner choose a script.
- Import `.txt` or `.lrc` files. LRC timestamps are supported for the English lyric field; matching Telugu lines can use the same timing.
- `Play` starts or resumes the scrolling teleprompter on both devices, while `Pause` and `Restart` sync.
- The backing-track picker only plays **local audio on the device selecting it**, and does not transmit music to the other participant.
- Do **not** scrape and republish full lyrics from publicly readable lyric sites without a license or source permission. Public accessibility does not itself confer copying rights. Future integration can use an appropriately licensed lyric API or provider-approved embedding where available. Cite and comply with each source's rights and terms.

## Limitations of this prototype

- Not production-ready: pairing codes aren't account authentication, signaling is open to users with the code, and session lifecycle has not been independently tested on two real devices.
- Connection reliability needs TURN, robust reconnect handling, and abuse controls.
- Mobile browsers may require user interaction for audio playback.
- English/తెలుగు toggle switches between text supplied for each language; **automatic translation/transliteration is not included**.
- This project does not claim an unlimited legal catalog of commercial song lyrics or licensed karaoke instrumentals.

## Couple features in this revision
- **Send a heart:** animated blue/pink hearts float over the video and are broadcast to your partner.
- **Little note:** type a short message (up to 180 characters) displayed on both screens; messages are not persisted to a database.
- **Together timer:** each browser shows time since it opened its room; this is not a server-synchronized call duration.
- **Song indicator:** shows the title typed locally.

### Privacy and reliability
This is still a prototype. Public Supabase Realtime channels are not end-to-end authenticated by a six-character pairing code. Do not exchange private messages or sensitive details. For production, implement authenticated short-lived room membership and server-issued TURN credentials, rate limiting, and proper network/device testing. No audio or video is saved by this app.