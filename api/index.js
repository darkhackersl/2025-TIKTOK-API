const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/api/tiktok", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing TikTok video URL (?url=)" });

  try {
    // Step 1: Get SnapTik home page and extract cookies (for anti-bot, may not be needed)
    const home = await axios.get("https://snaptik.app/en2");
    const cookie = home.headers["set-cookie"] ? home.headers["set-cookie"].join("; ") : "";

    // Step 2: POST the TikTok URL to SnapTik's endpoint
    const postResp = await axios.post(
      "https://snaptik.app/abc2.php",
      new URLSearchParams({
        url: url,
        locale: "en"
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Cookie": cookie,
          "User-Agent": "Mozilla/5.0 (compatible; TikTokDLBot/1.0; +https://github.com/Thenux-ai)"
        }
      }
    );

    // Step 3: Parse download links from HTML
    const $ = cheerio.load(postResp.data);

    const resultLinks = [];
    $("a.button.is-success").each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      const href = $(el).attr("href");
      if (href && text.includes("download")) resultLinks.push(href);
    });

    // Extract description/thumbnail if possible
    const thumb = $("img.video-thumb").attr("src") || "";
    const desc = $("div.video-desc").text() || "";

    res.json({
      owner: "Thenux-ai",
      input_url: url,
      download_links: resultLinks,
      meta: {
        thumb,
        desc
      }
    });
  } catch (e) {
    res.status(500).json({
      error: "Failed to fetch or parse SnapTik result",
      detail: e.message
    });
  }
});

const app = express();
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
