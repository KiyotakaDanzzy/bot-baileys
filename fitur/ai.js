const axios = require('axios');
const { OPENROUTER_API_KEY, MODEL_ROUTER, MODEL_CASUAL, MODEL_CRITICAL, PROMPT_SISTEM } = require('../config/utama');

const riwayatPercakapan = {};

async function tanganiKueriAi(sock, msg) {
    const jid = msg.key.remoteJid;
    let body = (msg.message.conversation || msg.message.extendedTextMessage.text).trim();

    const paksaKritis = body.toLowerCase().startsWith('!pikir');
    if (paksaKritis) {
        body = body.substring(6).trim();
    }

    const kueri = body.substring(body.toLowerCase().startsWith('/ai') ? 3 : 0).trim();
    if (!kueri) {
        return sock.sendMessage(jid, { text: "Berikan pertanyaan setelah command /ai.\nContoh: `/ai jelaskan apa itu partikel Tuhan?`" }, { quoted: msg });
    }

    await sock.sendMessage(jid, { text: "🤖 Sedang memproses permintaan AI..." });

    try {
        let modelFinal;

        if (paksaKritis) {
            modelFinal = MODEL_CRITICAL;
            await sock.sendMessage(jid, { text: `Mode Kritis dipaksa aktif (!pikir). Menggunakan model: *${modelFinal}*` });
        } else {
            const routerPrompt = `Anda adalah AI classifier. Klasifikasikan intensi dari prompt berikut sebagai 'CASUAL' atau 'CRITICAL'. Jawab HANYA dengan satu kata. Prompt: "${kueri}"`;
            const routerResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: MODEL_ROUTER,
                messages: [{ role: "user", content: routerPrompt }],
            }, {
                headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
            });
            const klasifikasi = routerResponse.data.choices[0].message.content.trim().toUpperCase();
            console.log(`Klasifikasi dari Router: ${klasifikasi}`);
            modelFinal = klasifikasi.includes('CRITICAL') ? MODEL_CRITICAL : MODEL_CASUAL;
        }

        if (!riwayatPercakapan[jid]) {
            riwayatPercakapan[jid] = [{ role: 'system', content: PROMPT_SISTEM }];
        }
        riwayatPercakapan[jid].push({ role: 'user', content: kueri });

        if (riwayatPercakapan[jid].length > 11) {
            riwayatPercakapan[jid].splice(1, riwayatPercakapan[jid].length - 11);
        }

        const mainResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: modelFinal,
            messages: riwayatPercakapan[jid],
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://github.com/wyldnc/idannbot',
                'X-Title': 'idanBot'
            }
        });

        const responAi = mainResponse.data.choices[0].message.content;
        riwayatPercakapan[jid].push({ role: 'assistant', content: responAi });

        await sock.sendMessage(jid, { text: responAi }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error AI Query:', error.response ? error.response.data : error);
        await sock.sendMessage(jid, { text: "Waduh, sepertinya ada masalah dengan koneksi ke server OpenRouter. Coba lagi beberapa saat ya." }, { quoted: msg });
        delete riwayatPercakapan[jid];
    }
}

module.exports = { tanganiKueriAi };