'use strict';

const express = require('express');
const cors = require('cors');

const data = require('./Movie Data/data.json');

require('dotenv').config();
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

//local API
app.get('/', showData);
app.get('/favorite', favoritePage);

//3rd party API
app.get('/trending', handleTrendingMovie);
app.get('/search', handleSearchingAMovie);
app.get('/similarmovies', handleSimilarMovies);
app.get('/availableregions', handleAvailableRegions);

app.use('*', code404);
app.use('*', code500);

const PORT = process.env.PORT || 3005;
const APIURL = process.env.APIURL;
const APIKEY = process.env.APIKEY;


function showData(req, res) {
    let firstMovie = new Movie(data.title, data.poster_path, data.overview);
    res.status(200).json(firstMovie);
}

function Movie(title, poster_path, overview) {
    this.title = title;
    this.poster_path = poster_path;
    this.overview = overview;
}

function favoritePage(req, res) {
    res.send('Welcome to Favorite Page');
}

async function handleTrendingMovie(req, res){
    const getAPITrending = await axios.get(`${APIURL}/3/trending/all/week?api_key=${APIKEY}`);

    getAPITrending.data.results.map(movie => new Trending(movie.id, movie.title, movie.release_date, movie.poster_path, movie.overview))

    res.status(200).json({
        code : 200,
        trendingMovies : Trending.TrendingMovies
    })
}

function Trending(id, title, release_date, poster_path, overview) {
    this.id = id;
    this.title = title;
    this.release_date = release_date;
    this.poster_path = poster_path;
    this.overview = overview;

    Trending.TrendingMovies.push(this);
}

Trending.TrendingMovies=[];

function handleSearchingAMovie(req, res){
    const searchWord = req.query.search;
    const searchpage = req.query.page;

    axios.get(`${APIURL}/3/search/movie?api_key=${APIKEY}&query=${searchWord}&page=${searchpage}`).then(result => {
        res.status(200).json({
            code:200,
            Movies: result.data.results
        })
    }).catch(err => {
        code500(err, req, res)
    })
}

async function handleSimilarMovies(req, res){
    const movieId = req.query.movie_id;

    const SimilarMovies = await axios.get(`${APIURL}/3/movie/${movieId}/similar?api_key=${APIKEY}`);

    res.status(200).json({
        code : 200,
        similarMovies : SimilarMovies.data.results.map(movie => movie.title)
    })
}

function handleAvailableRegions(req, res){
    axios.get(`${APIURL}/3/watch/providers/regions?api_key=${APIKEY}`).then(result => {
        res.status(200).json({
            code:200,
            Available_regions: result.data.results.map(region => region.english_name)
        })
    }).catch( err => code500(err, req, res))
}

function code404(req, res) {
    res.status(404).json(
        {
            code: 404,
            responseText: 'Page not Found'
        }
    )
}

function code500(err, req, res) {
    res.status(500).json(
        {
            code: 500,
            responseText: err.message || err
        }
    )
    
}


app.listen(PORT, () => console.log(`Server is working on port ${PORT}`));