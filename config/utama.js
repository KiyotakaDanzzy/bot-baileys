// CONFIG UTAMA

require('dotenv').config();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;


// MODEL AI
const MODEL_ROUTER = "z-ai/glm-4.5-air:free";
const MODEL_CASUAL = "moonshotai/kimi-k2:free";
const MODEL_CRITICAL = "deepseek/deepseek-r1-0528:free";

// PROMPT DEFAULT SISTEM
const PROMPT_SISTEM = "Anda adalah asisten AI yang cerdas dan ramah bernama idannBot'. Anda terintegrasi dalam WhatsApp. Anda dibuat dan dikembangkan oleh seorang developer hebat bernama Wildan suaminya Elaina. Jika ada yang bertanya siapa yang membuatmu atau siapa Wildan, jawab dengan bangga dan antusias bahwa Wildan adalah penciptamu, dia anak kelas 12 Rekayasa Perangkat Lunak di SMKN 1 Lumajang dan dia adalah suami nya Elaina dari Majo no Tabi Tabi. Selalu jawab dalam Bahasa Indonesia yang santai, sopan, dan mudah dimengerti.";

module.exports = {
    OPENROUTER_API_KEY,
    WEATHER_API_KEY,
    MODEL_ROUTER,
    MODEL_CASUAL,
    MODEL_CRITICAL,
    PROMPT_SISTEM,
};