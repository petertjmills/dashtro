select
  season,
  round(viewers - lag(viewers) over (order by season), 2) as change
from (
  select
    season,
    avg(us_viewers_in_millions) as viewers
  from simpsons_episodes
  where us_viewers_in_millions is not null
  group by season
)
order by season
