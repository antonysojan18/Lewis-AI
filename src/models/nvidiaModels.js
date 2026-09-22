export const OMNI_CORE_MODELS = [
  {
    id: 'auto',
    name: 'Auto Smart Router',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Chat',
    badge: '⚡ Ultra-Fast Auto',
    description: 'OmniRoute automatically dispatches your request to the lowest latency, fastest active model.',
    contextWindow: 'Dynamic',
    parameters: 'Smart Router',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981', // Emerald green
  },
  {
    id: 'antigravity/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Fast',
    badge: '⚡ Sub-50ms TTFT',
    description: 'Ultra-lightweight low-latency engine designed for lightning-fast conversations.',
    contextWindow: '1M tokens',
    parameters: 'Flash-Lite',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'antigravity/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Fast',
    badge: '⚡ Lightning SOTA',
    description: 'Blazing fast multi-modal reasoning engine with instantaneous response generation.',
    contextWindow: '1M tokens',
    parameters: 'Flash SOTA',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'antigravity/claude-sonnet-4-6',
    name: 'Claude 3.7 Sonnet',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Academics',
    badge: 'High Precision',
    description: 'Anthropic flagship model for scholarly writing, research, complex reasoning, and coding.',
    contextWindow: '200k tokens',
    parameters: 'Sonnet 4.6',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'antigravity/claude-sonnet-5',
    name: 'Claude 5 Sonnet Next-Gen',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Coding',
    badge: 'Next-Gen Coding',
    description: 'State-of-the-art software architecture, full-stack programming, and automated refactoring.',
    contextWindow: '200k tokens',
    parameters: 'Sonnet 5',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'auto/best-free',
    name: 'Auto Best Free',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Academics',
    badge: 'Free Tier',
    description: 'Auto-selects the highest performing zero-cost model for essays and assignments.',
    contextWindow: 'Dynamic',
    parameters: 'Free Tier',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'antigravity/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro High-Reasoning',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Reasoning',
    badge: 'Deep Logic',
    description: 'Advanced reasoning and mathematical deduction powered by Gemini 2.5 Pro.',
    contextWindow: '2M tokens',
    parameters: 'Pro Reasoning',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'black-forest-labs/flux-1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Image',
    badge: '⚡ 4-Step SOTA',
    description: 'Ultra-fast text-to-image foundation model generating high-fidelity visual artwork.',
    contextWindow: 'Visual Gen',
    parameters: '12B MMDiT',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#fbbf24',
  },
  {
    id: 'kling/kling-v1.6-pro',
    name: 'Kling AI v1.6 Pro',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Video',
    badge: '1080p Cinema',
    description: 'Cinematic video synthesis engine with dynamic camera physics and character motion.',
    contextWindow: 'Video Stream',
    parameters: 'Diffusion DiT',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#f472b6',
  },
  {
    id: 'luma/dream-machine-v2',
    name: 'Luma Dream Machine v2',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Video',
    badge: 'Motion Physics',
    description: 'High frame rate video generation with direct world-model physics simulation.',
    contextWindow: 'Direct Motion',
    parameters: 'World Model',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#f472b6',
  },
];

export const STATIC_MODELS = [
  ...OMNI_CORE_MODELS,

  // ==========================================
  // --- CODING SPECIALISTS ---
  // ==========================================
  {
    id: 'oc/qwen3.6-plus-free',
    name: 'Qwen 3.6 Plus Coder (Free)',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Coding',
    badge: '⚡ Free SOTA Code',
    description: 'Specialized code generation, syntax validation, and automated debugging assistant.',
    contextWindow: '128k tokens',
    parameters: 'Qwen 3.6+',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash Coder',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Coding',
    badge: 'DeepSeek Coding',
    description: 'High-speed code synthesis, algorithm implementation, and unit test generation.',
    contextWindow: '128k tokens',
    parameters: 'V4.1 Flash',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },

  // ==========================================
  // --- GROQ (Ultra-Fast LPUs) ---
  // ==========================================
  {
    id: 'groq/qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B (Groq LPU)',
    provider: 'Groq Cloud',
    providerType: 'groq',
    category: 'Fast',
    badge: '700+ tok/s',
    description: 'Blisteringly fast 27B reasoning and coding model running on Groq LPUs.',
    contextWindow: '128k tokens',
    parameters: '27B LPU',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#f97316', // Orange
  },
  {
    id: 'groq/openai/gpt-oss-120b',
    name: 'GPT OSS 120B (Groq LPU)',
    provider: 'Groq Cloud',
    providerType: 'groq',
    category: 'Fast',
    badge: 'Instant LPU',
    description: 'Near-instantaneous large foundation model inference on Groq hardware.',
    contextWindow: '128k tokens',
    parameters: '120B Dense',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#f97316',
  },

  // ==========================================
  // --- NVIDIA NIM (Active Cloud Endpoints) ---
  // ==========================================
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision Instruct',
    provider: 'NVIDIA NIM',
    providerType: 'nvidia',
    category: 'Chat',
    badge: 'NVIDIA NIM',
    description: 'Meta’s multimodal conversational model running natively on NVIDIA NIM infrastructure.',
    contextWindow: '128k tokens',
    parameters: '11B Dense',
    supportsThinking: false,
    isFeatured: true,
    isFree: false,
    accentColor: '#76b900',
  },
  {
    id: 'stabilityai/stable-diffusion-3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'NVIDIA NIM',
    providerType: 'nvidia',
    category: 'Image',
    badge: 'SD 3.5 Large',
    description: 'Stability AI 8B parameter diffusion model for photorealistic images on NVIDIA TensorRT.',
    contextWindow: 'Visual Gen',
    parameters: '8.1B MMDiT',
    supportsThinking: false,
    isFeatured: true,
    isFree: false,
    accentColor: '#76b900',
  },
  {
    id: 'thudm/cogvideox-5b',
    name: 'CogVideoX 5B',
    provider: 'NVIDIA NIM',
    providerType: 'nvidia',
    category: 'Video',
    badge: 'CogVideo NIM',
    description: 'Text-to-video generation model optimized on NVIDIA GPUs for high visual coherence.',
    contextWindow: 'Video Frame',
    parameters: '5B 3D-VAE',
    supportsThinking: false,
    isFeatured: false,
    isFree: false,
    accentColor: '#76b900',
  },

  // ==========================================
  // --- OPENROUTER / VERIFIED FREE MODELS ---
  // ==========================================
  {
    id: 'oc/nemotron-3-super-free',
    name: 'Nemotron 3 Super (Free)',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Chat',
    badge: 'Free Tier',
    description: 'Free high-capacity Nemotron 3 model running with high-speed conversation.',
    contextWindow: '64k tokens',
    parameters: 'Super Free',
    supportsThinking: false,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
  {
    id: 'oc/deepseek-v4-flash-free',
    name: 'DeepSeek V4 Flash (Free)',
    provider: 'OmniRoute Gateway',
    providerType: 'omniroute',
    category: 'Reasoning',
    badge: 'Free Tier',
    description: 'Free DeepSeek V4 reasoning engine with rapid step-by-step logic execution.',
    contextWindow: '64k tokens',
    parameters: 'Flash Free',
    supportsThinking: true,
    isFeatured: true,
    isFree: true,
    accentColor: '#10b981',
  },
];

export let ALL_MODELS = [...STATIC_MODELS];

export const NVIDIA_MODELS = ALL_MODELS;

export const CATEGORIES = [
  'All',
  'Chat',
  'Academics',
  'Reasoning',
  'Coding',
  'Image',
  'Video',
  '⚡ Ultra-Fast',
  'Free Models',
];

export const DEFAULT_MODEL_ID = 'auto';

export function updateDynamicModels(fetchedModelIds) {
  if (!Array.isArray(fetchedModelIds) || fetchedModelIds.length === 0) return ALL_MODELS;

  const dynamicList = [...STATIC_MODELS];

  fetchedModelIds.forEach((id) => {
    if (!dynamicList.some((m) => m.id === id)) {
      const isFree = id.includes(':free') || id.includes('free');
      const isCode = id.includes('coder') || id.includes('code') || id.includes('qwen') || id.includes('coding');
      const isReason = id.includes('r1') || id.includes('reason') || id.includes('deepseek') || id.includes('thinking');
      const isAcademic = id.includes('claude') || id.includes('sonnet') || id.includes('gemini') || id.includes('academic');
      const isImage = id.includes('flux') || id.includes('diffusion') || id.includes('image') || id.includes('sana');
      const isVideo = id.includes('video') || id.includes('kling') || id.includes('luma') || id.includes('cogvideo') || id.includes('veo');
      const isFast = id.includes('flash') || id.includes('fast') || id.includes('instant') || id.includes('lite');
      const isOmni = id.startsWith('auto') || id.startsWith('omni') || id.startsWith('antigravity') || id.startsWith('oc');

      const resolvedCategory = isReason 
        ? 'Reasoning' 
        : isCode 
        ? 'Coding' 
        : isAcademic 
        ? 'Academics' 
        : isImage 
        ? 'Image' 
        : isVideo 
        ? 'Video' 
        : isFast 
        ? 'Fast' 
        : 'Chat';

      dynamicList.push({
        id: id,
        name: id.replace('omniroute/', '').split('/').pop() || id,
        provider: 'OmniRoute Gateway',
        providerType: 'omniroute',
        category: resolvedCategory,
        badge: isOmni ? 'Auto Router' : isFree ? 'Free Tier' : 'High Throughput',
        description: `Dynamic model served via OmniRoute local gateway (${id}).`,
        contextWindow: 'Standard',
        parameters: 'Dynamic',
        supportsThinking: isReason,
        isFeatured: isOmni,
        isFree: isFree,
        accentColor: '#10b981',
      });
    }
  });

  ALL_MODELS = dynamicList;
  return ALL_MODELS;
}

export function getModelById(id) {
  const found = ALL_MODELS.find(m => m.id === id);
  if (found) return found;

  const isFree = id.includes(':free') || id.includes('free');
  const isGroq = id.startsWith('groq/');
  const isOpenRouter = id.startsWith('openrouter/');
  const isOmni = id === 'auto' || id.startsWith('auto/') || id.startsWith('omniroute/') || id.startsWith('antigravity/') || id.startsWith('oc/') || id.startsWith('ddgw/') || id.startsWith('aug/') || id.startsWith('tllm/');
  const isReason = id.toLowerCase().includes('r1') || id.toLowerCase().includes('reason') || id.toLowerCase().includes('thinking');
  const isCode = id.toLowerCase().includes('code') || id.toLowerCase().includes('coder') || id.toLowerCase().includes('qwen');
  const isAcademic = id.toLowerCase().includes('claude') || id.toLowerCase().includes('sonnet') || id.toLowerCase().includes('academic');
  const isImage = id.toLowerCase().includes('flux') || id.toLowerCase().includes('diffusion') || id.toLowerCase().includes('image') || id.toLowerCase().includes('sana');
  const isVideo = id.toLowerCase().includes('video') || id.toLowerCase().includes('kling') || id.toLowerCase().includes('luma') || id.toLowerCase().includes('cogvideo') || id.toLowerCase().includes('veo');

  const resolvedCategory = isReason 
    ? 'Reasoning' 
    : isCode 
    ? 'Coding' 
    : isAcademic 
    ? 'Academics' 
    : isImage 
    ? 'Image' 
    : isVideo 
    ? 'Video' 
    : 'Chat';

  return {
    id: id,
    name: id.replace('omniroute/', '').split('/').pop() || id,
    provider: isOmni ? 'OmniRoute Gateway' : isOpenRouter ? 'OpenRouter' : isGroq ? 'Groq Cloud' : 'NVIDIA NIM',
    providerType: isOmni ? 'omniroute' : isOpenRouter ? 'openrouter' : isGroq ? 'groq' : 'nvidia',
    category: resolvedCategory,
    badge: isOmni ? 'Omni Gateway' : isFree ? 'Custom Free' : 'Custom NIM',
    description: `Model identifier (${id}).`,
    contextWindow: 'Standard',
    parameters: 'Custom',
    supportsThinking: isReason,
    isFeatured: isOmni,
    isFree: isFree,
    accentColor: isOmni ? '#10b981' : isGroq ? '#f97316' : isOpenRouter ? '#6366f1' : '#76b900',
  };
}
