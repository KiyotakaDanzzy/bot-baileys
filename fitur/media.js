const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { createCanvas } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

async function buatStikerDariMedia(sock, msg) {
    const jid = msg.key.remoteJid;
    let inputPath = '', outputPath = '';

    try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return sock.sendMessage(jid, { text: "Reply gambar/video yang ingin dijadikan stiker." }, { quoted: msg });

        const messageType = Object.keys(quoted)[0];
        if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
            return sock.sendMessage(jid, { text: "Hanya bisa membuat stiker dari gambar atau video." }, { quoted: msg });
        }
        await sock.sendMessage(jid, { text: "⏳ Mengunduh media dan membuat stiker..." });

        const stream = await downloadContentFromMessage(quoted[messageType], messageType.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
        const extension = messageType === 'imageMessage' ? 'jpg' : 'mp4';
        inputPath = path.resolve(__dirname, '..', 'temp', `input_${Date.now()}.${extension}`);
        outputPath = path.resolve(__dirname, '..', 'temp', `output_${Date.now()}.webp`);
        fs.writeFileSync(inputPath, buffer);
        
        const ffmpegPath = path.resolve(__dirname, '..', 'bin', 'ffmpeg.exe');
        const ffmpegArgs = messageType === 'imageMessage'
            ? ['-i', inputPath, outputPath]
            : ['-i', inputPath, '-t', '5', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0', '-an', outputPath];

        await new Promise((resolve, reject) => {
            execFile(ffmpegPath, ffmpegArgs, (err) => err ? reject(err) : resolve());
        });

        await sock.sendMessage(jid, { sticker: { url: outputPath } });
    } catch (error) {
        console.error('❌ Error membuat stiker:', error);
        await sock.sendMessage(jid, { text: "Gagal membuat stiker. Pastikan media valid." }, { quoted: msg });
    } finally {
        if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
}

async function buatStikerDariTeks(sock, msg, text) {
    const jid = msg.key.remoteJid;
    if (!text) return sock.sendMessage(jid, { text: "Format: /stikertext [teks]" }, { quoted: msg });

    try {
        await sock.sendMessage(jid, { text: "Membuat stiker teks..." });
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#128C7E';
        ctx.fillRect(0, 0, 512, 512);
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 256);
        await sock.sendMessage(jid, { sticker: canvas.toBuffer() });
    } catch (e) {
        console.error("Error stiker teks:", e);
        await sock.sendMessage(jid, { text: "Gagal membuat stiker teks." });
    }
}

async function unduhAudioYouTube(sock, msg, url) {
    const jid = msg.key.remoteJid;
    if (!url) return sock.sendMessage(jid, { text: "Format: /ytmp3 [url_youtube]" }, { quoted: msg });
    let outputTemplate = '';
    try {
        await sock.sendMessage(jid, { text: "Memproses link YouTube..." });
        const ytDlpPath = path.resolve(__dirname, '..', 'bin', 'yt-dlp.exe');
        const ffmpegPath = path.resolve(__dirname, '..', 'bin', 'ffmpeg.exe');

        const title = await new Promise((resolve, reject) => {
            execFile(ytDlpPath, [url, '--get-title'], (err, stdout) => err ? reject(err) : resolve(stdout.trim()));
        });
        
        await sock.sendMessage(jid, { text: `✅ Audio ditemukan: *${title.substring(0, 50)}...*\n\n⏳ Mengunduh audio...` });

        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
        outputTemplate = path.resolve(__dirname, '..', 'temp', `${Date.now()}_audio.mp3`);
        const args = [url, '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0', '--ffmpeg-location', ffmpegPath, '-o', outputTemplate];

        await new Promise((resolve, reject) => {
            execFile(ytDlpPath, args, (err) => err ? reject(err) : resolve());
        });

        if (fs.existsSync(outputTemplate)) {
            await sock.sendMessage(jid, { audio: { url: outputTemplate }, mimetype: 'audio/mp4' });
        } else {
            throw new Error('File tidak berhasil dibuat oleh yt-dlp.');
        }
    } catch (error) {
        console.error('❌ Error download YTDL:', error);
        await sock.sendMessage(jid, { text: "Gagal mengunduh audio. Pastikan link video publik dan valid." });
    } finally {
        if (outputTemplate && fs.existsSync(outputTemplate)) fs.unlinkSync(outputTemplate);
    }
}

async function unduhVideoTikTok(sock, msg, url) {
    const jid = msg.key.remoteJid;
    if (!url) return sock.sendMessage(jid, { text: "Format: /tiktok [url_video_tiktok]" }, { quoted: msg });
    let filepath = '';
    try {
        await sock.sendMessage(jid, { text: "⏳ Menghubungi API TikTok..." });
        const apiResponse = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);

        if (apiResponse.data.code !== 0 || !apiResponse.data.data.play) {
            return sock.sendMessage(jid, { text: `Gagal, pesan dari server: ${apiResponse.data.msg || 'Tidak ada video'}` });
        }
        const videoData = apiResponse.data.data;
        const caption = `*${videoData.title || 'Video TikTok'}*\nOleh: ${videoData.author?.nickname || ''}`;
        
        await sock.sendMessage(jid, { text: `✅ Video ditemukan!\n\n${caption}\n\n⏳ Mengunduh...` });
        
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
        filepath = path.resolve(__dirname, '..', 'temp', `${Date.now()}.mp4`);
        const videoStream = await axios.get(videoData.play, { responseType: 'stream' });
        const writer = fs.createWriteStream(filepath);
        videoStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
        await sock.sendMessage(jid, { video: { url: filepath }, caption: caption });
    } catch (error) {
        console.error('❌ Error download TikTok:', error);
        await sock.sendMessage(jid, { text: "Gagal memproses video TikTok. Pastikan link valid." });
    } finally {
        if (filepath && fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
}

module.exports = {
    buatStikerDariMedia,
    buatStikerDariTeks,
    unduhAudioYouTube,
    unduhVideoTikTok,
};