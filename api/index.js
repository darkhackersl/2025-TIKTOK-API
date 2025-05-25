const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// API Owner: Thenux-ai

app.get('/api/tiktok', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'Missing TikTok video URL (use ?url=)' });
    }
    try {
        // Step 1: Get a token and cookies from the homepage (ssstik uses a token)
        const homeResp = await axios.get('https://ssstik.io/');
        const $home = cheerio.load(homeResp.data);
        const token = $home('input[name="token"]').attr('value') || '';
        const cookie = homeResp.headers['set-cookie'];

        // Step 2: Submit the video URL to ssstik
        const postResp = await axios.post(
            'https://ssstik.io/abc',
            new URLSearchParams({
                id: url,
                locale: 'en',
                tt: token
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookie ? cookie.join('; ') : '',
                    'User-Agent': 'Mozilla/5.0 (compatible; TikTokDLBot/1.0; +https://github.com/Thenux-ai)'
                }
            }
        );

        // Step 3: Parse the result HTML
        const $ = cheerio.load(postResp.data);

        // Get video and audio links
        const videoNoWM = $('a.download_link.without_watermark').attr('href') || '';
        const videoWM = $('a.download_link.with_watermark').attr('href') || '';
        const audio = $('a.download_link.music').attr('href') || '';
        // Get meta (title, author, image)
        const thumb = $('img.result_author').attr('src') || '';
        const desc = $('p.maintext').text() || '';
        const author = $('.result_author').attr('alt') || '';

        res.json({
            owner: 'Thenux-ai',
            input_url: url,
            download: {
                video_no_watermark: videoNoWM,
                video_watermark: videoWM,
                audio: audio
            },
            meta: {
                thumb,
                desc,
                author
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch/download', detail: e.message });
    }
});

module.exports = app;
