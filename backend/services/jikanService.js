const axios = require("axios");

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Helper for delay to handle rate limits (Jikan has 3 requests per second limit)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchTopAnime = async (page = 1) => {
  try {
    const response = await axios.get(
      `${JIKAN_BASE_URL}/top/anime?page=${page}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching top anime:", error.message);
    throw error;
  }
};

const fetchTrendingAnime = async () => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/seasons/now`);
    return response.data;
  } catch (error) {
    console.error("Error fetching trending anime:", error.message);
    throw error;
  }
};

const fetchAnimeByMalId = async (id) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/anime/${id}/full`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching anime ${id}:`, error.message);
    throw error;
  }
};

const fetchAnimeEpisodes = async (id, page = 1) => {
  try {
    const response = await axios.get(
      `${JIKAN_BASE_URL}/anime/${id}/episodes?page=${page}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching episodes for anime ${id}:`, error.message);
    throw error;
  }
};

const fetchAnimeSearch = async (query, page = 1) => {
  try {
    const response = await axios.get(
      `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error searching anime ${query}:`, error.message);
    throw error;
  }
};

const fetchAniListImages = async (malId) => {
  try {
    const query = `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          bannerImage
          coverImage {
            extraLarge
          }
        }
      }
    `;
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { idMal: malId },
    });
    return response.data?.data?.Media || null;
  } catch (error) {
    console.error(`Error fetching AniList images for ${malId}:`, error.message);
    return null; // Return null gracefully so sync doesn't fail
  }
};

module.exports = {
  fetchTopAnime,
  fetchTrendingAnime,
  fetchAnimeByMalId,
  fetchAnimeEpisodes,
  fetchAnimeSearch,
  fetchAniListImages,
  delay,
};
