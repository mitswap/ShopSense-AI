/**
 * Re-rank via similarity only (no extra LLM call — saves 10-20s per request).
 */
export async function rerankChunks(_query, chunks) {
  return chunks
}
