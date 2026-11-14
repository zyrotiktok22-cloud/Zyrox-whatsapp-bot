const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const PHONE_NUMBER = (process.env.PHONE_NUMBER || "").replace(/\D/g, "");
const AUTH_DIR = process.env.AUTH_DIR || "/var/data/auth_info";
const PREFIX = process.env.PREFIX || "!";

if (!PHONE_NUMBER) {
  console.error("Missing PHONE_NUMBER. Add your WhatsApp number with country code in Render Environment.");
  process.exit(1);
}

async function startBot() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Zyro Legend Bot", "Chrome", "1.0.0"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting" && !sock.authState.creds.registered) {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log("\n==================================");
        console.log("ZYRO WHATSAPP PAIRING CODE:", code);
        console.log("WhatsApp > Linked devices > Link with phone number");
        console.log("==================================\n");
      } catch (err) {
        console.error("Could not generate pairing code:", err.message);
      }
    }

    if (connection === "open") {
      console.log("Zyro WhatsApp Bot connected successfully.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnect:", shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startBot().catch(console.error), 3000);
      } else {
        console.error("WhatsApp logged out. Clear the saved auth folder and pair again.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid || jid === "status@broadcast") continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      const command = text.trim().split(/\s+/)[0].toLowerCase();
      const reply = (message) => sock.sendMessage(jid, { text: message }, { quoted: msg });

      try {
        if (command === `${PREFIX}menu`) {
          await reply(
            "👑 *ZYRO LEGEND BOT*\n\n" +
            `${PREFIX}menu - Show commands\n` +
            `${PREFIX}ping - Check bot status\n` +
            `${PREFIX}groupinfo - Group details\n\n` +
            "Legend Never Fails."
          );
        } else if (command === `${PREFIX}ping`) {
          await reply("🏓 Zyro Bot is online!");
        } else if (command === `${PREFIX}groupinfo`) {
          if (!jid.endsWith("@g.us")) {
            await reply("This command works in groups only.");
            continue;
          }
          const metadata = await sock.groupMetadata(jid);
          await reply(
            `📌 *${metadata.subject}*\n` +
            `👥 Members: ${metadata.participants.length}\n` +
            `🆔 Group ID: ${jid}`
          );
        }
      } catch (err) {
        console.error("Message handler error:", err);
      }
    }
  });
}

startBot().catch((err) => {
  console.error("Bot startup failed:", err);
  process.exit(1);
});
