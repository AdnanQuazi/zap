function extractAndParseJson(jsonString) {
  try {
    // Remove the ```json and ``` markers if they exist
    
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString
        .substring(7, jsonString.lastIndexOf("```"))
        .trim();
    }
    // Parse the JSON string
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error extracting or parsing JSON:", error);
    return null; // Or throw the error, depending on your error handling strategy
  }
}

module.exports = extractAndParseJson;
