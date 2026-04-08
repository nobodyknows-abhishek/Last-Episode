require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => mongoose.connection.db.collection('animes').countDocuments())
  .then(c => console.log('ANIME_COUNT: ' + c))
  .catch(console.error)
  .finally(() => process.exit());
