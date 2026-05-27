import "dotenv/config";

const id = process.argv[2] ?? "conv_6201ksdjcfnwfvj8p9bh97kr0fmq";

async function main() {
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
