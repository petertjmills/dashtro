select
  response as role,
  round(percent * 100, 1) as percent
from survey_answer
where question = 'DevType' and dataset = 'DevType'
order by percent desc
limit 10
