const math = require('mathjs');
const QRCode = require('qrcode');
const axios = require('axios');
const wiki = require('wikijs').default;
const { WEATHER_API_KEY } = require('../config/utama');

async function hitungKalkulator(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(jid, { text: "Format: /hitung [ekspresi]\nContoh: /hitung 5 * (2 + 2)" }, { quoted: msg });
    try {
        const hasil = math.evaluate(args.slice(1).join(' '));
        await sock.sendMessage(jid, { text: `Hasil: ${hasil}` }, { quoted: msg });
    } catch {
        await sock.sendMessage(jid, { text: "Ekspresi matematika tidak valid." }, { quoted: msg });
    }
}

async function buatQRCode(sock, msg, text) {
    const jid = msg.key.remoteJid;
    if (!text) return sock.sendMessage(jid, { text: "Format: /qrcode [teks]" }, { quoted: msg });
    const qrBuffer = await QRCode.toBuffer(text);
    await sock.sendMessage(jid, { image: qrBuffer, caption: text });
}

async function dapatkanJadwalSholat(sock, msg, kota) {
    const jid = msg.key.remoteJid;
    const namaKota = kota || 'Jakarta';
    try {
        await sock.sendMessage(jid, { text: `🕋 Mencari jadwal shalat untuk ${namaKota}...` });
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${namaKota}&country=Indonesia&method=20`);
        const timings = response.data.data.timings;
        const date = response.data.data.date.readable;
        const prayerTimes = `📅 *${date}* - ${namaKota}\n───────────────\n🌄 Subuh: ${timings.Fajr}\n☀️ Terbit: ${timings.Sunrise}\n🌇 Dzuhur: ${timings.Dhuhr}\n⛅ Ashar: ${timings.Asr}\n🌆 Maghrib: ${timings.Maghrib}\n🌃 Isya: ${timings.Isha}\n───────────────`;
        await sock.sendMessage(jid, { text: prayerTimes });
    } catch (error) {
        await sock.sendMessage(jid, { text: "Gagal mendapatkan jadwal shalat. Pastikan nama kota benar." });
    }
}

async function dapatkanInfoCuaca(sock, msg, kota) {
    const jid = msg.key.remoteJid;
    if (!kota) return sock.sendMessage(jid, { text: "Format: /cuaca [nama kota]" }, { quoted: msg });
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "ganti_dengan_api_key_anda") {
        return sock.sendMessage(jid, { text: "API Key untuk fitur cuaca belum diatur." }, { quoted: msg });
    }
    try {
        await sock.sendMessage(jid, { text: `🌤️ Mencari info cuaca untuk *${kota}*...` });
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${kota}&appid=${WEATHER_API_KEY}&units=metric&lang=id`);
        const data = response.data;
        const weatherInfo = `*Cuaca Terkini di ${data.name}, ${data.sys.country}*
───────────────
🌡️ *Suhu*: ${data.main.temp}°C (terasa ${data.main.feels_like}°C)
💧 *Kelembapan*: ${data.main.humidity}%
💨 *Angin*: ${data.wind.speed} m/s
🌤️ *Kondisi*: ${data.weather[0].description}
───────────────`;
        await sock.sendMessage(jid, { text: weatherInfo });
    } catch (error) {
        await sock.sendMessage(jid, { text: `Gagal mendapatkan info cuaca. Pastikan nama kota *(${kota})* valid.` }, { quoted: msg });
    }
}

async function dapatkanRingkasanWikipedia(sock, msg, topik) {
    const jid = msg.key.remoteJid;
    if (!topik) return sock.sendMessage(jid, { text: "Format: /wiki [topik]" }, { quoted: msg });
    try {
        await sock.sendMessage(jid, { text: `🌍 Mencari ringkasan Wikipedia untuk *"${topik}"*...` });
        const wikipedia = wiki({ apiUrl: 'https://id.wikipedia.org/w/api.php' });
        const page = await wikipedia.page(topik);
        const summary = await page.summary();
        const shortSummary = summary.split('\n').slice(0, 3).join('\n\n');
        const wikiResult = `*Ringkasan dari Wikipedia: ${page.raw.title}*\n\n${shortSummary}...\n\n*Baca selengkapnya di:* ${page.raw.fullurl}`;
        await sock.sendMessage(jid, { text: wikiResult });
    } catch (error) {
        await sock.sendMessage(jid, { text: `Topik *"${topik}"* tidak ditemukan di Wikipedia Indonesia.` }, { quoted: msg });
    }
}

module.exports = {
    hitungKalkulator,
    buatQRCode,
    dapatkanJadwalSholat,
    dapatkanInfoCuaca,
    dapatkanRingkasanWikipedia,
};