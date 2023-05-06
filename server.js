'use strict';

const express = require('express');
const cors = require('cors');

const data = require('./Movie Data/data.json');

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', showData);
app.get('/favorite', favoritePage);

app.use('*', code404);
app.use('*', code500);


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

function code404(req, res) {
    res.status(404).json(
        {
            code: 404,
            responseText: 'Page not Found'
        }
    )
}

function code500(err, req, res, next) {
    res.status(500).json(
        {
            code: 500,
            responseText: 'Sorry, something went wrong'
        }
    )
    
}


app.listen(3000, () => console.log('Server is working'));