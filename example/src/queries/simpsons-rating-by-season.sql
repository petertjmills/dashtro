select
  season,
  round(avg(imdb_rating), 2) as rating
from simpsons_episodes
where imdb_rating is not null
group by season
order by season
