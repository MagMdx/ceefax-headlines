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
          content: config.prompt + "\n\nOnce you have the real stories, respond with ONLY a JSON array of " + config.count + " strings — the final surreal headlines. No markdown, no code fences, no preamble, no explanation. Example format: [\"Headline one\", \"Headline two\"]"
        }
      ]
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error('API error: ' + JSON.stringify(data.error));
  }

  const textBlocks = data.content.filter(block => block.type === 'text');
  let finalText = (textBlocks[textBlocks.length - 1] && textBlocks[textBlocks.length - 1].text) || '';
  finalText = finalText.trim();

  // Strip accidental code fences without using literal backticks in source
  const FENCE = String.fromCharCode(96, 96, 96);
  if (finalText.startsWith(FENCE)) {
    let stripped = finalText.slice(FENCE.length);
    if (stripped.toLowerCase().startsWith('json')) {
      stripped = stripped.slice(4);
    }
    finalText = stripped;
  }
  if (finalText.endsWith(FENCE)) {
    finalText = finalText.slice(0, -FENCE.length);
  }
  finalText = finalText.trim();

  const headlines = JSON.parse(finalText);

  const output = {
    generated_at: new Date().toISOString(),
    headlines: headlines
  };

  fs.writeFileSync('headlines.json', JSON.stringify(output, null, 2));
  console.log('Headlines generated:', headlines);
}

main().catch(err => {
  console.error('Error generating headlines:', err);
  process.exit(1);
});
