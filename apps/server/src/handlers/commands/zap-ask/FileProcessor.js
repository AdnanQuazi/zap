/**
 * FileProcessor
 * Class-based implementation for processing Slack files
 */
const path = require("path");
const axios = require("axios");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const {
  getBatchEmbeddings,
} = require("../../../services/embedding-service");
const { FILE_PROCESSING_CONCURRENCY, DEFAULT_CHUNK_SIZE } = require("../../../constants/config");
const ConcurrencyLimiter = require("./Concurrency-Limiter");



class FileProcessor {
  constructor(dependencies = {}) {
    this.ready = (async () => {
      this.fileProcessingLimit = dependencies.fileProcessingLimit || new ConcurrencyLimiter(FILE_PROCESSING_CONCURRENCY);
    })();
  }

  /**
   * Process multiple file messages from Slack
   *
   * @param {Object} params - Function parameters
   * @param {Array} params.fileMessages - Array of messages containing files
   * @param {string} params.slackToken - Slack API token
   * @param {string} params.channelId - Channel ID where files were posted
   * @param {Object} params.supabase - Supabase client
   * @returns {Promise<Array>} - Processing results
   */
  async processFileMessages({ fileMessages, slackToken, channelId, supabase }) {
    const results = await Promise.all(
      fileMessages.map(async (message) => {
        const fileResults = await Promise.all(
          (message.files || []).map((file) =>
            this.fileProcessingLimit(() =>
              this._processSingleFile({
                file,
                message: { ...message, channel_id: channelId },
                slackToken,
                supabase,
              })
            )
          )
        );
        return fileResults.filter((result) => result !== null);
      })
    );
    return results.flat();
  }

  /**
   * Downloads a file from Slack's API using the provided token
   * @private
   * @param {Object} params - Function parameters
   * @param {string} params.fileUrl - URL to download the file from
   * @param {string} params.token - Slack API token
   * @returns {Promise<Buffer>} - File content as buffer
   */
  async _downloadFile({ fileUrl, token }) {
    try {
      console.log("[FILE] Downloading file from:", fileUrl);
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("[FILE] Download error:", error);
      throw error;
    }
  }

  /**
   * Process PDF file and extract text content
   * @private
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async _processPDF(fileBuffer) {
    try {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } catch (error) {
      console.error("[FILE] Error parsing PDF:", error);
      return "";
    }
  }

  /**
   * Process DOCX file and extract text content
   * @private
   * @param {Buffer} fileBuffer - DOCX file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async _processDocx(fileBuffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      console.error("[FILE] Error parsing DOCX:", error);
      return "";
    }
  }

  /**
   * Process plain text file
   * @private
   * @param {Buffer} fileBuffer - Text file buffer
   * @returns {string} - Text content
   */
  async _processText(fileBuffer) {
    return fileBuffer.toString("utf8");
  }

  /**
   * Process document based on file extension
   * @private
   * @param {Object} params - Function parameters
   * @param {Buffer} params.fileBuffer - File content buffer
   * @param {string} params.fileExtension - File extension (e.g., ".pdf")
   * @returns {Promise<string>} - Extracted text
   */
  async _processDocument({ fileBuffer, fileExtension }) {
    if (fileExtension === ".pdf") return this._processPDF(fileBuffer);
    if (fileExtension === ".docx") return this._processDocx(fileBuffer);
    if (fileExtension === ".txt") return this._processText(fileBuffer);

    console.error(`[FILE] Unsupported file type: ${fileExtension}`);
    return "";
  }

  /**
   * Split text into smaller chunks for processing
   * @private
   * @param {Object} params - Function parameters
   * @param {string} params.text - Text to split into chunks
   * @param {number} [params.maxLength=1000] - Maximum chunk size
   * @returns {string[]} - Array of text chunks
   */
  _chunkText({ text, maxLength = DEFAULT_CHUNK_SIZE }) {
    const chunks = [];
    let currentChunk = "";

    text.split(/\s+/).forEach((word) => {
      if (currentChunk.length + word.length + 1 > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = word + " ";
      } else {
        currentChunk += word + " ";
      }
    });

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  /**
   * Store document metadata in the database
   * @private
   * @param {Object} params - Function parameters
   * @param {Object} params.supabase - Supabase client
   * @param {Object} params.metadata - Document metadata
   * @returns {Promise<Object>} - Stored data object
   */
  async _storeDocumentMetadata({ supabase, metadata }) {
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert([metadata]);

      if (error) {
        throw new Error(`Error storing document metadata: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("[DB] Error storing document metadata:", error);
      return null;
    }
  }

  /**
   * Store document chunks in the database
   * @private
   * @param {Object} params - Function parameters
   * @param {Object} params.supabase - Supabase client
   * @param {Array} params.chunksData - Array of chunk objects
   * @returns {Promise<Object>} - Stored data object
   */
  async _storeDocumentChunks({ supabase, chunksData }) {
    try {
      const { data, error } = await supabase
        .from("document_chunks")
        .insert(chunksData);

      if (error) {
        throw new Error(`Error storing document chunks: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("[DB] Error storing document chunks:", error);
      return null;
    }
  }

  /**
   * Process a single file from Slack
   * @private
   * @param {Object} params - Function parameters
   * @param {Object} params.file - File object from Slack API
   * @param {Object} params.message - Message containing the file
   * @param {string} params.slackToken - Slack API token
   * @param {Object} params.supabase - Supabase client
   * @returns {Promise<Object>} - Processing result
   */
  async _processSingleFile({ file, message, slackToken, supabase }) {
    try {
      const fileExtension = path.extname(file.name).toLowerCase();
      const fileUrl = file.url_private_download;

      // Download file
      const fileBuffer = await this._downloadFile({
        fileUrl,
        token: slackToken,
      });

      console.log(
        `[FILE] Downloaded file ${file.id} of size: ${fileBuffer.length} bytes`
      );

      // Process document based on type
      const text = await this._processDocument({
        fileBuffer,
        fileExtension,
      });

      // Split text into chunks
      const chunks = this._chunkText({
        text,
        maxLength: DEFAULT_CHUNK_SIZE,
      });

      // Prepare document metadata
      const documentMetadata = {
        file_id: file.id,
        created: file.created,
        ts: message.ts,
        channel_id: message.channel_id || null,
        thread_ts: message.thread_ts || null,
        name: file.name,
        title: file.title,
        mimetype: file.mimetype,
        filetype: file.filetype,
        pretty_type: file.pretty_type,
        user_id: file.user,
        user_team: file.user_team,
        size: file.size,
        url_private_download: fileUrl,
        converted_pdf: file.converted_pdf,
        thumb_pdf: file.thumb_pdf,
        permalink: file.permalink,
        permalink_public: file.permalink_public,
        file_access: file.file_access,
        created_at: new Date().toISOString(),
        team_id: file.user_team,
      };

      // Store document metadata
      await this._storeDocumentMetadata({
        supabase,
        metadata: documentMetadata,
      });

      // Generate embeddings for all chunks in one batch request for efficiency
      const embeddings = await getBatchEmbeddings(chunks);

      // Prepare chunk data for database
      const chunksData = chunks.map((chunk, index) => ({
        file_id: documentMetadata.file_id,
        chunk_index: index,
        text: chunk,
        embedding: embeddings[index],
        created_at: new Date().toISOString(),
        team_id: documentMetadata.user_team,
        channel_id: documentMetadata.channel_id,
      }));

      // Store chunks in database
      await this._storeDocumentChunks({
        supabase,
        chunksData,
      });

      return {
        file_id: documentMetadata.file_id,
        chunkCount: chunks.length,
      };
    } catch (error) {
      console.error(`[FILE] Error processing file ${file.id}:`, error);
      return null;
    }
  }
}

module.exports = FileProcessor;
