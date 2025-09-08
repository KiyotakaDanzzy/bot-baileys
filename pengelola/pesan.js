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
            if (!sock.user?.id) {
                console.log("Menerima pesan grup tetapi ID bot belum siap, mengabaikan...");
                return;
            }

            const groupMeta = await sock.groupMetadata(jid);
            
            // Try multiple JID formats to find bot in participants
            const botJidOptions = [
                sock.user.id,  // Full ID with resource
                sock.user.id.split(':')[0] + '@s.whatsapp.net',  // Standard format
                sock.user.id.split(':')[0] + '@lid',  // LID format
            ];

            let botParticipant = null;
            
            for (const botJid of botJidOptions) {
                botParticipant = groupMeta.participants.find(p => p.id === botJid);
                if (botParticipant) {
                    console.log(`Bot ditemukan dengan format JID: ${botJid}, Admin status: ${botParticipant.admin || 'tidak'}`);
                    break;
                }
            }

            if (!botParticipant) {
                console.log(`Bot tidak ditemukan dalam daftar peserta grup "${groupMeta.subject}". Mungkin bot belum ditambahkan atau dikeluarkan dari grup.`);
                await sock.sendMessage(jid, { 
                    text: "Bot tidak ditemukan dalam daftar peserta grup. Pastikan bot sudah ditambahkan ke grup dan memiliki izin yang diperlukan." 
                });
                return;
            }

            // Check admin status (admin, superAdmin, or superadmin - case variations)
            const adminStatus = botParticipant.admin || '';
            const isAdmin = ['admin', 'superAdmin', 'superadmin'].includes(adminStatus);

            if (isAdmin) {
                await prosesPerintah();
            } else {
                console.log(`Bot adalah member biasa (bukan admin) di grup "${groupMeta.subject}", command diabaikan.`);
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