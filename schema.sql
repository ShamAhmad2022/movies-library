create table if not exists my_movies(
    id serial primary key,
    title varchar(300),
    release_date varchar(40),
    poster_path varchar(300),
    overview varchar(5000)
);

ALTER TABLE my_movies
ADD user_comment varchar(3000);