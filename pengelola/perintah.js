// KELOLA COMMAND USER
const {
    buatStikerDariMedia,
    buatStikerDariTeks,
    unduhAudioYouTube,
    unduhVideoTikTok
} = require('../fitur/media');
const {
    hitungKalkulator,
    buatQRCode,
    dapatkanJadwalSholat,
    dapatkanInfoCuaca,
    dapatkanRingkasanWikipedia
} = require('../fitur/utilitas');
const { mulaiSesiFessage } = require('../fitur/fessage');

async function tanganiPerintah(sock, msg) {
    const jid = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage.text).trim();
    const args = body.split(' ');
    const command = args[0].toLowerCase();

    try {
        switch (command) {
            case '/menu':
                await sock.sendMessage(jid, {
                    text: `📋 *Daftar Perintah idanBot:*
1. */ai [pertanyaan]* — Tanya apa saja ke AI (gunakan !pikir di depan untuk mode kritis)
2. */menu* — Menampilkan daftar command
3. */stiker* — Balas gambar/video untuk jadi stiker
4. */stikertext [teks]* — Buat stiker dari teks
5. */hitung [ekspresi]* — Kalkulator
6. */ytmp3 [url]* — Download audio dari YouTube
7. */qrcode [teks]* — Buat QR code dari teks
8. */sholat [kota]* — Jadwal shalat
9. */tiktok [url]* — Download video TikTok tanpa watermark
10. */cuaca [kota]* — Informasi cuaca terkini
11. */wiki [topik]* — Ringkasan dari Wikipedia
12. */fessage (nomor) | (nama) | (pesan)* — Kirim pesan rahasia`
                });
                break;
            case '/hitung':
                await hitungKalkulator(sock, msg, args);
                break;
            case '/stiker':
                await buatStikerDariMedia(sock, msg);
                break;
            case '/stikertext':
                await buatStikerDariTeks(sock, msg, args.slice(1).join(' '));
                break;
            case '/ytmp3':
                await unduhAudioYouTube(sock, msg, args[1]);
                break;
            case '/qrcode':
                await buatQRCode(sock, msg, args.slice(1).join(' '));
                break;
            case '/sholat':
                await dapatkanJadwalSholat(sock, msg, args.slice(1).join(' '));
                break;
            case '/tiktok':
                await unduhVideoTikTok(sock, msg, args[1]);
                break;
            case '/cuaca':
                await dapatkanInfoCuaca(sock, msg, args.slice(1).join(' '));
                break;
            case '/wiki':
                await dapatkanRingkasanWikipedia(sock, msg, args.slice(1).join(' '));
                break;
            case '/fessage':
                await mulaiSesiFessage(sock, msg);
                break;
            default:
                await sock.sendMessage(jid, { text: "Command tidak dikenali. Ketik /menu untuk melihat semua perintah." }, { quoted: msg });
        }
    } catch (error) {
        console.error('❌ Error handling command:', error);
        await sock.sendMessage(jid, { text: "Terjadi kesalahan saat memproses command." });
    }
}

module.exports = { tanganiPerintah };