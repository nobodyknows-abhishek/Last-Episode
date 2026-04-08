const axios = require('axios');
axios.get('https://api.jikan.moe/v4/seasons/now').then(res => {
  const animes = res.data.data.slice(0, 3);
  animes.forEach(a => console.log(`${a.title} -> episodes: ${a.episodes}, status: ${a.status}`));
});
