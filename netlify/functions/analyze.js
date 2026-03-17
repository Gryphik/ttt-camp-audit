// Netlify Serverless Function — proxies requests to the Anthropic API
// This keeps your ANTHROPIC_API_KEY secret on the server side.
//
// Environment variable required:
//   ANTHROPIC_API_KEY — your Anthropic API key (set in Netlify dashboard)

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // CORS headers (adjust origin in production to lock down to your domain)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing prompt" }),
      };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || "Anthropic API error" }),
      };
    }

    // Extract text from response
    const text = (data.content || [])
      .map((block) => block.text || "")
      .join("");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
