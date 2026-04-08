const axios = require("axios");
const axiosRetry = require("axios-retry").default || require("axios-retry");

// Configure axios-retry for our global axios instance to handle 429 Too Many Requests
axiosRetry(axios, {
  retries: 5, // Number of retries
  retryDelay: (retryCount) => {
    console.log(`Rate limit or network error hit. Retrying attempt ${retryCount}...`);
    return retryCount * 2000; // wait 2s, 4s, 6s, 8s, 10s
  },
  retryCondition: (error) => {
    // Retry on 429 (Too Many Requests) or standard network errors
    return error.response?.status === 429 || axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
});

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

const genreMap = {
  Action: 1,
  Adventure: 2,
  Comedy: 4,
  Drama: 8,
  Fantasy: 10,
  Horror: 14,
  Mystery: 7,
  Romance: 22,
  "Sci-Fi": 24,
  Sports: 30,
  Supernatural: 37,
  "Slice of Life": 36,
  Suspense: 41,
  "Award Winning": 46,
};

const fetchAnimeSearch = async (query, page = 1, filters = {}) => {
  // Build base URL
  let url = `${JIKAN_BASE_URL}/anime?page=${page}`;

  if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  } else if (!filters.genres && !filters.status) {
    // No query and no filters: default discovery mode (new to old)
    url += `&order_by=popularity&sort=asc`;
  }

  if (filters.status) {
    const statusMap = {
      airing: "airing",
      completed: "complete",
      upcoming: "upcoming",
    };
    const mapped = statusMap[filters.status.toLowerCase()];
    if (mapped) url += `&status=${mapped}`;
  }

  if (filters.genres) {
    const genreNames = filters.genres.split(",");
    const genreIds = genreNames
      .map((g) => genreMap[g.trim()])
      .filter((id) => id)
      .join(",");

    if (genreIds) url += `&genres=${genreIds}`;
  }

  try {
    console.log(`Jikan Search URL: ${url}`);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error searching anime ${query}:`, error.message);
    if (error.response && error.response.status === 404) {
      return { data: [], pagination: {} };
    }
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
          nextAiringEpisode {
            episode
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
