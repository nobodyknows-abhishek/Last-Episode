const axios = require('axios');
(async () => {
  const query = `
    query ($malId: Int) {
      Media (idMal: $malId, type: ANIME) {
        status
        episodes
        nextAiringEpisode {
          episode
        }
      }
    }
  `;
  try {
    // 21 is One Piece, 24 is School Rumble? Let's use an airing one like Solo Leveling 58531, or Yuusha (wait what's Yuusha malId)
    // Let's test 21 (One Piece) and 58531 (Solo Leveling 2)
    const malIds = [21, 58531];
    for (const malId of malIds) {
      const res = await axios.post('https://graphql.anilist.co', { query, variables: { malId } });
      console.log(`MAL ${malId}:`, JSON.stringify(res.data.data.Media));
    }
  } catch(e) { console.error(e.response ? e.response.data : e.message); }
})();
