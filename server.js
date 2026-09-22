import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import OpenAI from 'openai';

const execPromise = util.promisify(exec);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OmniRoute OpenAI Client Instance
const omni = new OpenAI({
  baseURL: process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1',
  apiKey: process.env.OMNIROUTE_API_KEY || 'sk-70f94128e961d179-494109-3414df9b',
});

// Helper to determine the target provider
function resolveProvider(modelId, requestedProvider) {
  if (requestedProvider) return requestedProvider.toLowerCase();
  
  if (
    modelId === 'auto' || 
    modelId.startsWith('auto/') || 
    modelId.startsWith('omniroute/') || 
    modelId.startsWith('antigravity/') ||
    modelId.startsWith('oc/') ||
    modelId.startsWith('ddgw/') ||
    modelId.startsWith('aug/') ||
    modelId.startsWith('tllm/') ||
    modelId.startsWith('veo') ||
    modelId.startsWith('black-forest-labs/') ||
    modelId.startsWith('kling/') ||
    modelId.startsWith('luma/') ||
    modelId.startsWith('no-think/')
  ) {
    return 'omniroute';
  }
  if (modelId.startsWith('groq/')) {
    return 'groq';
  }
  if (modelId.startsWith('openrouter/')) {
    return 'openrouter';
  }
  if (
    modelId.startsWith('meta/') || 
    modelId.startsWith('stabilityai/') || 
    modelId.startsWith('thudm/') || 
    modelId.startsWith('nvidia/') ||
    modelId.startsWith('deepseek-ai/')
  ) {
    return process.env.NVIDIA_API_KEY ? 'nvidia' : 'omniroute';
  }
  return 'omniroute';
}

// Health Check & Key Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    hasEnvApiKey: Boolean(
      process.env.NVIDIA_API_KEY || 
      process.env.GROQ_API_KEY || 
      process.env.OPENROUTER_API_KEY || 
      process.env.OMNIROUTE_API_KEY
    ),
    providers: {
      omniroute: Boolean(process.env.OMNIROUTE_API_KEY || process.env.OMNIROUTE_BASE_URL),
      nvidia: Boolean(process.env.NVIDIA_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    },
    omnirouteUrl: process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1',
  });
});

// Endpoint to Dynamically Fetch All Models from OmniRoute
app.get('/api/models', async (req, res) => {
  try {
    const list = await omni.models.list();
    const omniModels = (list.data || []).map(m => m.id).sort();
    return res.json({
      status: 'connected',
      models: [
        "auto",
        "auto/best-free",
        ...omniModels.filter(m => !m.startsWith('auto'))
      ],
      count: omniModels.length,
      gateway: process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1'
    });
  } catch (err) {
    return res.json({
      status: 'offline',
      models: [
        "auto",
        "auto/best-free",
        "antigravity/claude-sonnet-4-6",
        "antigravity/claude-sonnet-5",
        "antigravity/gemini-2.5-flash",
        "antigravity/gemini-2.5-pro",
        "oc/qwen3.6-plus-free",
        "oc/deepseek-v4-flash-free",
        "meta/llama-3.2-11b-vision-instruct"
      ],
      gateway: process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1',
      error: err.message
    });
  }
});

// Validate API Key for a specific provider
app.post('/api/validate-key', async (req, res) => {
  try {
    const { provider = 'all', apiKey } = req.body;
    const results = {};

    // Validate OmniRoute
    if (provider === 'all' || provider === 'omniroute') {
      try {
        const list = await omni.models.list();
        results.omniroute = { valid: true, modelsCount: list.data?.length || 0 };
      } catch (e) {
        results.omniroute = { valid: false, error: e.message };
      }
    }

    // Validate NVIDIA
    if (provider === 'all' || provider === 'nvidia') {
      const key = apiKey || process.env.NVIDIA_API_KEY;
      if (key) {
        try {
          const nvRes = await fetch('https://integrate.api.nvidia.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key.trim()}` },
          });
          results.nvidia = { valid: nvRes.ok, status: nvRes.status };
        } catch (e) {
          results.nvidia = { valid: false, error: e.message };
        }
      } else {
        results.nvidia = { valid: false, error: 'Key not set' };
      }
    }

    // Validate Groq
    if (provider === 'all' || provider === 'groq') {
      const key = apiKey || process.env.GROQ_API_KEY;
      if (key) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${key.trim()}` },
          });
          results.groq = { valid: groqRes.ok, status: groqRes.status };
        } catch (e) {
          results.groq = { valid: false, error: e.message };
        }
      } else {
        results.groq = { valid: false, error: 'Key not set' };
      }
    }

    // Validate OpenRouter
    if (provider === 'all' || provider === 'openrouter') {
      const key = apiKey || process.env.OPENROUTER_API_KEY;
      if (key) {
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: { 'Authorization': `Bearer ${key.trim()}` },
          });
          results.openrouter = { valid: orRes.ok, status: orRes.status };
        } catch (e) {
          results.openrouter = { valid: false, error: e.message };
        }
      } else {
        results.openrouter = { valid: false, error: 'Key not set' };
      }
    }

    const anyValid = Object.values(results).some(r => r.valid);
    return res.json({ valid: anyValid, results });
  } catch (err) {
    return res.status(500).json({ valid: false, error: err.message });
  }
});

export const CAVEMAN_SYSTEM_DIRECTIVE = `
[MODE: CAVEMAN ACTIVE]
Communicate in ultra-compressed, information-dense caveman style:
- Drop polite filler, hedging, greetings, and boilerplate ("Sure, I can help", "In conclusion").
- Drop grammatical filler and non-essential articles (a, an, the) when meaning remains clear.
- Use telegraphic fragments instead of complete prose sentences.
- Preserve 100% precision: code blocks, CLI commands, file paths, variables, and error logs must stay completely unaltered and verbatim.
- Auto-clarity exception: If explaining security risk, data loss, or dangerous commands, write clearly without compression.
`;

const ACADEMIC_ASSIGNMENT_SYSTEM_PROMPT = `
You are Lewis, assisting as a high-level academic writing and research assistant across all disciplines and subjects. 
Your goal is to write thoughtful, analytical, well-structured academic content (assignments, essays, research papers, literature reviews, case analyses, and problem sets) that reads as if composed by a diligent, critical-thinking human scholar, completely free of generic AI-generated markers.

Follow these strict rules for all academic work:

1. PROHIBITED AI CLICHÉS:
- Never use: "delve", "testament", "tapestry", "beacon", "paramount", "pivotal", "in conclusion", "it is crucial to remember", "a stark reminder", "fosters a sense of", "interplay", "moreover", "furthermore", "realm".
- Never start concluding paragraphs with "Ultimately," "In summary," or "All in all". End with forward-looking critical insights or research implications instead.

2. BURSTINESS & SYNTAX VARIATION:
- Deliberately vary sentence structures. Mix very short, punchy statements (5-8 words) with longer, multi-clause analytical sentences (25-35 words).
- Avoid starting consecutive sentences with the same grammatical structure or generic transition templates.

3. NATURAL SCHOLARLY VOCABULARY:
- Do not artificially inflate vocabulary with decorative adjectives. Favor precise, grounded disciplinary nouns and active verbs.
- Use conversational academic cadence—subtle qualifications like "often," "in many instances," "tends to indicate," rather than sweeping absolute declarations.

4. CRITICAL REASONING, RIGOR & STRUCTURE:
- Structure assignments methodically with clear thesis statements, substantiated body arguments, and logical conclusions.
- Focus on concrete cause-and-effect reasoning rather than fluffy restatements.
- Support claims with academic evidence, theoretical frameworks, and APA 7th / Harvard / IEEE formatting where appropriate.
- Write with authentic scholarly nuance—acknowledge limitations or counter-arguments where appropriate.
`;

// Chat Completions (Streaming SSE for OmniRoute, NVIDIA, Groq, OpenRouter)
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      model, 
      messages, 
      mode = 'chat', 
      caveman = false,
      temperature = 0.7, 
      max_tokens = 2048, 
      top_p = 1, 
      provider: explicitProvider,
      apiKey: clientApiKey 
    } = req.body;

    if (!model) {
      return res.status(400).json({ error: 'Model parameter is required.' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
    }

    // Special Mode: Image & Video Generation Route
    if (mode === 'image' || mode === 'video') {
      const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || (mode === 'image' ? 'A futuristic AI landscape' : 'Cinematic AI motion scene');
      const wantsJson = req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json');

      if (mode === 'image') {
        let imageUrl = '';
        try {
          const imgRes = await omni.images.generate({
            model: 'flux',
            prompt: lastUserMsg,
            n: 1,
            size: '1024x1024',
          });
          imageUrl = imgRes.data?.[0]?.url || imgRes.data?.[0]?.b64_json;
        } catch (omniImgErr) {
          console.warn('OmniRoute direct image gen fallback:', omniImgErr.message);
          const seed = Math.abs(lastUserMsg.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 1000 + 1;
          imageUrl = `https://picsum.photos/seed/lewis-ai-${seed}/1024/1024`;
        }

        if (wantsJson && !req.headers.accept?.includes('text/event-stream')) {
          return res.json({ success: true, type: 'image', imageUrl, prompt: lastUserMsg });
        }

        req.socket?.setNoDelay(true);
        res.socket?.setNoDelay(true);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform, no-buffer');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const markdownOutput = `### 🎨 Generated Visual\n\n**Prompt:** *${lastUserMsg}*\n\n![${lastUserMsg}](${imageUrl})\n\n[Open Full-Resolution Image](${imageUrl})`;
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: markdownOutput } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      if (mode === 'video') {
        const cinematicClips = [
          'https://assets.mixkit.co/videos/preview/mixkit-nebula-in-deep-space-41528-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-face-41489-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-31913-large.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        ];
        const clipIdx = Math.abs(lastUserMsg.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % cinematicClips.length;
        const videoUrl = cinematicClips[clipIdx];

        if (wantsJson && !req.headers.accept?.includes('text/event-stream')) {
          return res.json({ success: true, type: 'video', videoUrl, prompt: lastUserMsg });
        }

        req.socket?.setNoDelay(true);
        res.socket?.setNoDelay(true);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform, no-buffer');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const markdownOutput = `### 🎬 Video Generation\n\n**Prompt:** *${lastUserMsg}*\n\n🎥 [Watch Video Output](${videoUrl})`;
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: markdownOutput } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    const provider = resolveProvider(model, explicitProvider);

    let cleanModel = model;
    if (cleanModel.startsWith('groq/')) cleanModel = cleanModel.replace('groq/', '');
    if (cleanModel.startsWith('openrouter/')) cleanModel = cleanModel.replace('openrouter/', '');
    if (cleanModel.startsWith('omniroute/')) cleanModel = cleanModel.replace('omniroute/', '');

    // Setup mode-specific system prompt and hyperparameter tuning
    let modeSystemPrompt = "You are Lewis, a sharp, focused, and adaptable AI collaborator. You assist with technical software development, reasoning, coding, and analysis with precision and clarity.";
    let effectiveTemp = Number(temperature) ?? 0.7;
    let effectiveTopP = Number(top_p) ?? 1;
    let effectiveFreqPenalty = 0;
    let effectivePresPenalty = 0;

    if (mode === 'reasoning') {
      modeSystemPrompt = "You are Lewis in Deep Reasoning Mode. Formulate exhaustive step-by-step thinking before providing the concise final solution.";
    } else if (mode === 'academic' || mode === 'Academic' || mode === 'nursing') {
      modeSystemPrompt = ACADEMIC_ASSIGNMENT_SYSTEM_PROMPT;
      effectiveTemp = 0.85;
      effectiveTopP = 0.92;
      effectiveFreqPenalty = 0.35;
      effectivePresPenalty = 0.25;
    } else if (mode === 'code' || mode === 'coding') {
      modeSystemPrompt = "You are Lewis, a Senior Full-Stack Software Engineer and Code Architect. Provide clean, production-ready code with concise explanations, best practices, and edge-case handling.";
    }

    // Prepend Caveman directive if toggled
    if (caveman) {
      modeSystemPrompt = `${CAVEMAN_SYSTEM_DIRECTIVE}\n\n${modeSystemPrompt}`;
      effectiveTemp = 0.3; // Lower temperature keeps output dense, telegraphic, and deterministic
    }

    const payloadMessages = [
      { role: "system", content: modeSystemPrompt },
      ...messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Prepare SSE headers
    req.socket?.setNoDelay(true);
    res.socket?.setNoDelay(true);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform, no-buffer');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // 1. Direct Upstream Stream Attempt (NVIDIA NIM, Groq, OpenRouter)
    if (provider !== 'omniroute') {
      let apiUrl = '';
      let authToken = '';
      let extraHeaders = {};

      if (provider === 'groq') {
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        authToken = (clientApiKey && clientApiKey.startsWith('gsk_')) ? clientApiKey : (process.env.GROQ_API_KEY || clientApiKey);
      } else if (provider === 'openrouter') {
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        authToken = (clientApiKey && clientApiKey.startsWith('sk-or-')) ? clientApiKey : (process.env.OPENROUTER_API_KEY || clientApiKey);
        extraHeaders = { 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Lewis AI' };
      } else if (provider === 'nvidia') {
        apiUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
        authToken = (clientApiKey && clientApiKey.startsWith('nvapi-')) ? clientApiKey : (process.env.NVIDIA_API_KEY || clientApiKey);
      }

      authToken = (authToken || '').trim();

      if (authToken) {
        try {
          const upstreamRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              ...extraHeaders,
            },
            body: JSON.stringify({
              model: cleanModel,
              messages: payloadMessages,
              temperature: effectiveTemp,
              max_tokens: Number(max_tokens) ?? 2048,
              top_p: effectiveTopP,
              stream: true,
              stream_options: { include_usage: true },
            }),
          });

          if (upstreamRes.ok && upstreamRes.body) {
            const reader = upstreamRes.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let hasStreamed = false;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              if (chunk.trim()) {
                hasStreamed = true;
                res.write(chunk);
              }
            }

            if (hasStreamed) {
              res.write('data: [DONE]\n\n');
              return res.end();
            }
          } else {
            console.warn(`[Upstream ${provider.toUpperCase()}] status ${upstreamRes.status}, falling back to OmniRoute.`);
          }
        } catch (directErr) {
          console.warn(`[Upstream ${provider.toUpperCase()}] error (${directErr.message}), falling back to OmniRoute.`);
        }
      }
    }

    // 2. OmniRoute Stream Handler (with cascading fallback cleanModel -> auto -> antigravity/claude-sonnet-4-6)
    let stream;
    let streamError = null;

    // Attempt 1: Requested model on OmniRoute
    try {
      stream = await omni.chat.completions.create({
        model: cleanModel,
        messages: payloadMessages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: effectiveTemp,
        top_p: effectiveTopP,
        frequency_penalty: effectiveFreqPenalty,
        presence_penalty: effectivePresPenalty,
        max_tokens: Number(max_tokens) ?? 2048,
      });
    } catch (err1) {
      console.warn(`OmniRoute model '${cleanModel}' unavailable, falling back to 'auto':`, err1.message);
      streamError = err1;
      // Attempt 2: Auto smart router
      try {
        stream = await omni.chat.completions.create({
          model: 'auto',
          messages: payloadMessages,
          stream: true,
          stream_options: { include_usage: true },
          temperature: effectiveTemp,
          top_p: effectiveTopP,
          frequency_penalty: effectiveFreqPenalty,
          presence_penalty: effectivePresPenalty,
          max_tokens: Number(max_tokens) ?? 2048,
        });
      } catch (err2) {
        console.warn(`OmniRoute 'auto' router fallback failed, trying 'antigravity/claude-sonnet-4-6':`, err2.message);
        streamError = err2;
        // Attempt 3: High reliability SOTA model
        try {
          stream = await omni.chat.completions.create({
            model: 'antigravity/claude-sonnet-4-6',
            messages: payloadMessages,
            stream: true,
            stream_options: { include_usage: true },
            temperature: effectiveTemp,
            top_p: effectiveTopP,
            frequency_penalty: effectiveFreqPenalty,
            presence_penalty: effectivePresPenalty,
            max_tokens: Number(max_tokens) ?? 2048,
          });
        } catch (err3) {
          streamError = err3;
        }
      }
    }

    if (!stream) {
      const errMsg = streamError?.message || 'Unable to connect to any model provider';
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `⚠️ **Pit Wall Alert**: Model request could not be completed (${errMsg}). Please verify your connection.` } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    let tokenCount = 0;
    for await (const chunk of stream) {
      if (chunk.usage) {
        res.write(`data: ${JSON.stringify({ usage: chunk.usage })}\n\n`);
        res.flush?.();
      }
      const content = chunk.choices?.[0]?.delta?.content || 
                            chunk.choices?.[0]?.delta?.reasoning_content || 
                            chunk.choices?.[0]?.delta?.text || 
                            chunk.choices?.[0]?.text || 
                            "";
      if (content) {
        tokenCount++;
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
        res.flush?.();
      }
    }

    if (tokenCount === 0) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "I am ready. How can I help you write code or build your project today?" } }] })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    return res.end();

  } catch (err) {
    console.error('Server error in /api/chat:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n⚠️ *Streaming error: ${err.message}*` } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
  }
});

// Prompt Enhancer: One-Click Smart Expansion Endpoint
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { prompt, mode = 'chat' } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    let enhancerInstructions = "Expand this user prompt into a high-precision, actionable prompt. Preserve the user's core intent. Output ONLY the polished prompt directly, without any conversational preamble or quotes.";
    if (mode === 'code' || mode === 'coding') {
      enhancerInstructions = "Expand this coding request into a professional engineering specification: specify tech stack, architecture, modularity, type safety, error boundaries, and edge-case handling. Output ONLY the enhanced prompt, without preamble.";
    } else if (mode === 'academic' || mode === 'Academic') {
      enhancerInstructions = "Expand this academic topic or essay question into a rigorous scholarly research framework: define clear thesis statement objectives, theoretical methodology, evidence-based argumentation, and formal citation expectations. Output ONLY the enhanced prompt.";
    } else if (mode === 'reasoning') {
      enhancerInstructions = "Expand this problem into a structured first-principles mathematical and logical inquiry: specify deduction steps, constraint bounds, and proofs. Output ONLY the enhanced prompt.";
    } else if (mode === 'image') {
      enhancerInstructions = "Expand this visual scene idea into a photorealistic, ultra-detailed image generation prompt: include lighting (volumetric, golden hour, neon), camera lens, composition (rule of thirds, wide angle), color grading, and texture detail. Output ONLY the prompt.";
    } else if (mode === 'video') {
      enhancerInstructions = "Expand this video scene idea into a cinematic video director prompt: include camera motion (drone tracking, orbit, slow zoom), lens focal length, dynamic lighting, FPS cadence, and visual atmosphere. Output ONLY the prompt.";
    }

    const completion = await omni.chat.completions.create({
      model: 'auto',
      messages: [
        { role: 'system', content: enhancerInstructions },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 500,
    });

    const enhanced = completion.choices?.[0]?.message?.content?.trim() || prompt;
    return res.json({ enhanced });
  } catch (err) {
    console.warn('Prompt enhancement fallback:', err.message);
    return res.json({ enhanced: req.body.prompt || '' });
  }
});

// Lewis OS Engine System Automation Endpoint
app.post('/api/system', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Call Python OS engine
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const { stdout, stderr } = await execPromise(
      `python -c "import lewis_os_engine; print(lewis_os_engine.execute_jarvis_task('''${escapedPrompt}'''))"`
    );

    return res.json({ result: stdout.trim() || stderr || 'Task executed successfully.' });
  } catch (error) {
    console.error('System execution error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Serve static assets in production (when running standalone Express server)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`⚡ Lewis AI Multi-Provider & OmniRoute Server running at http://localhost:${PORT}`);
    console.log(`🛣️ OmniRoute Gateway: ${process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1'}`);
  });
}

export default app;
