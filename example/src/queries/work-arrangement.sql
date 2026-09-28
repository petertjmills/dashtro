select
  response,
  round(percent * 100, 1) as percent
from survey_answer
where question = 'RemoteWork' and dataset = 'RemoteWork'
order by percent desc
