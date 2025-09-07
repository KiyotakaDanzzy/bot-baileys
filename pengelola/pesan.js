// KELOLA PESAN USER
const { tanganiPerintah } = require('./perintah');
const { tanganiKueriAi } = require('../fitur/ai');
const { bacaDb, tanganiPesanSesi } = require('../fitur/fessage');
const { sesiAktif, prosesPilihanMedia } = require('../fitur/alat_media');

async function tanganiPesanMasuk(sock, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
    if (!body && !msg.message.imageMessage && !msg.message.videoMessage) return;

    const db = bacaDb();
    const partnerJid = db[jid];

    if (partnerJid) {
        await tanganiPesanSesi(sock, msg, partnerJid, db);
        return;
    }

    if (sesiAktif[jid] && /^\d+$/.test(body)) {
        await prosesPilihanMedia(sock, msg);
        return;
    }

    const isGroup = jid.endsWith('@g.us');
    const isCommand = body.startsWith('/');
    const isAiQuery = body.toLowerCase().startsWith('/ai') || body.toLowerCase().startsWith('!pikir');

    const prosesPerintah = async () => {
        try {
            if (isAiQuery) {
                await tanganiKueriAi(sock, msg);
            } else if (isCommand) {
                await tanganiPerintah(sock, msg);
            }
        } catch (e) {
            console.error("Error saat memproses pesan:", e);
            await sock.sendMessage(jid, { text: "Terjadi kesalahan internal saat memproses permintaanmu." });
        }
    };

    if (isGroup) {
        if (!isCommand) return;
        try {
            if (!sock.user) {
                console.log("Menerima pesan grup tetapi bot belum siap, mengabaikan...");
                return;
            }

            const botJid = sock.user.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;
            const botLid = sock.user.lid ? sock.user.lid.split(':')[0] + '@lid' : null;

            if (!botJid && !botLid) {
                console.log("Tidak dapat menemukan ID bot, mengabaikan pesan grup...");
                return;
            }

            const groupMeta = await sock.groupMetadata(jid);
            const botParticipant = groupMeta.participants.find(p => p.id === botJid || p.id === botLid);

            // console.log("--- debug admin ---");
            // console.log("cari bot JID:", botJid);
            // console.log("cari bot LID:", botLid);
            // console.log("posisi bot:", botParticipant);
            // console.log("--- end debug ---");

            if (botParticipant?.admin) {
                await prosesPerintah();
            } else {
                console.log(`Bot bukan admin di grup "${groupMeta.subject}", command diabaikan.`);
            }
        } catch (e) {
            console.error("Gagal mendapatkan metadata grup:", e);
        }
    } else {
        if (isCommand) {
            await prosesPerintah();
        } else {
            if (!sesiAktif[jid]) {
                await sock.sendMessage(jid, { text: "Perintah tidak dikenali. Silakan gunakan command yang valid.\n\nKetik */menu* untuk melihat daftar perintah." }, { quoted: msg });
            }
        }
    }
}

module.exports = { tanganiPesanMasuk };