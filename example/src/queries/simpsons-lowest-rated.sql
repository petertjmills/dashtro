select
  title,
  season,
  imdb_rating as rating
from simpsons_episodes
where imdb_rating is not null
order by rating asc
limit 10
