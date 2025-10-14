const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Meme Gallery API listening on port ${PORT}`);
});
