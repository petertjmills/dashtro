select
  title,
  season,
  us_viewers_in_millions as viewers
from simpsons_episodes
where us_viewers_in_millions is not null
order by viewers desc
limit 10
