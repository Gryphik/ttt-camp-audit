// Netlify Function — proxies Google PageSpeed Insights API calls
// This ensures reliable access by using your Google API key server-side.
//
// Environment variable required:
//   GOOGLE_PSI_KEY — your free Google PageSpeed Insights API key

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const googleKey = process.env.GOOGLE_PSI_KEY || "";

  try {
    const { url } = JSON.parse(event.body);
    if (!url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing url" }) };
    }

    const categories = ["performance", "accessibility", "seo", "best-practices"];
    const catParams = categories.map(c => `category=${c}`).join("&");
    let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&${catParams}&strategy=mobile`;
    
    if (googleKey) {
      apiUrl += `&key=${googleKey}`;
    }

    console.log(`[PSI] Fetching: ${url}`);
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error(`[PSI] API error:`, JSON.stringify(data.error));
      return {
        statusCode: response.status || 500,
        headers,
        body: JSON.stringify({ error: data.error.message || "PageSpeed API error", code: data.error.code }),
      };
    }

    console.log(`[PSI] Success for: ${url}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error(`[PSI] Function error:`, err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
