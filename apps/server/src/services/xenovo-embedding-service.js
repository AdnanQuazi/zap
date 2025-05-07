
async function getQueryEmbedding(text) {
  try {
    // Load the embedding model
    const { pipeline } = await import("@xenova/transformers");
    const embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    // Generate the embedding
    const result = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(result.data); // Convert Float32Array to a regular JavaScript array

  } catch (error) {
    console.error("Error generating embedding:", error);
    return null; // Or throw the error, depending on how you want to handle failures
  }
}

module.exports = getQueryEmbedding;