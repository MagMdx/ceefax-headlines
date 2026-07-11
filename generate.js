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
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${config.prompt}\n\nReturn ONLY a JSON array of ${config.count} strings, nothing else. No markdown, no code fences, no preamble. Example format: ["Headline one", "Headline two"]`
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.trim();

  // Strip accidental code fences just in case
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  const headlines = JSON.parse(cleaned);

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
