select
  response as factor,
  median as median_rank
from survey_answer
where question = 'JobSatPoints'
order by median_rank asc
