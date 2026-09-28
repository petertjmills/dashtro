select
  air_date,
  season,
  title,
  number_in_series,
  us_viewers_in_millions as viewers,
  imdb_rating as rating
from simpsons_episodes
where us_viewers_in_millions is not null
order by air_date
