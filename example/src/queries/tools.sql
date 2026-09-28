---
question: string
limit?: integer
---
select
  dataset_name,
  response as tool,
  round(percent * 100, 1) as percent
from (
  select
    dataset_name,
    response,
    percent,
    row_number() over (partition by dataset_name order by percent desc) as rank_in_group
  from survey_answer
  where question = :question
    and dataset_name <> 'Write-Ins'
)
where rank_in_group <= coalesce(:limit, 12)
order by dataset_name, percent desc
