const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../../config');

module.exports = {
    name: 'education',
    category: 'education',
    description: 'Educational AI services',
    execute: async (sock, msg, args, { from, reply, isGroup, sender }) => {
        const body = msg.body || '';
        const cmd = body.slice(1).trim().split(' ')[0].toLowerCase();
        const query = args.join(' ');

        // Image Solvers (solveimage, readimage)
        if (['solveimage', 'readimage'].includes(cmd)) {
            const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            const isImage = msg.message.imageMessage || quoted?.imageMessage;
            
            if (!isImage) return reply('⚠️ Please reply to an image or send an image with the command.');

            await reply("⏳ *JOGO OCR:* Processing the image... This may take a moment.");
            
            try {
                const imageMsg = msg.message.imageMessage || quoted.imageMessage;
                const stream = await downloadContentFromMessage(imageMsg, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                // Using a public OCR/AI API (simulated for now, would typically use Tesseract or Vision API)
                const ocrPrompt = cmd === 'readimage' ? "Extract all text from this image." : "Solve the question in this image step-by-step.";
                
                // For now, providing a helpful placeholder until a specific Vision API is integrated
                return reply(`📚 *${cmd.toUpperCase()} RESULT*\n\n[AI Analysis]: I see a student's query. My current domain expansion limits direct image-to-text processing without a dedicated Vision API key, but I've detected your request. Copy the text manually and use .ask for now!`);
            } catch (e) {
                console.error(e);
                return reply("🌋 *DOMAIN ERROR:* Failed to process the image.");
            }
        }

        if (!query && !['jambanswer', 'jambsolve', 'jambrandom', 'dailyfact', 'wordoftheday', 'sciencefact'].includes(cmd)) {
            return reply(`📚 *JOGO AI TEACHER*\n\nPlease provide a topic or question.\nExample: .explain photosynthesis`);
        }

        const promptMap = {
            explain: `Explain the topic "${query}" clearly and simply for a student.`,
            shortnote: `Provide short revision notes for "${query}".`,
            brief: `Explain the topic "${query}" in exactly 2-3 sentences.`,
            define: `Provide a dictionary-style definition for "${query}".`,
            summary: `Provide a summarized explanation of "${query}".`,
            mention: `List important key points about "${query}".`,
            example: `Provide practical examples related to "${query}".`,
            facts: `Return interesting educational facts about "${query}".`,
            history: `Explain the historical background of "${query}".`,
            uses: `Explain the practical uses of "${query}".`,
            ask: `Answer this educational question: "${query}"`,
            solve: `Solve this problem step-by-step: "${query}"`,
            homework: `Help me solve this homework question: "${query}"`,
            study: `Provide structured study notes for the topic: "${query}"`,
            lesson: `Teach me the topic "${query}" step-by-step as a tutor.`,
            quiz: `Generate 5 quiz questions about "${query}".`,
            mcq: `Generate 5 multiple choice questions about "${query}".`,
            test: `Generate a mini practice test for the subject: "${query}"`,
            translate: `Translate the following text to English: "${query}"`,
            grammarcheck: `Correct the grammar of this text: "${query}"`,
            paraphrase: `Paraphrase this sentence differently: "${query}"`,
            mathsolve: `Solve this math problem step-by-step: "${query}"`
        };

        try {
            if (promptMap[cmd]) {
                const response = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(promptMap[cmd])}&lc=en`);
                const result = response.data.success || "I'm focusing my curse energy... Try again in a moment.";
                return reply(`📚 *EDUCATION SERVICE: ${cmd.toUpperCase()}*\n\n${result}`);
            }

            if (cmd === 'jamb' || cmd === 'jambrandom') {
                const subject = cmd === 'jambrandom' ? ['mathematics', 'physics', 'chemistry', 'biology'][Math.floor(Math.random() * 4)] : query.toLowerCase();
                return reply(`📝 *JAMB PRACTICE: ${subject.toUpperCase()}*\n\n1. What is the derivative of x^2?\nA) x\nB) 2x\nC) 2\nD) 0\n\n[Use .jambanswer to see answers]`);
            }

            if (cmd === 'jambanswer') return reply(`✅ *JAMB ANSWERS*\n\n1. B (2x)`);
            if (cmd === 'jambsolve') return reply(`💡 *JAMB SOLUTION*\n\n1. Power rule: d/dx(x^n) = nx^(n-1). For x^2, n=2, so 2x^(2-1) = 2x.`);

            if (['dailyfact', 'sciencefact', 'wordoftheday'].includes(cmd)) {
                const factPrompt = cmd === 'wordoftheday' ? "Give me a 'word of the day' with its meaning and an example sentence." : "Give me a random interesting educational fact.";
                const response = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(factPrompt)}&lc=en`);
                return reply(`📖 *${cmd.toUpperCase()}*\n\n${response.data.success}`);
            }
        } catch (e) {
            console.error(e);
            reply("🌋 *DOMAIN ERROR:* The educational scrolls are currently burning. Try again later.");
        }
    }
};
