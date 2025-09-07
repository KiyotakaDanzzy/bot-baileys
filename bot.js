// to run: node/bot.js

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { tanganiPesanMasuk } = require('./pengelola/pesan');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Bot Aktif!');
});

app.listen(port, () => {
    console.log(`Server web berjalan di port ${port}`);
});

async function hubungkanKeWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['IdanBot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("------------------------------------------------");
            console.log("          SILAKAN SCAN QR CODE INI          ");
            console.log("------------------------------------------------");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus karena:', lastDisconnect.error, ', mencoba menghubungkan kembali:', shouldReconnect);
            if (shouldReconnect) {
                hubungkanKeWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ idannBot siap dipake!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        await tanganiPesanMasuk(sock, m);
    });
}

hubungkanKeWhatsApp();