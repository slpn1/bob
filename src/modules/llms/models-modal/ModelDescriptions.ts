/**
 * Model Descriptions Mapping
 * 
 * This file allows you to add custom descriptions for models that will be shown
 * in the model information popup. The keys should match the model IDs and values
 * should be objects with description and optional icon properties.
 * 
 * You can use HTML tags in descriptions like:
 * - <p>paragraphs</p>
 * - <strong>bold text</strong> or <b>bold text</b>
 * - <em>italic text</em> or <i>italic text</i>
 * - <code>inline code</code>
 * - <ul><li>unordered lists</li></ul>
 * - <ol><li>ordered lists</li></ol>
 * - <a href="url">links</a>
 */

interface ModelInfo {
  description: string;
  icon?: string; // Path to PNG icon file
}

export const MODEL_DESCRIPTIONS: Record<string, ModelInfo> = {
  // OpenAI Models
  'openai-gpt-4.1-2025-04-14': {
    icon: '/icons/models/visionary.png',
    description: ` 
    <h2>GPT-4.1 – <em>"The Visionary"</em></h2>
  <ul>
    <li>
      <strong>Strengths:</strong> GPT-4.1 is the <strong>next-generation</strong> upgrade to GPT-4o, boasting major improvements in several areas. It's <strong>more skilled at coding and following instructions</strong> than its predecessor, and it can handle <strong>massive amounts of context</strong>. In fact, GPT-4.1 supports an unprecedented context window up to <strong>1 million tokens</strong> (about an entire book's worth of text!). It's also highly adept at long-form understanding – maintaining coherence and extracting insights even from very large inputs. In short, this model is a visionary: cutting-edge performance, a refreshed knowledge cutoff (up to mid-2024), and enhanced accuracy across the board.<br/><br/>
    </li>
    <li>
      <strong>Weaknesses:</strong> Given its vast capabilities, GPT-4.1 is <strong>resource-intensive</strong> – it may be slower or costlier per request. Its very large context is powerful but can be tricky to use effectively (models can sometimes struggle with "losing focus" in the middle of extremely long inputs).<br/><br/>
    </li>
    <li>
      <strong>Ideal Use Cases:</strong> For our medcomms agency, "The Visionary" shines in <strong>analyzing or generating large-scale documents</strong>. For example, it could ingest an entire database of medical publications or a lengthy regulatory document (thanks to the huge context) and <strong>produce a detailed summary or extract insights</strong>. It's great for complex projects like literature reviews, extensive slide decks, or coding tasks that involve analyzing large codebases or datasets. For personal use, this is the go-to model if you have a very long text to feed in (e.g., analyzing a long report or even a novel) or need extremely accurate and nuanced output.<br/><br/>
    </li>
    <li>
      <strong>Context Window:</strong> <strong>Approximately 1 000 000 tokens</strong> maximum. This is orders of magnitude larger than other models and a key feature of GPT-4.1. In practical terms, it can incorporate hundreds of pages of text in one go. This huge window enables new possibilities – like asking it questions about an entire research archive at once – without cutting information into pieces.
    </li>
  </ul>`
  },

  'openai-chatgpt-4o-latest': {
    icon: '/icons/models/generalist.png',
    description: `<h2>GPT-4o – <em>"The Generalist"</em></h2>
  <ul>
    <li><strong>Strengths:</strong> GPT-4o is the original GPT-4 model – a top-tier generalist with broad knowledge and excellent reasoning and creativity. It's a multi-modal powerhouse that can handle text, images, and even audio inputs, performing on par with earlier GPT-4 Turbo models in text and coding tasks. In other words, it's highly accurate, well-aligned, and versatile across domains (science, coding, creative writing, etc.).<br/><br/></li>
    <li><strong>Weaknesses:</strong> As the most powerful model of its generation, GPT-4o can be <strong>slower</strong> and more <strong>expensive</strong> to run compared to the smaller models. It may "overkill" simple tasks where a lighter model could suffice. Also, its knowledge is capped at its training cutoff (e.g. it won't know events after 2023 unless you use the Search version).<br/><br/></li>
    <li><strong>Ideal Use Cases:</strong> Great for in-depth medical content creation and analysis. For example, use GPT-4o to <strong>draft a comprehensive medical article</strong> or to <strong>analyze a complex clinical study</strong> with nuanced understanding. It's also excellent for general or personal uses like writing a detailed report, coding assistance on tough problems, or creative brainstorming – any scenario where you need a knowledgeable, articulate AI "expert" on hand.<br/><br/></li>
    <li><strong>Context Window:</strong> GPT-4o can handle fairly long prompts – roughly <strong>128,000 tokens by default. This means it can work with long documents or lengthy conversations, though not as large a context as the GPT-4.1 model.</li>
  </ul>`
  },

  'openai-gpt-4o-search-preview': {
    icon: '/icons/models/researcher.png',
    description: `<p><strong>High-intelligence flagship model</strong> for complex, multi-step tasks.</p>
    <h2>GPT-4o Search Preview – <em>"The Researcher"</em></h2>
  <ul>
    <li><strong>Strengths:</strong> This model is GPT-4o with an extra superpower: <strong>built-in web search</strong>. It blends GPT-4o's general intelligence with live internet querying, so it can fetch up-to-date facts and cite sources in its answers. It's perfect when you need current information (e.g. latest guidelines, recent publications) that the base model wouldn't know. It provides answers <em>grounded in real-time data</em>, often with references for transparency.<br/><br/></li>
    <li><strong>Weaknesses:</strong> Because it performs live searches, responses can be <strong>slower</strong> and depend on search-results quality. It might return "I couldn't find info" if the web doesn't readily yield an answer. Also, its creative writing is a bit constrained by the factual focus – it's more a fact-finder than a storyteller. If the task doesn't require updated info, the search step might be unnecessary overhead. THIS MODEL WILL ALWAYS USE SEARCH so if your prompt doesn't require it, your results may not be as good.<br/><br/></li>
    <li><strong>Ideal Use Cases:</strong> Perfect for medical communications tasks that require <strong>up-to-the-minute information</strong>. For example, use the Researcher to <strong>check the latest medical research or statistics</strong> when preparing a report, ensuring accuracy with cited sources. It's also useful for general needs like getting current news, real-time answers ("What's the weather in London today?"), or fact-checking personal queries – essentially acting as an <strong>AI librarian</strong> or research assistant.<br/><br/></li>
    <li><strong>Context Window:</strong> It supports a large context (similar to GPT-4o's newer variants), roughly <strong>up to 128 000 tokens</strong> in the API. In practical terms, that's extremely lengthy – it can include multiple long web snippets or documents in the prompt. This huge context means it can consider many search results or a big document while formulating answers.</li>
  </ul>`
  },

  'openai-o3': {
    icon: '/icons/models/professor.png',
    description: `<h2>OpenAI o3 – <em>"The Professor"</em></h2>
  <ul>
    <li><strong>Strengths:</strong> OpenAI o3 is our <strong>most powerful reasoning model</strong> – essentially an AI professor that excels at deep, multi-step thinking. It's trained to "think longer" before answering, meaning it can break down complex problems and use tools/skills to solve them. It sets state-of-the-art performance on challenging tasks – from coding and math to science and logical reasoning. In evaluations, o3 made significantly fewer major errors on hard problems than earlier models and is especially strong in areas like programming, consulting, and creative ideation. It also handles visual inputs very well (imagine an AI professor who can analyze charts or medical images expertly).<br/><br/></li>
    <li><strong>Weaknesses:</strong> Because it "thinks deeply," o3 can be <strong>slower</strong> in responding – it's essentially doing more heavy lifting under the hood. It may also be more <strong>expensive</strong> per call due to the advanced reasoning steps and tool usage. For straightforward queries, you might not need this level of deliberation. Additionally, since it's cutting-edge, there could be occasional over-complication – like an academic who sometimes provides more detail or process than needed for a simple question.<br/><br/></li>
    <li><strong>Ideal Use Cases:</strong> Use "The Professor" when you have a <strong>complex, multifaceted problem</strong> to solve. In medical communications, o3 could be invaluable for tasks like <strong>analyzing a complicated dataset or study</strong> (it can autonomously run Python analyses on provided data) or <strong>formulating a detailed strategic plan</strong> for a publication by searching literature, analyzing findings, and reasoning through recommendations. It's also great for tough general problems – e.g. debugging intricate code, solving advanced math word problems step-by-step, or conducting a thorough research Q&A on an open-ended question. Essentially, whenever you'd want an expert who thinks out loud and considers every angle, o3 is the choice.<br/><br/></li>
    <li><strong>Context Window:</strong> Very large. This means o3 can incorporate extensive material (multiple files, long transcripts, complex multi-part questions) into its reasoning process. It's designed to handle long conversations or big contexts without losing track, which complements its deep reasoning ability.</li>
  </ul>`
  },

  'openai-o4-mini': {
    icon: '/icons/models/problem-solver.png',
    description: `<h2>OpenAI o4 mini – <em>"The Problem Solver"</em></h2>
  <ul>
    <li><strong>Strengths:</strong> OpenAI o4-mini is a <strong>smaller-yet-mighty reasoning model</strong> optimized for speed and cost-efficiency. Despite its lighter size, it delivers <strong>remarkable performance</strong> – particularly in math, coding, and even visual tasks. Think of it as a quick-witted problem solver: it can tackle analytical tasks fast and cheaply, making it ideal for high-volume or real-time use. O4-mini actually <strong>outperforms its predecessor (o3-mini)</strong> on both STEM and non-STEM benchmarks, and even achieved top-tier results on medical exams like AIME when allowed to use tools. In short, it offers <strong>excellent bang-for-buck</strong>, retaining much of o3's reasoning ability at a fraction of the cost/latency.<br/><br/></li>
    <li><strong>Weaknesses:</strong> As a "mini" model, it isn't quite as absolutely powerful as the full o3. On the very hardest tasks or highly nuanced expert questions, it might not reach the depth of "The Professor." It's geared for efficiency, so occasionally it may simplify problems a bit more or use less elaborate reasoning. However, for most practical purposes it's extremely capable. Also, while it can use tools and handle images, it's not the <em>most</em> advanced in those areas – rather a solid all-rounder with a reasoning focus.<br/><br/></li>
    <li><strong>Ideal Use Cases:</strong> O4-mini is great for <strong>everyday problem-solving</strong> in our medcomms context. For example, it can rapidly <strong>analyze a dataset or parse an image (like a chart or scan)</strong> to extract key insights, which is useful for quick-turnaround projects. It's also perfect for powering tools like a real-time medical Q&A chatbot or a coding assistant in our team – where you need good reasoning but also fast responses and scalability. In personal or general use, think of tasks like quickly troubleshooting an error in code, doing math calculations or data analysis, or summarizing a moderate-length article – all with speed and cost-effectiveness.<br/><br/></li>
    <li><strong>Context Window:</strong> O4-mini supports a <strong>128 000-token context</strong> and up to about <strong>16 K tokens output</strong>. That's a very large window (similar to GPT-4o mini's), allowing it to ingest long inputs – e.g. multiple documents or a lengthy conversation – and still respond swiftly. This high capacity, combined with its efficiency, means you can rely on it for bulk or real-time tasks without running into context limits easily.</li>
  </ul>`
  },

  'gpt-3.5-turbo': {
    icon: '/icons/models/fast.png',
    description: `<p><strong>Fast and cost-effective model</strong> for everyday use.</p>
    <p>Perfect for general conversations, basic writing, and simple tasks.</p>`
  },

  // Claude Models (with base patterns for better matching)
  'claude-3-5-sonnet': {
    icon: '/icons/models/intelligent.png',
    description: `<p><strong>Most intelligent Claude model</strong> with excellent coding abilities and nuanced understanding.</p>
    <p>Great for complex analysis, coding tasks, and detailed reasoning.</p>`
  },
  'claude-3-5-sonnet-20241022': {
    icon: '/icons/models/intelligent.png',
    description: 'Most intelligent Claude model with excellent coding abilities and nuanced understanding.'
  },
  'claude-3-5-haiku': {
    icon: '/icons/models/fast.png',
    description: `<p><strong>Fast and efficient Claude model</strong> for quick tasks and real-time applications.</p>
    <p>Perfect for simple tasks when speed is important.</p>`
  },
  'claude-3-5-haiku-20241022': {
    icon: '/icons/models/fast.png',
    description: 'Fast and efficient Claude model for quick tasks and real-time applications.'
  },
  'claude-3-opus': {
    icon: '/icons/models/research.png',
    description: `<p><strong>Most capable Claude model</strong> for complex reasoning and creative tasks.</p>
    <p>Excellent for research, analysis, and tasks requiring deep understanding.</p>`
  },
  'claude-3-opus-20240229': {
    icon: '/icons/models/research.png',
    description: 'Most capable Claude model for complex reasoning and creative tasks.'
  },
  'claude-3-sonnet': {
    icon: '/icons/models/generalist.png',
    description: `<p><strong>Balanced model</strong> offering good performance for a wide range of tasks.</p>
    <p>Good general-purpose model for most everyday uses.</p>`
  },
  'claude-3-sonnet-20240229': {
    icon: '/icons/models/generalist.png',
    description: 'Balanced model offering good performance for a wide range of tasks.'
  },
  'claude-3-haiku': {
    icon: '/icons/models/fast.png',
    description: `<p><strong>Fastest Claude model</strong>, optimized for simple tasks and quick responses.</p>
    <p>Best when you need fast responses for basic tasks.</p>`
  },
  'claude-3-haiku-20240307': {
    icon: '/icons/models/fast.png',
    description: 'Fastest Claude model, optimized for simple tasks and quick responses.'
  },

  // Gemini Models
  'gemini-pro': {
    icon: '/icons/models/multimodal.png',
    description: 'Google\'s multimodal model capable of understanding text, images, and code.'
  },
  'gemini-pro-vision': {
    icon: '/icons/models/multimodal.png',
    description: 'Gemini model with enhanced vision capabilities for image analysis.'
  },

  // Llama Models
  'llama-3.1-70b-versatile': {
    icon: '/icons/models/generalist.png',
    description: 'Large open-source model with strong performance across diverse tasks.'
  },
  'llama-3.1-8b-instant': {
    icon: '/icons/models/fast.png',
    description: 'Smaller, faster Llama model good for quick responses and simple tasks.'
  },
  'llama-2-70b-chat': {
    icon: '/icons/models/generalist.png',
    description: 'Previous generation Llama model with good conversational abilities.'
  },

  // Mistral Models
  'mistral-large': {
    icon: '/icons/models/multilingual.png',
    description: 'Mistral\'s flagship model with strong reasoning and multilingual capabilities.'
  },
  'mistral-medium': {
    icon: '/icons/models/generalist.png',
    description: 'Balanced Mistral model offering good performance for most tasks.'
  },
  'mistral-small': {
    icon: '/icons/models/fast.png',
    description: 'Efficient Mistral model optimized for speed and cost.'
  },

  // DeepSeek Models
  'deepseek-chat': {
    icon: '/icons/models/generalist.png',
    description: 'DeepSeek\'s chat model with strong coding and reasoning capabilities.'
  },
  'deepseek-coder': {
    icon: '/icons/models/coding.png',
    description: 'Specialized model optimized for programming and code generation tasks.'
  },

  // Add more model descriptions here...
  // Format: 'model-id': { icon: '/path/to/icon.png', description: 'Description of the model and its best use cases' },
};

/**
 * Get a description for a model, with fallback logic for versioned models
 */
export function getModelDescription(modelId: string): string {
  const modelInfo = getModelInfo(modelId);
  return modelInfo.description;
}

/**
 * Get model info (description and icon) for a model, with fallback logic for versioned models
 */
export function getModelInfo(modelId: string): ModelInfo {
  // Direct match
  if (MODEL_DESCRIPTIONS[modelId]) {
    return MODEL_DESCRIPTIONS[modelId];
  }

  // Try to find a base model match (for versioned models)
  // For example: gpt-4o-2024-08-06 -> gpt-4o
  const baseModelId = modelId.split('-').slice(0, -1).join('-');
  if (baseModelId && MODEL_DESCRIPTIONS[baseModelId]) {
    return MODEL_DESCRIPTIONS[baseModelId];
  }

  // Try an even shorter base model (for models with multiple version segments)
  // For example: gpt-4o-2024-08-06 -> gpt-4o or claude-3-5-sonnet-20241022 -> claude-3-5-sonnet
  if (baseModelId) {
    const shorterBaseId = baseModelId.split('-').slice(0, -1).join('-');
    if (shorterBaseId && MODEL_DESCRIPTIONS[shorterBaseId]) {
      return MODEL_DESCRIPTIONS[shorterBaseId];
    }
  }

  // Try to find exact prefix matches (safer than includes)
  for (const [key, modelInfo] of Object.entries(MODEL_DESCRIPTIONS)) {
    if (modelId.startsWith(key + '-') || key.startsWith(modelId + '-')) {
      return modelInfo;
    }
  }

  // Default fallback
  return {
    description: `<p><em>No description available for this model.</em></p>
    <p>This model is available for use but doesn't have a custom description yet.</p>`
  };
} 