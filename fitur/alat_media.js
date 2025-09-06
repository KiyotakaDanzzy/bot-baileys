const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const sesiAktif = {};
const FFMPEG_PATH = path.resolve(__dirname, '..', 'bin', 'ffmpeg.exe');
const FFPROBE_PATH = path.resolve(__dirname, '..', 'bin', 'ffprobe.exe');
const REALESRGAN_PATH = path.resolve(__dirname, '..', 'bin', 'realesrgan-ncnn-vulkan.exe');
const TEMP_DIR = path.resolve(__dirname, '..', 'temp');

async function dapatkanInfoMedia(jalurFile) {
    return new Promise((resolve, reject) => {
        execFile(FFPROBE_PATH, ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', jalurFile], (error, stdout) => {
            if (error) return reject(error);
            resolve(JSON.parse(stdout));
        });
    });
}

async function tanganiPermintaanMedia(sock, msg, tipe) {
    const jid = msg.key.remoteJid;
    const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!pesanDikutip) return sock.sendMessage(jid, { text: `Silakan reply gambar/video yang ingin di-${tipe}.` }, { quoted: msg });

    const tipePesan = Object.keys(pesanDikutip)[0];
    const mediaValid = tipePesan === 'imageMessage' || tipePesan === 'videoMessage';
    if (!mediaValid) return sock.sendMessage(jid, { text: "Pesan yang di-reply bukan gambar atau video." }, { quoted: msg });

    if (tipe === 'upreso' && tipePesan === 'videoMessage') {
        return sock.sendMessage(jid, { text: "Maaf, fitur /upreso saat ini hanya mendukung gambar." }, { quoted: msg });
    }

    await sock.sendMessage(jid, { text: `⏳ Menganalisis media, mohon tunggu...` });

    try {
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

        const stream = await downloadContentFromMessage(pesanDikutip[tipePesan], tipePesan.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const ekstensi = tipePesan === 'imageMessage' ? 'jpg' : 'mp4';
        const jalurInput = path.join(TEMP_DIR, `input_${Date.now()}.${ekstensi}`);
        fs.writeFileSync(jalurInput, buffer);

        const info = await dapatkanInfoMedia(jalurInput);
        const infoStream = info.streams.find(s => s.codec_type === 'video');

        if (!infoStream || (infoStream.duration && parseFloat(infoStream.duration) > 60)) {
            fs.unlinkSync(jalurInput);
            return sock.sendMessage(jid, { text: "Media tidak valid atau durasi video lebih dari 1 menit." });
        }

        let pilihan = [];
        if (tipe === 'kompres') {
            if (tipePesan === 'videoMessage') {
                const bitrate = parseInt(infoStream.bit_rate || info.format.bit_rate) / 1000;
                pilihan = [
                    { label: `Medium (${Math.round(bitrate * 0.5)} kbps)`, value: `video_bitrate_${Math.round(bitrate * 0.5)}` },
                    { label: `Rendah (${Math.round(bitrate * 0.25)} kbps)`, value: `video_bitrate_${Math.round(bitrate * 0.25)}` },
                    { label: `Resolusi 480p`, value: `video_scale_480` }
                ];
            } else {
                pilihan = [
                    { label: `Kualitas 75%`, value: `image_quality_75` },
                    { label: `Kualitas 50%`, value: `image_quality_50` },
                    { label: `Resolusi 512px`, value: `image_scale_512` }
                ];
            }
        } else { 
            pilihan = [{ label: `AI Upscale 2x`, value: 'image_upscale_2x' }];
        }

        sesiAktif[jid] = { jalurInput, tipePesan, pilihan, pesanAsli: msg };

        let teksPilihan = `Pilih salah satu opsi untuk ${tipe} media:\n\n`;
        pilihan.forEach((opt, i) => {
            teksPilihan += `${i + 1}. ${opt.label}\n`;
        });
        teksPilihan += "\nBalas pesan ini dengan nomor pilihan kamu.";

        await sock.sendMessage(jid, { text: teksPilihan }, { quoted: msg });

    } catch (error) {
        console.error(`Error tanganiPermintaanMedia:`, error);
        await sock.sendMessage(jid, { text: `Gagal memproses media. Coba lagi.` });
    }
}

async function prosesPilihanMedia(sock, msg) {
    const jid = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
    const pilihanNomor = parseInt(body) - 1;
    const sesi = sesiAktif[jid];

    if (!sesi || isNaN(pilihanNomor) || pilihanNomor < 0 || pilihanNomor >= sesi.pilihan.length) {
        return;
    }

    const { jalurInput, tipePesan, pilihan, pesanAsli } = sesi;
    const opsiTerpilih = pilihan[pilihanNomor].value;
    const ekstensi = tipePesan === 'imageMessage' ? 'jpg' : 'mp4';
    const jalurOutput = path.join(TEMP_DIR, `output_${Date.now()}.${ekstensi}`);

    delete sesiAktif[jid];
    await sock.sendMessage(jid, { text: `⚙️ Sedang proses pilihan #${pilihanNomor + 1}... Sabar ya kak.`}, { quoted: pesanAsli });

    try {
        await new Promise((resolve, reject) => {
            let args = [];
            let alat = FFMPEG_PATH;

            if (opsiTerpilih.startsWith('video_bitrate')) {
                const bitrate = opsiTerpilih.split('_')[2];
                args = ['-i', jalurInput, '-b:v', `${bitrate}k`, '-c:v', 'libx264', '-preset', 'fast', jalurOutput];
            } else if (opsiTerpilih.startsWith('video_scale')) {
                args = ['-i', jalurInput, '-vf', 'scale=-2:480', '-c:v', 'libx264', '-preset', 'fast', jalurOutput];
            } else if (opsiTerpilih.startsWith('image_quality')) {
                const quality = opsiTerpilih.split('_')[2];
                args = ['-i', jalurInput, '-q:v', `${Math.round(31 * (100 - quality) / 100)}`, jalurOutput];
            } else if (opsiTerpilih.startsWith('image_scale')) {
                args = ['-i', jalurInput, '-vf', 'scale=512:-2', jalurOutput];
            } else if (opsiTerpilih === 'image_upscale_2x') {
                alat = REALESRGAN_PATH;
                args = ['-i', jalurInput, '-o', jalurOutput, '-s', '2'];
            }

            execFile(alat, args, (error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        const stats = fs.statSync(jalurOutput);
        const ukuranMB = stats.size / (1024 * 1024);

        if (tipePesan === 'videoMessage' && ukuranMB > 15) {
            fs.unlinkSync(jalurInput);
            fs.unlinkSync(jalurOutput);
            return sock.sendMessage(jid, { text: `Maaf, hasil video (${ukuranMB.toFixed(2)} MB) terlalu besar untuk dikirim via WhatsApp (batas ~16MB).` }, { quoted: pesanAsli });
        }

        const pesanMedia = tipePesan === 'imageMessage'
            ? { image: { url: jalurOutput }, caption: "Ini hasilnya!" }
            : { video: { url: jalurOutput }, caption: "Ini hasilnya!" };
        
        await sock.sendMessage(jid, pesanMedia, { quoted: pesanAsli });
        
    } catch (error) {
        console.error(`Error prosesPilihanMedia:`, error);
        await sock.sendMessage(jid, { text: `Gagal saat proses media. Ada kesalahan internal, atmin mohon maaf.` }, { quoted: pesanAsli });
    } finally {
        if (fs.existsSync(jalurInput)) fs.unlinkSync(jalurInput);
        if (fs.existsSync(jalurOutput)) fs.unlinkSync(jalurOutput);
    }
}

module.exports = {
    tanganiPermintaanMedia,
    prosesPilihanMedia,
    sesiAktif
};