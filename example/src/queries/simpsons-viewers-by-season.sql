select
  season,
  round(avg(us_viewers_in_millions), 2) as viewers
from simpsons_episodes
where us_viewers_in_millions is not null
group by season
order by season
