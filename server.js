'use strict';

const express = require('express');
const cors = require('cors');

const data = require('./Movie Data/data.json');

require('dotenv').config();
const axios = require('axios');

const pg = require('pg');
const client = new pg.Client(process.env.DBURL);

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

//from the database
app.get('/getMovies', handleAllMovies);
app.post('/addMovie', handleAddingMovies);
app.put('/update/:id', updateMovieById);
app.delete('/delete/:id', deleteMovieById);
app.get('/getMovies/:id', getMovieById);

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

function handleAllMovies(req, res){
    const sql= `select * from my_movies`;
    client.query(sql).then(data => {
        res.json(data.rows)
    }).catch(err => {
        code500(err, req, res)
    })
}

function handleAddingMovies(req, res){
    const userInput = req.body;
    const sql = `insert into my_movies(title, release_date, poster_path, overview) values ($1, $2, $3, $4) returning *`;
    const realValues = [userInput.title, userInput.release_date, userInput.poster_path, userInput.overview];

    client.query(sql, realValues).then(data => {
        res.status(201).json(data)
    }).catch(err => {
        code500(err, req, res)
    })
}

function updateMovieById(req, res){
    const id = req.params.id;
    const newData = req.body;
    const sql = `update my_movies set title=$1, release_date=$2, poster_path=$3, overview=$4 where id=$5 returning *`;
    const updatedValue = [newData.title, newData.release_date, newData.poster_path, newData.overview, id];
    client.query(sql, updatedValue).then(data => res.status(202).json(data.rows))
}

function deleteMovieById(req, res){
    const id = req.params.id;
    const sql = `delete from my_movies where id=${id}`;
    client.query(sql).then(()=> res.status(204).json({
        code:204,
        message: `deleted successfully`
    })).catch(err => code500(err, req, res))
}

function getMovieById(req, res){
    const id = req.params.id;
    const sql = `select * from my_movies where id=${id}`;
    client.query(sql).then(data => {
        res.status(200).json(data.rows[0])
    })
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

client.connect().then(con => {
    console.log(con);
    app.listen(PORT, () => console.log(`Server is working on port ${PORT}`));
});