select
  dataset_name as country,
  round(100 * max(case when response = 'Happy at Work' then percent end), 1) as happy,
  round(100 * max(case when response = 'Complacent at Work' then percent end), 1) as complacent,
  round(100 * max(case when response = 'Not Happy at Work' then percent end), 1) as not_happy
from survey_answer
where question = 'JobSat' and dataset <> 'JobSat'
group by dataset_name
order by happy desc
