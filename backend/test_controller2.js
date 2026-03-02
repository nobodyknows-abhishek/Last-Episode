const Controller = require("./controllers/animeController");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/animetracker").then(() => {
  Controller.searchAnimeGlobally(
    { query: { q: "Naruto", page: 1 } },
    {
      json: (data) => {
        console.log("SUCCESS:", Object.keys(data));
        process.exit(0);
      },
      status: (code) => {
        console.log("STATUS:", code);
        return {
          json: (d) => {
            console.log("ERRJSON:", d);
            process.exit(1);
          },
        };
      },
    },
  );
});
