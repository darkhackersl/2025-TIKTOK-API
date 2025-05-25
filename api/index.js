const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing TikTok video URL (?url=)" });

  try {
    // Get token and cookies from ssstik.io homepage
    const home = await axios.get("https://ssstik.io/");
    const $home = cheerio.load(home.data);
    const token = $home('input[name="token"]').attr("value") || "";
    const cookie = home.headers["set-cookie"];

    // Submit video URL to ssstik.io/abc
    const postResp = await axios.post(
      "https://ssstik.io/abc",
      new URLSearchParams({
        id: url,
        locale: "en",
        tt: token,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookie ? cookie.join("; ") : "",
          "User-Agent":
            "Mozilla/5.0 (compatible; TikTokDLBot/1.0; +https://github.com/Thenux-ai)",
        },
      }
    );

    // Parse the result HTML
    const $ = cheerio.load(postResp.data);

    // Download links extraction
    const download = {
      video_no_watermark: "",
      video_no_watermark_hd: "",
      video_watermark: "",
      audio: "",
    };

    // 1. Video without watermark (standard)
    download.video_no_watermark =
      $('a.download_link.without_watermark').attr("href") ||
      $('a:contains("Without watermark")').attr("href") ||
      "";

    // 2. Video without watermark HD (may require extra step, but try)
    download.video_no_watermark_hd =
      $('a.download_link.without_watermark_hd').attr("href") ||
      $('a:contains("Without watermark HD")').attr("href") ||
      "";

    // 3. Video with watermark (rare, but for completeness)
    download.video_watermark =
      $('a.download_link.with_watermark').attr("href") ||
      $('a:contains("With watermark")').attr("href") ||
      "";

    // 4. Audio/MP3
    download.audio =
      $('a.download_link.music').attr("href") ||
      $('a:contains("Download MP3")').attr("href") ||
      "";

    // Meta extraction (optional, improve as needed)
    const meta = {
      thumb: $("img.result_author").attr("src") || "",
      desc: $("p.maintext").text() || "",
      author: $("img.result_author").attr("alt") || "",
    };

    res.json({
      owner: "Thenux-ai",
      input_url: url,
      download,
      meta,
    });
  } catch (e) {
    res.status(500).json({
      error: "Failed to fetch or parse result",
      detail: e.message,
    });
  }
});

module.exports = router;
