const axios = require("axios");

const testPagination = async () => {
  try {
    console.log("Fetching Page 1...");
    const res1 = await axios.get(
      "http://localhost:5000/api/anime/trending?limit=10&page=1",
    );
    console.log(`Page 1 items: ${res1.data.length}`);
    res1.data.forEach((a) => console.log(`- ${a.title} (${a._id})`));

    console.log("\nFetching Page 2...");
    const res2 = await axios.get(
      "http://localhost:5000/api/anime/trending?limit=10&page=2",
    );
    console.log(`Page 2 items: ${res2.data.length}`);
    res2.data.forEach((a) => console.log(`- ${a.title} (${a._id})`));

    // Check for duplicates
    const ids1 = new Set(res1.data.map((a) => a._id));
    const duplicates = res2.data.filter((a) => ids1.has(a._id));
    console.log(`\nDuplicates found: ${duplicates.length}`);
    if (duplicates.length > 0) {
      duplicates.forEach((a) => console.log(`Duplicate: ${a.title}`));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testPagination();
