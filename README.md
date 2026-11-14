# Zyro Legend WhatsApp Bot

## Files
- `index.js` - bot entry point
- `package.json` - Node.js dependencies and start command
- `render.yaml` - Render Background Worker configuration

## Render setup
1. Create a **Background Worker** connected to this GitHub repository.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add environment variable `PHONE_NUMBER` with your WhatsApp number including country code, digits only (example format: `2526XXXXXXXX`).
5. Keep `AUTH_DIR` as `/var/data/auth_info`.
6. A persistent disk mounted at `/var/data` is needed to retain the WhatsApp login after restarts. If your Render plan does not support disks, the session may be lost after a restart.

## Pairing
1. Deploy the worker.
2. Open Render Logs and find `ZYRO WHATSAPP PAIRING CODE`.
3. On your own WhatsApp phone, open **Linked devices** > **Link a device** > **Link with phone number instead**.
4. Enter the pairing code shown in Render Logs.

Never share the pairing code, WhatsApp session files, or environment values with anyone.

## Commands
- `!menu`
- `!ping`
- `!groupinfo` (groups only)

This is a minimal starter bot. It does not include bulk messaging or mass-tagging features.
