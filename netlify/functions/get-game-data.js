// --- Configuration ---
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// --- The Serverless Function ---
exports.handler = async (event, context) => {
  // Only cache POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const cacheKey = event.body;

  // --- 1. Check the Cache ---
  if (cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    if (Date.now() - cachedItem.timestamp < CACHE_TTL_MS) {
      console.log("CACHE HIT");
      return {
        statusCode: 200,
        body: cachedItem.data,
      };
    } else {
      cache.delete(cacheKey);
    }
  }

  console.log("CACHE MISS");

  // --- 2. Pick an API Key (Key Rotation) ---
  const allKeys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
  ].filter(Boolean);
  const selectedKey = allKeys[Math.floor(Math.random() * allKeys.length)];

  if (!selectedKey) {
    console.error("No API keys found.");
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error: No API keys." }) };
  }

  // --- 3. Make the API Call to Groq ---
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${selectedKey}`,
        "Content-Type": "application/json"
      },
      body: event.body // Pass the user's original request body
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error: ${response.status} ${errorBody}`);
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const responseBody = JSON.stringify(data);

    // --- 4. Store in Cache ---
    cache.set(cacheKey, {
      data: responseBody,
      timestamp: Date.now()
    });

    // --- 5. Return to User ---
    return {
      statusCode: 200,
      body: responseBody
    };

  } catch (error) {
    console.error(error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};