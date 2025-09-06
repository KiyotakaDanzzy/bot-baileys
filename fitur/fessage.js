const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'fessagedb.json');

function bacaDb() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({}));
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Gagal membaca DB, membuat DB baru.", error);
        return {};
    }
}

function tulisDb(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Gagal menulis ke DB.", error);
    }
}

async function mulaiSesiFessage(sock, msg) {
    const jid = msg.key.remoteJid;
    if (jid.endsWith('@g.us')) {
        return sock.sendMessage(jid, { text: "Fitur /fessage hanya bisa digunakan melalui chat pribadi (PC)." });
    }

    const body = (msg.message.conversation || msg.message.extendedTextMessage.text).trim();
    try {
        const commandParts = body.substring(9).split('|');
        if (commandParts.length !== 3) {
            return sock.sendMessage(jid, { text: "Format salah. Gunakan:\n*/fessage (nomor tujuan) | (nama samaran) | (pesanmu)*" }, { quoted: msg });
        }

        let targetNumber = commandParts[0].trim().replace(/[^0-9]/g, '');
        const fakeName = commandParts[1].trim();
        const message = commandParts[2].trim();

        if (targetNumber.startsWith('0')) {
            targetNumber = '62' + targetNumber.substring(1);
        }
        let targetJid = targetNumber + '@s.whatsapp.net';
        
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (targetJid === botJid || targetJid === jid) {
            return sock.sendMessage(jid, { text: "Tidak bisa memulai sesi dengan nomormu sendiri atau nomor bot." }, { quoted: msg });
        }

        const db = bacaDb();
        if (db[jid] || db[targetJid]) {
            return sock.sendMessage(jid, { text: "Gagal. Kamu atau target sedang dalam sesi lain. Ketik *!stop* untuk mengakhiri." }, { quoted: msg });
        }

        db[jid] = targetJid;
        db[targetJid] = jid;
        tulisDb(db);

        const pesanKeTarget = `Hi! Kamu menerima pesan rahasia 💌\n\n👤 *Dari:* ${fakeName}\n💬 *Pesan:*\n${message}\n\n-----------------------------------\nSesi chat anonim telah dimulai! Balas chat ini untuk berkomunikasi.\n\nKetik *!stop* untuk mengakhiri sesi.`;
        await sock.sendMessage(targetJid, { text: pesanKeTarget });
        await sock.sendMessage(jid, { text: `✅ Sesi chat rahasia dengan ${targetNumber} berhasil dimulai!\n\nKetik *!stop* untuk mengakhiri.` }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error di fessage:", error);
        await sock.sendMessage(jid, { text: "Terjadi kesalahan saat memulai sesi." }, { quoted: msg });
    }
}

async function tanganiPesanSesi(sock, msg, partnerJid, db) {
    const jid = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage.text).trim();

    if (body.toLowerCase() === '!stop') {
        delete db[jid];
        delete db[partnerJid];
        tulisDb(db);
        await sock.sendMessage(jid, { text: "Kamu telah mengakhiri sesi chat." });
        await sock.sendMessage(partnerJid, { text: "Partner chatmu telah mengakhiri sesi." });
        console.log(`Sesi antara ${jid} dan ${partnerJid} dihentikan.`);
    } else {
        const formattedForward = `💬 *Pesan Diterima:*\n${body}`;
        await sock.sendMessage(partnerJid, { text: formattedForward });
    }
}

module.exports = { mulaiSesiFessage, tanganiPesanSesi, bacaDb };