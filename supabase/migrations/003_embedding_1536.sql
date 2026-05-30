-- Run if you already ran 001 with vector(768). OpenRouter uses 1536-dim embeddings.
alter table knowledge_chunks drop column if exists embedding;
alter table knowledge_chunks add column embedding vector(1536);

create or replace function match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id text,
  category text,
  content text,
  content_bn text,
  similarity float
)
language sql stable
as $$
  select
    k.id,
    k.category,
    k.content,
    k.content_bn,
    1 - (k.embedding <=> query_embedding) as similarity
  from knowledge_chunks k
  where k.embedding is not null
  order by k.embedding <=> query_embedding
  limit match_count;
$$;
