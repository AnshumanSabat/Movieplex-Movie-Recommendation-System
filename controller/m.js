const tmdb = require('../utils/tmdbService');

exports.getPopular = async (req, res) => {
  try {
    const { data } = await tmdb.get('/movie/popular');
    res.render('index', { movies: data.results });
  } catch (err) {
    res.status(500).send('TMDB fetch failed');
  }
};

exports.searchMovies = async (req, res) => {
  const { query } = req.query;
  const { data } = await tmdb.get('/search/movie', { params: { query } });
  res.render('search', { movies: data.results });
};