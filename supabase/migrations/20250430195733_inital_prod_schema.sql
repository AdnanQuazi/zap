

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE OR REPLACE FUNCTION "public"."check_tsquery_parse"("raw_query" "text") RETURNS TABLE("plainto_pq" "tsquery", "websearch_wq" "tsquery")
    LANGUAGE "sql"
    AS $$
  SELECT
    plainto_tsquery('english', raw_query)    AS plainto_pq,
    websearch_to_tsquery('english', raw_query) AS websearch_wq;
$$;


ALTER FUNCTION "public"."check_tsquery_parse"("raw_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_tsquery_validity"("raw" "text") RETURNS TABLE("parsed_tsquery" "tsquery", "is_valid" boolean, "error_message" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  BEGIN
    RETURN QUERY
    SELECT raw::tsquery, TRUE, NULL;
  EXCEPTION
    WHEN others THEN
      RETURN QUERY
      SELECT NULL::tsquery, FALSE, SQLERRM;
  END;
END;
$$;


ALTER FUNCTION "public"."check_tsquery_validity"("raw" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."combined_search"("channel_id" "text", "search_query" "text", "search_embedding" "public"."vector", "end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 20, "start_ts" "text" DEFAULT NULL::"text") RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text", "score" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    (
        -- Vector Search
        SELECT 
            'slack_messages' AS source,
            s.ts::TEXT,
            s.text,
            s.thread_ts::TEXT,
            (10 / (1 + (s.embedding <-> search_embedding)))::FLOAT AS score
        FROM slack_messages s
        WHERE s.channel_id = combined_search.channel_id -- Explicitly qualify channel_id
            AND (s.embedding <-> search_embedding) <= 1.0
            AND (start_ts IS NULL OR s.ts >= start_ts)
            AND (end_ts IS NULL OR s.ts <= end_ts)
        ORDER BY score DESC
        LIMIT match_count
    )
    UNION ALL
    (
        -- Keyword Search
        SELECT 
            'slack_messages' AS source,
            s.ts::TEXT,
            s.text,
            s.thread_ts::TEXT,
            ts_rank_cd(s.search_text, websearch_to_tsquery('english', search_query))::FLOAT AS score
        FROM slack_messages s
        WHERE s.channel_id = combined_search.channel_id -- Explicitly qualify channel_id
            AND (start_ts IS NULL OR s.ts >= start_ts)
            AND (end_ts IS NULL OR s.ts <= end_ts)
        ORDER BY score DESC
        LIMIT match_count
    )
    ORDER BY score DESC
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."combined_search"("channel_id" "text", "search_query" "text", "search_embedding" "public"."vector", "end_ts" "text", "match_count" integer, "start_ts" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Delete document_chunks linked to old documents
  delete from document_chunks
  using documents
  where documents.file_id = document_chunks.file_id
    and documents.ts::double precision < extract(epoch from now() - interval '20 days');

  -- Delete old documents
  delete from documents
  where ts::double precision < extract(epoch from now() - interval '20 days');

  -- Delete old Slack messages
  delete from slack_messages
  where ts::double precision < extract(epoch from now() - interval '20 days');
end;
$$;


ALTER FUNCTION "public"."delete_old_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_surrounding_messages"("p_channel_id" "text", "p_timestamps" "text"[], "p_count" integer) RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_ts TEXT;
BEGIN
  -- 1. Temp table with unique column names
  CREATE TEMP TABLE temp_results (
    res_ts         TEXT,
    res_text       TEXT,
    res_thread_ts  TEXT
  ) ON COMMIT DROP;

  FOREACH v_ts IN ARRAY p_timestamps LOOP
    -- 2a. Messages before each timestamp
    INSERT INTO temp_results (res_ts, res_text, res_thread_ts)
    SELECT
      sm.ts,
      sm.text,
      sm.thread_ts
    FROM slack_messages AS sm
    WHERE sm.channel_id = p_channel_id
      AND (sm.ts::numeric) < (v_ts::numeric)
    ORDER BY sm.ts DESC
    LIMIT p_count;

    -- 2b. Messages after each timestamp
    INSERT INTO temp_results (res_ts, res_text, res_thread_ts)
    SELECT
      sm.ts,
      sm.text,
      sm.thread_ts
    FROM slack_messages AS sm
    WHERE sm.channel_id = p_channel_id
      AND (sm.ts::numeric) > (v_ts::numeric)
    ORDER BY sm.ts ASC
    LIMIT p_count;
  END LOOP;

  -- 3. Final return, with full qualification and no ambiguity
  RETURN QUERY
  SELECT DISTINCT ON (tr.res_ts)
    'slack_messages'          AS source,
    tr.res_ts                 AS ts,
    tr.res_text               AS text,
   tr.res_thread_ts AS thread_ts
  FROM temp_results AS tr
  ORDER BY tr.res_ts;
END;
$$;


ALTER FUNCTION "public"."get_surrounding_messages"("p_channel_id" "text", "p_timestamps" "text"[], "p_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 20) RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text", "score" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH vector_results AS (
        SELECT mv.ts, mv.similarity
        FROM match_vectors(20, 0.5, query_embedding, channel_id, start_ts, end_ts) mv
    ),
    keyword_results AS (
        SELECT ks.ts, ks.rank
        FROM keyword_search(query, channel_id, start_ts, end_ts, 20) ks
    ),
    combined AS (
        SELECT COALESCE(v.ts, k.ts) AS ts,
               COALESCE(v.similarity, 0) + COALESCE(k.rank, 0) AS score
        FROM vector_results v
        FULL OUTER JOIN keyword_results k ON v.ts = k.ts
    )
    SELECT 'slack_messages' AS source,
           s.ts,
           s.text,
           s.thread_ts,
           c.score
    FROM combined c
    JOIN slack_messages s ON c.ts = s.ts
    ORDER BY c.score DESC
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 20, "vector_match_count" integer DEFAULT 10, "keyword_match_count" integer DEFAULT 10, "match_threshold" double precision DEFAULT 0.5, "rrf_k" double precision DEFAULT 60) RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text", "score" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Input validation
    IF channel_id IS NULL OR channel_id = '' THEN
        RAISE EXCEPTION 'channel_id must be provided and cannot be empty';
    END IF;

    IF match_count <= 0 THEN
        RAISE EXCEPTION 'match_count must be a positive integer';
    END IF;

    IF vector_match_count <= 0 THEN
        RAISE EXCEPTION 'vector_match_count must be a positive integer';
    END IF;

    IF keyword_match_count <= 0 THEN
        RAISE EXCEPTION 'keyword_match_count must be a positive integer';
    END IF;

    -- Perform the hybrid search
    RETURN QUERY
    WITH vector_results AS (
        SELECT mv.ts, ROW_NUMBER() OVER (ORDER BY mv.similarity ASC) AS vector_rank
        FROM match_vectors(
            match_count => vector_match_count,
            match_threshold => match_threshold,
            query_embedding => query_embedding,
            channel_id => channel_id,
            start_ts => start_ts,
            end_ts => end_ts
        ) mv
    ),
    keyword_results AS (
        SELECT ks.ts, ROW_NUMBER() OVER (ORDER BY ks.rank DESC) AS keyword_rank
        FROM keyword_search(
            query => query,
            _channel_id => channel_id,
            start_ts => start_ts,
            end_ts => end_ts,
            match_count => keyword_match_count
        ) ks
    ),
    combined AS (
        SELECT 
            COALESCE(v.ts, k.ts) AS ts,
            v.vector_rank,
            k.keyword_rank
        FROM vector_results v
        FULL OUTER JOIN keyword_results k ON v.ts = k.ts
    ),
    scored AS (
        SELECT 
            c.ts, -- Qualify ts with the combined CTE alias
            (COALESCE(1.0 / (rrf_k + vector_rank), 0) +
             COALESCE(1.0 / (rrf_k + keyword_rank), 0)) AS score
        FROM combined c -- give combined an alias
    )
    SELECT 
        'slack_messages' AS source,
        s.ts,
        s.text,
        s.thread_ts,
        sc.score
    FROM scored sc
    JOIN slack_messages s ON sc.ts = s.ts
    ORDER BY sc.score DESC
    LIMIT match_count;

    -- Check if any results were returned
    IF NOT FOUND THEN
        RAISE NOTICE 'No messages found matching the query';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An error occurred: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hybrid_search_document_chunks"("query" "text", "query_embedding" "public"."vector", "p_channel_id" "text", "p_start_ts" "text" DEFAULT NULL::"text", "p_end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 20, "vector_match_count" integer DEFAULT 10, "keyword_match_count" integer DEFAULT 10, "match_threshold" double precision DEFAULT 0.5, "rrf_k" double precision DEFAULT 60) RETURNS TABLE("source" "text", "ts" "text", "name" "text", "permalink" "text", "text" "text", "chunk_index" integer, "file_id" "text", "score" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Input validation
    IF p_channel_id IS NULL OR p_channel_id = '' THEN
        RAISE EXCEPTION 'channel_id must be provided and cannot be empty';
    END IF;
    IF match_count <= 0 THEN
        RAISE EXCEPTION 'match_count must be a positive integer';
    END IF;
    IF vector_match_count <= 0 THEN
        RAISE EXCEPTION 'vector_match_count must be a positive integer';
    END IF;
    IF keyword_match_count <= 0 THEN
        RAISE EXCEPTION 'keyword_match_count must be a positive integer';
    END IF;

    -- Perform the hybrid search on document chunks
    RETURN QUERY
    WITH vector_results AS (
        SELECT 
            d.ts::TEXT AS ts,
            d.name,
            d.permalink,
            dc.text,
            dc.chunk_index,
            d.file_id,
            ROW_NUMBER() OVER (ORDER BY (dc.embedding <-> query_embedding)) AS vector_rank,
            -- Calculate a vector similarity score (the closer to 1.0 the better)
            (1.0 / (1.0 + (dc.embedding <-> query_embedding))) AS vector_score
        FROM document_chunks dc
        JOIN documents d ON dc.file_id = d.file_id
        WHERE dc.search_text @@ websearch_to_tsquery('english', query)
          AND d.channel_id = p_channel_id
          AND (p_start_ts IS NULL OR d.ts::TEXT >= p_start_ts)
          AND (p_end_ts IS NULL OR d.ts::TEXT <= p_end_ts)
          AND (1.0 / (1.0 + (dc.embedding <-> query_embedding))) >= match_threshold
        ORDER BY (dc.embedding <-> query_embedding)
        LIMIT vector_match_count
    ),
    keyword_results AS (
        SELECT 
            d.ts::TEXT AS ts,
            d.name,
            d.permalink,
            dc.text,
            dc.chunk_index,
            d.file_id,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank(dc.search_text, websearch_to_tsquery('english', query)) DESC
            ) AS keyword_rank
        FROM document_chunks dc
        JOIN documents d ON dc.file_id = d.file_id
        WHERE dc.search_text @@ websearch_to_tsquery('english', query)
          AND d.channel_id = p_channel_id
          AND (p_start_ts IS NULL OR d.ts::TEXT >= p_start_ts)
          AND (p_end_ts IS NULL OR d.ts::TEXT <= p_end_ts)
        ORDER BY ts_rank(dc.search_text, websearch_to_tsquery('english', query)) DESC
        LIMIT keyword_match_count
    ),
    combined AS (
        SELECT 
            COALESCE(v.ts, k.ts) AS ts,
            COALESCE(v.name, k.name) AS name,
            COALESCE(v.permalink, k.permalink) AS permalink,
            COALESCE(v.text, k.text) AS text,
            COALESCE(v.chunk_index, k.chunk_index) AS chunk_index,
            COALESCE(v.file_id, k.file_id) AS file_id,
            v.vector_rank,
            k.keyword_rank
        FROM vector_results v
        FULL OUTER JOIN keyword_results k 
          ON v.ts = k.ts AND v.chunk_index = k.chunk_index
    ),
    scored AS (
        SELECT 
            ts,
            name,
            permalink,
            text,
            chunk_index,
            file_id,
            -- Combine scores from both searches using Reciprocal Rank Fusion
            (COALESCE(1.0 / (rrf_k + vector_rank), 0) +
             COALESCE(1.0 / (rrf_k + keyword_rank), 0)) AS score
        FROM combined
    )
    SELECT 
        'document_chunks' AS source,
        ts,
        name,
        permalink,
        text,
        chunk_index,
        file_id,
        score
    FROM scored
    ORDER BY score DESC
    LIMIT match_count;

    -- Check if any results were returned
    IF NOT FOUND THEN
        RAISE NOTICE 'No document chunks found matching the query';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An error occurred: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."hybrid_search_document_chunks"("query" "text", "query_embedding" "public"."vector", "p_channel_id" "text", "p_start_ts" "text", "p_end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "match_count" integer) RETURNS TABLE("ts" "text", "user_id" "text", "text" "text", "thread_ts" "text", "rank" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.ts::TEXT,
        s.user_id::TEXT,
        s.text::TEXT,
        s.thread_ts::TEXT,
        ts_rank_cd(s.search_text, plainto_tsquery('english', query))::FLOAT AS rank
    FROM slack_messages s
    WHERE s.channel_id = _channel_id
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 20) RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text", "rank" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'slack_messages' AS source,
        s.ts::TEXT,
        s.text::TEXT,
        s.thread_ts::TEXT,
        ts_rank_cd(s.search_text, plainto_tsquery('english', query))::FLOAT AS rank
    FROM slack_messages s
    WHERE s.channel_id = _channel_id
        AND (start_ts IS NULL OR s.ts >= start_ts)  -- Updated from start_ts = '0'
        AND (end_ts IS NULL OR s.ts <= end_ts)      -- Updated from end_ts = '0'
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_vectors"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) RETURNS TABLE("id" "uuid", "channel_id" "text", "user_id" "text", "message" "text", "similarity" double precision, "ts" "text")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT id, channel_id, user_id, message, 1 - (embedding <=> query_embedding) AS similarity, ts
  FROM slack_chat_vectors
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_vectors"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_vectors"("match_count" integer DEFAULT 20, "match_threshold" double precision DEFAULT 0.5, "query_embedding" "public"."vector" DEFAULT (ARRAY[0.0])::"public"."vector"(384), "channel_id" "text" DEFAULT ''::"text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text") RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text", "similarity" double precision)
    LANGUAGE "sql"
    AS $$
SELECT
    'slack_messages' AS source,
    s.ts::TEXT,
    s.text,
    s.thread_ts::TEXT,
    (s.embedding <=> query_embedding) AS similarity
FROM slack_messages s
WHERE s.channel_id = match_vectors.channel_id
    AND (s.embedding <=> query_embedding) <= match_threshold
    AND (start_ts IS NULL OR s.ts >= start_ts)  -- Updated from start_ts = '0'
    AND (end_ts IS NULL OR s.ts <= end_ts)      -- Updated from end_ts = '0'
ORDER BY similarity ASC
LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_vectors"("match_count" integer, "match_threshold" double precision, "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_document_chunks_by_vector"("search_embedding" "public"."vector", "channel_id_param" "text", "similarity_threshold" double precision DEFAULT 0.5) RETURNS TABLE("ts" "text", "name" "text", "permalink" "text", "user_id" "text", "channel_id" "text", "text" "text", "chunk_index" integer, "distance" double precision)
    LANGUAGE "sql"
    AS $$
SELECT
    d.ts::TEXT,
    d.name,
    d.permalink,
    d.user_id,
    d.channel_id,
    dc.text,
    dc.chunk_index,
    (dc.embedding <-> search_embedding) AS distance
FROM
    document_chunks dc
JOIN
    documents d ON dc.file_id = d.file_id
WHERE
    dc.embedding <-> search_embedding < similarity_threshold
    AND d.channel_id = channel_id_param;
$$;


ALTER FUNCTION "public"."search_document_chunks_by_vector"("search_embedding" "public"."vector", "channel_id_param" "text", "similarity_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_documents"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text") RETURNS TABLE("source" "text", "ts" "text", "thread_ts" "text", "text" "text", "permalink" "text", "chunk_index" integer, "file_id" "text", "score" double precision)
    LANGUAGE "sql"
    AS $$

SET pg_trgm.similarity_threshold = 0.3;

WITH matching_docs AS (
    SELECT DISTINCT d.file_id
    FROM document_chunks dc
    JOIN documents d ON dc.file_id = d.file_id
    WHERE
        (
            (dc.embedding <-> search_embedding) <= 1.2 OR
            dc.search_text @@ websearch_to_tsquery('english', search_query_string) OR
            (similarity(dc.text, search_query_string) > 0.3 AND dc.text % search_query_string)
        )
        AND d.channel_id = channel_id
        AND (start_ts IS NULL OR d.ts::TEXT >= start_ts)
        AND (end_ts IS NULL OR d.ts::TEXT <= end_ts)
),

doc_results AS (
    SELECT DISTINCT ON (dc.file_id, dc.chunk_index)
        'document_chunks' AS source,
        d.ts::TEXT AS ts,
        NULL::TEXT AS thread_ts, -- Document chunks don't have thread_ts
        dc.text AS text,
        d.permalink AS permalink,
        dc.chunk_index AS chunk_index,
        d.file_id AS file_id,
        (
            ((10.0 / (1.0 + (dc.embedding <-> search_embedding))) * 0.7) +
            COALESCE((ts_rank(dc.search_text, websearch_to_tsquery('english', search_query_string)) * 0.2), 0) +
            (CASE WHEN similarity(dc.text, search_query_string) > 0.3 THEN 0.1 ELSE 0 END) +
            (CASE WHEN dc.text % search_query_string THEN 0.3 ELSE 0 END) -- Fuzzy match
        ) AS score
    FROM document_chunks dc
    JOIN documents d ON dc.file_id = d.file_id
    WHERE dc.file_id IN (SELECT file_id FROM matching_docs)
    AND d.channel_id = channel_id
    AND (start_ts IS NULL OR d.ts::TEXT >= start_ts)
    AND (end_ts IS NULL OR d.ts::TEXT <= end_ts)
)

SELECT * FROM doc_results
ORDER BY score DESC;

$$;


ALTER FUNCTION "public"."search_documents"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_in_document_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 5, "match_threshold" double precision DEFAULT 0.5, "rrf_k" double precision DEFAULT 60.0, "vector_weight" double precision DEFAULT 1.0, "keyword_weight" double precision DEFAULT 1.0) RETURNS TABLE("source" "text", "ts" "text", "name" "text", "permalink" "text", "text" "text", "chunk_index" integer, "file_id" "text", "channel_id" "text", "matched" "text", "score" double precision)
    LANGUAGE "sql"
    AS $_$
    WITH vector_matches AS (
        SELECT
            'document_chunks' AS source,
            d.ts::TEXT         AS ts,
            d.name             AS name,
            d.permalink        AS permalink,
            dc.text            AS text,
            dc.chunk_index     AS chunk_index,
            d.file_id          AS file_id,
            d.channel_id       AS channel_id,
            (1.0 / (1.0 + (dc.embedding <-> search_embedding))) AS score,
            ROW_NUMBER() OVER (ORDER BY (dc.embedding <-> search_embedding)) AS rank,
            'vector' AS matched_type
        FROM document_chunks dc
        JOIN documents d USING (file_id)
        WHERE
            (1.0 / (1.0 + (dc.embedding <-> search_embedding))) >= match_threshold
            AND d.channel_id = $3
            AND (start_ts IS NULL OR d.ts::TEXT >= start_ts)
            AND (end_ts   IS NULL OR d.ts::TEXT <= end_ts)
        LIMIT match_count
    ),
    text_matches AS (
        SELECT
            'document_chunks' AS source,
            d.ts::TEXT         AS ts,
            d.name             AS name,
            d.permalink        AS permalink,
            dc.text            AS text,
            dc.chunk_index     AS chunk_index,
            d.file_id          AS file_id,
            d.channel_id       AS channel_id,
            ts_rank(
                dc.search_text,
                to_tsquery('english', search_query_string)
            ) AS score,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank(
                    dc.search_text,
                    to_tsquery('english', search_query_string)
                ) DESC
            ) AS rank,
            'keyword' AS matched_type
        FROM document_chunks dc
        JOIN documents d USING (file_id)
        WHERE
            dc.search_text @@ to_tsquery('english', search_query_string)
            AND d.channel_id = $3
            AND (start_ts IS NULL OR d.ts::TEXT >= start_ts)
            AND (end_ts   IS NULL OR d.ts::TEXT <= end_ts)
        LIMIT match_count
    ),
    combined_matches AS (
        SELECT * FROM vector_matches
        UNION ALL
        SELECT * FROM text_matches
    ),
    rrf_scores AS (
        SELECT
            source, ts, name, permalink, text, chunk_index, file_id, channel_id,
            STRING_AGG(DISTINCT matched_type, ',') AS matched,
            SUM(
                CASE matched_type
                    WHEN 'vector'  THEN vector_weight  / (rrf_k + rank)
                    WHEN 'keyword' THEN keyword_weight / (rrf_k + rank)
                    ELSE 0
                END
            ) AS rrf_score
        FROM combined_matches
        GROUP BY source, ts, name, permalink, text, chunk_index, file_id, channel_id
    )
    SELECT
        source, ts, name, permalink, text, chunk_index, file_id, channel_id,
        matched, rrf_score AS score
    FROM rrf_scores
    ORDER BY rrf_score DESC
    LIMIT match_count;
$_$;


ALTER FUNCTION "public"."search_in_document_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_in_slack_messages"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text", "match_count" integer DEFAULT 5, "match_threshold" double precision DEFAULT 0.5, "rrf_k" double precision DEFAULT 60.0, "vector_weight" double precision DEFAULT 1.0, "keyword_weight" double precision DEFAULT 1.0) RETURNS TABLE("source" "text", "ts" "text", "text" "text", "thread_ts" "text", "channel_id" "text", "matched" "text", "score" double precision)
    LANGUAGE "sql"
    AS $_$
    WITH vector_matches AS (
        SELECT
            'slack_messages' AS source,
            s.ts::TEXT AS ts,
            s.text AS text,
            s.thread_ts::TEXT AS thread_ts,
            s.channel_id AS channel_id,
            (1.0 / (1.0 + (s.embedding <-> search_embedding))) AS similarity,
            ROW_NUMBER() OVER (ORDER BY (s.embedding <-> search_embedding)) AS rank,
            'vector' AS matched_type
        FROM slack_messages s
        WHERE
            (1.0 / (1.0 + (s.embedding <-> search_embedding))) >= match_threshold
            AND s.channel_id = $3
            AND (start_ts IS NULL OR s.ts >= start_ts)
            AND (end_ts   IS NULL OR s.ts <= end_ts)
        LIMIT match_count
    ),
    text_matches AS (
        SELECT
            'slack_messages' AS source,
            s.ts::TEXT AS ts,
            s.text AS text,
            s.thread_ts::TEXT AS thread_ts,
            s.channel_id AS channel_id,
            ts_rank(
                s.search_text,
                to_tsquery('english', search_query_string)
            ) AS rank_score,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank(
                    s.search_text,
                    to_tsquery('english', search_query_string)
                ) DESC
            ) AS rank,
            'keyword' AS matched_type
        FROM slack_messages s
        WHERE
            s.search_text @@ to_tsquery('english', search_query_string)
            AND s.channel_id = $3
            AND (start_ts IS NULL OR s.ts >= start_ts)
            AND (end_ts   IS NULL OR s.ts <= end_ts)
        LIMIT match_count
    ),
    combined_matches AS (
        SELECT * FROM vector_matches
        UNION ALL
        SELECT * FROM text_matches
    ),
    rrf_scores AS (
        SELECT
            source, ts, text, thread_ts, channel_id,
            STRING_AGG(DISTINCT matched_type, ',') AS matched,
            SUM(
                CASE matched_type
                    WHEN 'vector'  THEN vector_weight  / (rrf_k + rank)
                    WHEN 'keyword' THEN keyword_weight / (rrf_k + rank)
                    ELSE 0
                END
            ) AS rrf_score
        FROM combined_matches
        GROUP BY source, ts, text, thread_ts, channel_id
    )
    SELECT
        source, ts, text, thread_ts, channel_id,
        matched, rrf_score AS score
    FROM rrf_scores
    ORDER BY rrf_score DESC
    LIMIT match_count;
$_$;


ALTER FUNCTION "public"."search_in_slack_messages"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text") RETURNS TABLE("source" "text", "result_data" "jsonb", "score" double precision)
    LANGUAGE "sql"
    AS $$
SELECT
    'slack_messages' AS source,
    jsonb_build_object(
        'ts', ts,
        'thread_ts', thread_ts,
        'user_id', user_id,
        'type', type,
        'text', text,
        'channel_id', channel_id
    ) AS result_data,
    (ts_rank(search_text, to_tsquery('english', search_query_string)) + 
     (1.0 / (1.0 + (embedding <-> search_embedding)))) AS score
FROM
    slack_messages
WHERE
    search_text @@ to_tsquery('english', search_query_string)
    AND channel_id = channel_id_param

UNION ALL

SELECT
    'document_chunks' AS source,
    jsonb_build_object(
        'ts', d.ts::TEXT,
        'name', d.name,
        'permalink', d.permalink,
        'user_id', d.user_id,
        'channel_id', d.channel_id,
        'text', dc.text
    ) AS result_data,
    (ts_rank(to_tsvector('english', dc.text), to_tsquery('english', search_query_string)) + 
     (1.0 / (1.0 + (dc.embedding <-> search_embedding)))) AS score
FROM
    document_chunks dc
JOIN
    documents d ON dc.file_id = d.file_id
WHERE
    to_tsvector('english', dc.text) @@ to_tsquery('english', search_query_string)
    AND d.channel_id = channel_id_param

ORDER BY score DESC;
$$;


ALTER FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text", "start_ts" "text" DEFAULT NULL::"text", "end_ts" "text" DEFAULT NULL::"text") RETURNS TABLE("source" "text", "result_data" "jsonb", "score" double precision)
    LANGUAGE "sql"
    AS $$

SET pg_trgm.similarity_threshold = 0.3;

WITH slack_results AS (
    SELECT DISTINCT ON (sm.ts)
        'slack_messages' AS source,
        jsonb_build_object(
            'ts', sm.ts,
            'thread_ts', sm.thread_ts,
            'user_id', sm.user_id,
            'type', sm.type,
            'text', sm.text,
            'channel_id', sm.channel_id
        ) AS result_data,
        (
            ((10.0 / (1.0 + (sm.embedding <-> search_embedding))) * 0.7) +
            COALESCE((ts_rank(sm.search_text, websearch_to_tsquery('english', search_query_string)) * 0.2), 0) +
            (CASE WHEN similarity(sm.text, search_query_string) > 0.3 THEN 0.1 ELSE 0 END) +
            (CASE WHEN sm.text % search_query_string THEN 0.3 ELSE 0 END) -- Fuzzy match
        ) AS score
    FROM slack_messages sm
    WHERE
        (
            (sm.embedding <-> search_embedding) <= 1.2 OR
            sm.search_text @@ websearch_to_tsquery('english', search_query_string) OR
            (similarity(sm.text, search_query_string) > 0.3 AND sm.text % search_query_string)
        )
        AND sm.channel_id = channel_id_param
        AND (start_ts IS NULL OR sm.ts >= start_ts)
        AND (end_ts IS NULL OR sm.ts <= end_ts)
),

matching_docs AS (
    SELECT DISTINCT d.file_id
    FROM document_chunks dc
    JOIN documents d ON dc.file_id = d.file_id
    WHERE
        (
            (dc.embedding <-> search_embedding) <= 1.2 OR
            dc.search_text @@ websearch_to_tsquery('english', search_query_string) OR
            (similarity(dc.text, search_query_string) > 0.3 AND dc.text % search_query_string)
        )
        AND d.channel_id = channel_id_param
        AND (start_ts IS NULL OR d.ts::TEXT >= start_ts)
        AND (end_ts IS NULL OR d.ts::TEXT <= end_ts)
),

doc_results AS (
    SELECT DISTINCT ON (dc.file_id, dc.chunk_index)
        'document_chunks' AS source,
        jsonb_build_object(
            'ts', d.ts::TEXT,
            'name', d.name,
            'permalink', d.permalink,
            'user_id', d.user_id,
            'channel_id', d.channel_id,
            'text', dc.text,
            'chunk_index', dc.chunk_index,
            'file_id', d.file_id
        ) AS result_data,
        (
            ((10.0 / (1.0 + (dc.embedding <-> search_embedding))) * 0.7) +
            COALESCE((ts_rank(dc.search_text, websearch_to_tsquery('english', search_query_string)) * 0.2), 0) +
            (CASE WHEN similarity(dc.text, search_query_string) > 0.3 THEN 0.1 ELSE 0 END) +
            (CASE WHEN dc.text % search_query_string THEN 0.3 ELSE 0 END) -- Fuzzy match
        ) AS score
    FROM document_chunks dc
    JOIN documents d ON dc.file_id = d.file_id
    WHERE dc.file_id IN (SELECT file_id FROM matching_docs)
    AND d.channel_id = channel_id_param
    AND (start_ts IS NULL OR d.ts::TEXT >= start_ts)
    AND (end_ts IS NULL OR d.ts::TEXT <= end_ts)
)

SELECT * FROM slack_results
UNION ALL
SELECT source, result_data, score FROM doc_results
ORDER BY score DESC;

$$;


ALTER FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text", "start_ts" "text", "end_ts" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_search_text"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_text := to_tsvector('english', NEW.text);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_search_text"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."config" (
    "key" "text" NOT NULL,
    "value" "text"
);


ALTER TABLE "public"."config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_chunks" (
    "chunk_id" integer NOT NULL,
    "file_id" "text",
    "chunk_index" integer NOT NULL,
    "text" "text" NOT NULL,
    "embedding" "public"."vector"(384) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "search_text" "tsvector",
    "team_id" "text",
    "channel_id" "text"
);


ALTER TABLE "public"."document_chunks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."document_chunks_chunk_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."document_chunks_chunk_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."document_chunks_chunk_id_seq" OWNED BY "public"."document_chunks"."chunk_id";



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "file_id" "text" NOT NULL,
    "created" integer,
    "ts" "text",
    "channel_id" "text",
    "thread_ts" "text",
    "name" "text",
    "title" "text",
    "mimetype" "text",
    "filetype" "text",
    "pretty_type" "text",
    "user_id" "text",
    "user_team" "text",
    "size" integer,
    "url_private_download" "text",
    "converted_pdf" "text",
    "thumb_pdf" "text",
    "permalink" "text",
    "permalink_public" "text",
    "file_access" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "team_id" "text"
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "channel_id" "text",
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."installations" (
    "team_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "bot_user_id" "text" NOT NULL,
    "team_name" "text",
    "data" "jsonb",
    "enable_smart_context" boolean DEFAULT false,
    "context_last_toggled_at" timestamp with time zone,
    "authed_user_id" "text",
    "bot_version" "text",
    "installation_date" timestamp with time zone,
    "last_updated_at" timestamp with time zone
);


ALTER TABLE "public"."installations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slack_messages" (
    "ts" "text" NOT NULL,
    "thread_ts" "text",
    "type" "text",
    "user_id" "text" NOT NULL,
    "text" "text" NOT NULL,
    "channel_id" "text" NOT NULL,
    "embedding" "public"."vector"(384),
    "search_text" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", "text")) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "text",
    CONSTRAINT "slack_messages_type_check" CHECK (("type" = ANY (ARRAY['message'::"text", 'thread'::"text"])))
);


ALTER TABLE "public"."slack_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slack_sync_state" (
    "channel_id" "text" NOT NULL,
    "last_main_ts" "text" NOT NULL,
    "thread_ts_data" "jsonb" NOT NULL,
    "team_id" "text"
);


ALTER TABLE "public"."slack_sync_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_opt_outs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "opted_out_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_opt_outs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."document_chunks" ALTER COLUMN "chunk_id" SET DEFAULT "nextval"('"public"."document_chunks_chunk_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."config"
    ADD CONSTRAINT "config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("chunk_id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("file_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_pkey" PRIMARY KEY ("team_id");



ALTER TABLE ONLY "public"."slack_messages"
    ADD CONSTRAINT "slack_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slack_sync_state"
    ADD CONSTRAINT "slack_sync_state_pkey" PRIMARY KEY ("channel_id");



ALTER TABLE ONLY "public"."user_opt_outs"
    ADD CONSTRAINT "user_opt_outs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_opt_outs"
    ADD CONSTRAINT "user_opt_outs_team_id_user_id_key" UNIQUE ("team_id", "user_id");



CREATE INDEX "embedding_idx" ON "public"."slack_messages" USING "ivfflat" ("embedding" "public"."vector_cosine_ops");



CREATE INDEX "idx_channel_ts" ON "public"."slack_messages" USING "btree" ("channel_id", "ts");



CREATE INDEX "idx_dc_text_trgm" ON "public"."document_chunks" USING "gin" ("text" "public"."gin_trgm_ops");



CREATE INDEX "idx_document_chunks_emb" ON "public"."document_chunks" USING "ivfflat" ("embedding") WITH ("lists"='100');



CREATE INDEX "idx_document_chunks_search_text" ON "public"."document_chunks" USING "gin" ("search_text");



CREATE INDEX "idx_documents_channel_name" ON "public"."documents" USING "btree" ("channel_id", "name");



CREATE INDEX "idx_slack_messages_channel_id" ON "public"."slack_messages" USING "btree" ("channel_id");



CREATE INDEX "idx_slack_messages_channel_ts" ON "public"."slack_messages" USING "btree" ("channel_id", "ts");



CREATE INDEX "idx_slack_messages_emb" ON "public"."slack_messages" USING "ivfflat" ("embedding") WITH ("lists"='100');



CREATE INDEX "idx_slack_messages_search_text" ON "public"."slack_messages" USING "gin" ("search_text");



CREATE INDEX "idx_slack_messages_thread_ts" ON "public"."slack_messages" USING "btree" ("thread_ts");



CREATE INDEX "idx_sm_text_trgm" ON "public"."slack_messages" USING "gin" ("text" "public"."gin_trgm_ops");



CREATE INDEX "search_text_idx" ON "public"."document_chunks" USING "gin" ("search_text");



CREATE OR REPLACE TRIGGER "document_chunks_search_text_update" BEFORE INSERT OR UPDATE ON "public"."document_chunks" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_text"();



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("file_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "fk_chunks_team" FOREIGN KEY ("team_id") REFERENCES "public"."installations"("team_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "fk_documents_team" FOREIGN KEY ("team_id") REFERENCES "public"."installations"("team_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slack_messages"
    ADD CONSTRAINT "fk_messages_team" FOREIGN KEY ("team_id") REFERENCES "public"."installations"("team_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slack_sync_state"
    ADD CONSTRAINT "fk_sync_state_team" FOREIGN KEY ("team_id") REFERENCES "public"."installations"("team_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_opt_outs"
    ADD CONSTRAINT "user_opt_outs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."installations"("team_id") ON DELETE CASCADE;



CREATE POLICY "delete chunks by team and channel" ON "public"."document_chunks" FOR DELETE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "delete documents by team and channel" ON "public"."documents" FOR DELETE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "delete installations by team" ON "public"."installations" FOR DELETE USING ((("auth"."jwt"() ->> 'team_id'::"text") = "team_id"));



CREATE POLICY "delete messages by team and channel" ON "public"."slack_messages" FOR DELETE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "delete own opt-out by team" ON "public"."user_opt_outs" FOR DELETE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'user_id'::"text") = "user_id")));



CREATE POLICY "delete sync state by team and channel" ON "public"."slack_sync_state" FOR DELETE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



ALTER TABLE "public"."document_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert chunks by team and channel" ON "public"."document_chunks" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "insert documents by team and channel" ON "public"."documents" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "insert installations by team" ON "public"."installations" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'team_id'::"text") = "team_id"));



CREATE POLICY "insert messages by team and channel" ON "public"."slack_messages" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "insert own opt-out by team" ON "public"."user_opt_outs" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'user_id'::"text") = "user_id")));



CREATE POLICY "insert sync state by team and channel" ON "public"."slack_sync_state" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



ALTER TABLE "public"."installations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select chunks by team and channel" ON "public"."document_chunks" FOR SELECT USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "select documents by team and channel" ON "public"."documents" FOR SELECT USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "select installations by team" ON "public"."installations" FOR SELECT USING ((("auth"."jwt"() ->> 'team_id'::"text") = "team_id"));



CREATE POLICY "select messages by team and channel" ON "public"."slack_messages" FOR SELECT USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "select own opt-outs by team" ON "public"."user_opt_outs" FOR SELECT USING ((("auth"."jwt"() ->> 'team_id'::"text") = "team_id"));



CREATE POLICY "select sync state by team and channel" ON "public"."slack_sync_state" FOR SELECT USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



ALTER TABLE "public"."slack_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slack_sync_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update chunks by team and channel" ON "public"."document_chunks" FOR UPDATE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "update documents by team and channel" ON "public"."documents" FOR UPDATE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "update installations by team" ON "public"."installations" FOR UPDATE USING ((("auth"."jwt"() ->> 'team_id'::"text") = "team_id"));



CREATE POLICY "update messages by team and channel" ON "public"."slack_messages" FOR UPDATE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



CREATE POLICY "update sync state by team and channel" ON "public"."slack_sync_state" FOR UPDATE USING (((("auth"."jwt"() ->> 'team_id'::"text") = "team_id") AND (("auth"."jwt"() ->> 'channel_id'::"text") = "channel_id")));



ALTER TABLE "public"."user_opt_outs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_tsquery_parse"("raw_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tsquery_parse"("raw_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tsquery_parse"("raw_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_tsquery_validity"("raw" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tsquery_validity"("raw" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tsquery_validity"("raw" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."combined_search"("channel_id" "text", "search_query" "text", "search_embedding" "public"."vector", "end_ts" "text", "match_count" integer, "start_ts" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."combined_search"("channel_id" "text", "search_query" "text", "search_embedding" "public"."vector", "end_ts" "text", "match_count" integer, "start_ts" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."combined_search"("channel_id" "text", "search_query" "text", "search_embedding" "public"."vector", "end_ts" "text", "match_count" integer, "start_ts" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."difference"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."difference"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."difference"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."difference"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."dmetaphone"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."dmetaphone"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."dmetaphone"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dmetaphone"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."dmetaphone_alt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."dmetaphone_alt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."dmetaphone_alt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dmetaphone_alt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_surrounding_messages"("p_channel_id" "text", "p_timestamps" "text"[], "p_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_surrounding_messages"("p_channel_id" "text", "p_timestamps" "text"[], "p_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_surrounding_messages"("p_channel_id" "text", "p_timestamps" "text"[], "p_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hybrid_search"("query" "text", "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."hybrid_search_document_chunks"("query" "text", "query_embedding" "public"."vector", "p_channel_id" "text", "p_start_ts" "text", "p_end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."hybrid_search_document_chunks"("query" "text", "query_embedding" "public"."vector", "p_channel_id" "text", "p_start_ts" "text", "p_end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hybrid_search_document_chunks"("query" "text", "query_embedding" "public"."vector", "p_channel_id" "text", "p_start_ts" "text", "p_end_ts" "text", "match_count" integer, "vector_match_count" integer, "keyword_match_count" integer, "match_threshold" double precision, "rrf_k" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."keyword_search"("query" "text", "_channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text", integer, integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text", integer, integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text", integer, integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."levenshtein"("text", "text", integer, integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer, integer, integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer, integer, integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer, integer, integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."levenshtein_less_equal"("text", "text", integer, integer, integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_vectors"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_vectors"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_vectors"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_vectors"("match_count" integer, "match_threshold" double precision, "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_vectors"("match_count" integer, "match_threshold" double precision, "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_vectors"("match_count" integer, "match_threshold" double precision, "query_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."metaphone"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."metaphone"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."metaphone"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."metaphone"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_document_chunks_by_vector"("search_embedding" "public"."vector", "channel_id_param" "text", "similarity_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."search_document_chunks_by_vector"("search_embedding" "public"."vector", "channel_id_param" "text", "similarity_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_document_chunks_by_vector"("search_embedding" "public"."vector", "channel_id_param" "text", "similarity_threshold" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_documents"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_documents"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_documents"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_in_document_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."search_in_document_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_in_document_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_in_slack_messages"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."search_in_slack_messages"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_in_slack_messages"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id" "text", "start_ts" "text", "end_ts" "text", "match_count" integer, "match_threshold" double precision, "rrf_k" double precision, "vector_weight" double precision, "keyword_weight" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text", "start_ts" "text", "end_ts" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text", "start_ts" "text", "end_ts" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_messages_and_chunks"("search_query_string" "text", "search_embedding" "public"."vector", "channel_id_param" "text", "start_ts" "text", "end_ts" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."soundex"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."soundex"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."soundex"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soundex"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."text_soundex"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."text_soundex"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_soundex"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_soundex"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_search_text"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_search_text"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_search_text"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";
























GRANT ALL ON TABLE "public"."config" TO "anon";
GRANT ALL ON TABLE "public"."config" TO "authenticated";
GRANT ALL ON TABLE "public"."config" TO "service_role";



GRANT ALL ON TABLE "public"."document_chunks" TO "anon";
GRANT ALL ON TABLE "public"."document_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."document_chunks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_chunks_chunk_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_chunks_chunk_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_chunks_chunk_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."installations" TO "anon";
GRANT ALL ON TABLE "public"."installations" TO "authenticated";
GRANT ALL ON TABLE "public"."installations" TO "service_role";



GRANT ALL ON TABLE "public"."slack_messages" TO "anon";
GRANT ALL ON TABLE "public"."slack_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."slack_messages" TO "service_role";



GRANT ALL ON TABLE "public"."slack_sync_state" TO "anon";
GRANT ALL ON TABLE "public"."slack_sync_state" TO "authenticated";
GRANT ALL ON TABLE "public"."slack_sync_state" TO "service_role";



GRANT ALL ON TABLE "public"."user_opt_outs" TO "anon";
GRANT ALL ON TABLE "public"."user_opt_outs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_opt_outs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
