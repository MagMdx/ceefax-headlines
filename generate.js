const fs = require('fs');

async function main() {
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [
        {
          "type": "web_search_20250305",
          "name": "web_search"
        }
      ],
      messages: [
        {
          role: "user",
          content: `${config.prompt}\n\nOnce you have the real stories, respond with ONLY a JSON array of ${config.count} strings — the final surreal headlines. No markdown, no code fences, no preamble, no explanation. Example format: ["Headline one", "Headline two"]`
        }
      ]
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error('API error: ' + JSON.stringify(data.error));
  }

  // Web search responses can include multiple content blocks
  // (search calls, search results, text). We only want the text blocks,
  // and specifically the LAST one, since that's Claude's final answer
  // after it has finished searching.
  const textBlocks = data.content.filter(block => block.type === 'text');
  const finalText = textBlocks[textBlocks.length - 1]?.text?.trim() || '';

  // Strip accidental code fences just in case
  const cleaned = finalText.replace(/^```json\s*/i, '').replace(/```$
