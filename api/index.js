const axios = require("axios");

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing TikTok video URL (?url=)" });

  try {
    // 1. Get the token for the video
    const resp = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`);
    if (!resp.data || !resp.data.token) {
      return res.status(500).json({ error: "Could not get video info" });
    }

    // 2. Build the download URL
    const dl_url = `https://tikmate.app/download/${resp.data.token}/${resp.data.id}.mp4`;

    res.json({
      owner: "Thenux-ai",
      input_url: url,
      download: {
        video: dl_url,
        author: resp.data.author_name,
        thumb: resp.data.cover,
        desc: resp.data.title
      }
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch/download", detail: e.message });
  }
};
      
