const http = require("http");
const https = require("https");
const { URL } = require("url");

function fetchHTML(callback) {
  const siteUrl = "https://time.com/";

  https.get(siteUrl, (res) => {
    let htmlData = "";

    res.on("data", (chunk) => {
      htmlData += chunk;
    });

    res.on("end", () => {
      callback(null, htmlData);
    });

  }).on("error", (err) => {
    callback(err, null);
  });
}

function extractStories(html) {
  const results = [];
  const seenLinks = new Set();
  const regex = /<a[^>]+href="(https?:\/\/time\.com\/\d{7,}[^"]*)"[^>]*>(.*?)<\/a>/gi;

  let match;
  while ((match = regex.exec(html)) !== null && results.length < 6) {
    let link = match[1];
    let title = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!seenLinks.has(link) && title.length > 5) {
      results.push({
        title: title,
        link: link.endsWith("/") ? link : link + "/"
      });
      seenLinks.add(link);
    }
  }

  return results;
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (urlObj.pathname === "/getTimeStories" && req.method === "GET") {
    fetchHTML((err, html) => {
      if (err) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Could not fetch time.com" }));
        return;
      }

      const stories = extractStories(html);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(stories, null, 2));
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello! Try GET /getTimeStories");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server is running at http://localhost:" + PORT);
});
