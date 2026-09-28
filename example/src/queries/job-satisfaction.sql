select
  response,
  round(percent * 100, 1) as percent
from survey_answer
where question = 'JobSat' and dataset = 'JobSat'
order by percent desc
