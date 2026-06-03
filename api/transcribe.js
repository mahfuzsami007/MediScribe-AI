export const config = {
  runtime: 'edge', // Edge function for faster responses
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), { status: 400 });
    }

    // Prepare request to Groq
    const groqForm = new FormData();
    groqForm.append('file', audioFile);
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('response_format', 'json');
    groqForm.append('language', 'en'); // optional, auto-detect works too

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqForm,
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq error:', data);
      return new Response(JSON.stringify({ error: data.error?.message || 'Transcription failed' }), {
        status: groqResponse.status,
      });
    }

    return new Response(JSON.stringify({ text: data.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}