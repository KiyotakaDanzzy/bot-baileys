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
const { tanganiPermintaanMedia } = require('../fitur/alat_media');

async function tanganiPerintah(sock, msg) {
    const jid = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage.text).trim();
    const args = body.split(' ');
    const command = args[0].toLowerCase();

    try {
        switch (command) {
            case '/menu': {
                const namaPengguna = msg.pushName || "Pengguna";
                const tanggalSekarang = new Date();
                const zonaWaktu = 'Asia/Jakarta';

                const opsiTanggal = {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: zonaWaktu
                };

                const opsiWaktu = {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: zonaWaktu
                };

                const hariTanggal = tanggalSekarang.toLocaleString('id-ID', opsiTanggal);
                const waktu = tanggalSekarang.toLocaleString('id-ID', opsiWaktu).replace(/\./g, ':');
                const menuTeks = `
╭─╸「 *IDAN-BOT* 」
┃
┃✦ *Halo, @${namaPengguna}!*
┃   Selamat datang di menu utama.
┃
├─╸「 *INFORMASI* 」
┃
┃➤ *Hari:* ${hariTanggal}
┃➤ *Waktu:* ${waktu} WIB
┃
╰─╸「 *© 2025 Wildan* 」

╭─╸「 *DAFTAR PERINTAH* 」
┃
├─╸「 🧠 *AI & Kreativitas* 」
┃
┃   */ai [pertanyaan]*
┃   ↳ Tanya apa saja ke AI.
┃
┃   */stiker [reply media]*
┃   ↳ Buat stiker dari gambar/video.
┃
┃   */stikertext [teks]*
┃   ↳ Buat stiker dari tulisan.
┃
├─╸「 🖼️ *Media & Unduhan* 」
┃
┃   */ytmp3 [url youtube]*
┃   ↳ Download audio dari YouTube.
┃
┃   */tiktok [url tiktok]*
┃   ↳ Download video TikTok no WM
┃
┃   */kompres [reply media]*
┃   ↳ Kompres gambar/video.
┃
┃   */upreso [reply gambar]*
┃   ↳ Upscale gambar.
┃
├─╸「 ⚙️ *Utilitas & Info* 」
┃
┃   */hitung [ekspresi]*
┃   ↳ Kalkulator matematika.
┃
┃   */qrcode [teks]*
┃   ↳ Buat kode QR dari teks.
┃
┃   */sholat [nama kota]*
┃   ↳ Info jadwal sholat.
┃
┃   */cuaca [nama kota]*
┃   ↳ Informasi cuaca terkini.
┃
┃   */wiki [topik]*
┃   ↳ Cari ringkasan Wikipedia.
┃
├─╸「 💌 *Rahasia* 」
┃
┃   */fessage [no|nama|pesan]*
┃   ↳ Kirim pesan anonim.
┃
╰─╸「 *Gunakan perintah tanpa tanda [ ]* 」
`;
                await sock.sendMessage(jid, { text: menuTeks.trim() });
                break;
            }
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
            case '/kompres':
                await tanganiPermintaanMedia(sock, msg, 'kompres');
                break;
            case '/upreso':
                await tanganiPermintaanMedia(sock, msg, 'upreso');
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