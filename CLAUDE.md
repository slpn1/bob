# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a customized fork of **big-AGI** (v1.92.0), branded as **Lumina** - an AI assistant for Scientific Group (including AS&K and Remedica medical communications agencies). It's a Next.js application providing AI chat, voice calls, beam (multi-model comparison), and other AI-powered features.

## Development Commands

### Running the Application
```bash
# Development server with hot reload and debugging
npm run dev

# Development server with HTTPS (requires SSL certificates in ./ssl/)
npm run dev-https

# Production build
npm run build

# Start production server
npm start
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npm run postinstall

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Linting and Analysis
```bash
# Run ESLint
npm run lint

# Analyze bundle size (set ANALYZE_BUNDLE=true)
ANALYZE_BUNDLE=true npm run build
```

### Testing
There are no test scripts configured in this project.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.1.8 (Pages Router + App Router hybrid)
- **Language**: TypeScript with strict mode
- **Styling**: MUI Joy UI (@mui/joy) with Emotion
- **State Management**: Zustand stores + React Query (TanStack Query)
- **Backend**: tRPC for type-safe API routes
- **Database**: PostgreSQL with Prisma ORM (optional, used for chat sharing)
- **Authentication**: NextAuth.js with Azure AD (MSAL)

### Directory Structure

```
src/
├── apps/              # Feature applications (chat, call, beam, draw, etc.)
│   ├── chat/         # Main chat interface
│   ├── call/         # Voice calling feature
│   ├── beam/         # Multi-model comparison
│   ├── draw/         # Image generation
│   ├── personas/     # AI persona management
│   └── settings-modal/
├── common/           # Shared utilities and infrastructure
│   ├── components/   # Reusable UI components
│   ├── stores/       # Zustand state stores (chat, llms, ui, etc.)
│   ├── layout/       # Layout components (Optima layout system)
│   ├── logger/       # Client-side logging system
│   ├── providers/    # React context providers
│   └── util/         # Utility functions
├── modules/          # Feature modules
│   ├── llms/         # LLM vendor integrations (OpenAI, Anthropic, etc.)
│   │   ├── vendors/  # 20+ LLM provider implementations
│   │   ├── server/   # Server-side LLM streaming
│   │   └── models-modal/  # Model selection UI
│   ├── aifn/         # AI functions (summarize, imagine, autotitle, etc.)
│   ├── aix/          # AIX framework for AI operations
│   ├── beam/         # Beam-specific logic
│   ├── blocks/       # Content rendering blocks (code, markdown, LaTeX)
│   └── [others]/     # Browse, ElevenLabs, Google, T2I, etc.
├── server/           # Server-side code
│   ├── trpc/         # tRPC router and procedures
│   ├── prisma/       # Database schema and client
│   ├── services/     # Backend services (logging, etc.)
│   └── env.ts        # Server environment validation
└── data.ts           # System purposes/personas definitions

pages/                # Next.js Pages Router routes
app/                  # Next.js App Router routes
  └── api/            # API route handlers
```

### Key Architectural Patterns

#### 1. tRPC API Layer
- All API routes use tRPC for type-safe client-server communication
- Main router defined in `src/server/trpc/`
- Procedures can be public (no auth required)
- Context includes user session from NextAuth

#### 2. State Management
- **Zustand stores** for global state:
  - `store-chat.ts`: Conversation and message management
  - `store-llms/`: LLM configurations and model registry
  - `store-ui.ts`: UI state (theme, layouts)
  - `store-ux-labs.ts`: Experimental features
- **React Query**: Server state and API caching

#### 3. LLM Vendor System
- Vendor registry pattern in `src/modules/llms/vendors/`
- Each vendor implements `IModelVendor` interface
- Supports 20+ providers: OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, LM Studio, Ollama, etc.
- Server-side streaming for LLM responses

#### 4. Message System
- Messages stored in `DMessage` type with content fragments
- Support for text, images, attachments, tool calls
- Conversation state in `DConversation` type
- Client-side storage in IndexedDB (via Dexie)

#### 5. AIX Framework
- New AI execution framework for chaining operations
- Located in `src/modules/aix/`
- Supports streaming and multi-step AI workflows

## Important Configuration

### Environment Variables
Key variables in `.env`:
- **Authentication**: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
- **NextAuth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **OpenAI**: `OPENAI_API_KEY`, `OPENAI_API_ORG_ID`, `OPENAI_ALLOWED_MODELS`
- **Database** (optional): `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
- **PostHog Analytics** (optional): `POSTHOG_API_KEY`, `POSTHOG_ENV_ID`

### Brand Customization
The application is rebranded from "big-AGI" to "Lumina":
- Brand configuration: `src/common/app.config.ts`
- Default system prompt: `src/data.ts` (Generic persona)
- The system prompt is customized for medical communications work

### Path Aliases (tsconfig.json)
```typescript
"~/common/*"  → "src/common/*"
"~/modules/*" → "src/modules/*"
"~/server/*"  → "src/server/*"
```

## Common Development Patterns

### Adding a New LLM Vendor
1. Create vendor directory in `src/modules/llms/vendors/[vendor-name]/`
2. Implement `IModelVendor` interface
3. Add server-side streaming logic
4. Register in `vendors.registry.ts`

### Creating a New App/Feature
1. Create directory in `src/apps/[feature-name]/`
2. Create page route in `pages/[feature-name].tsx`
3. Add route constant to `src/common/app.routes.ts`
4. Update navigation in `src/common/app.nav.ts`

### Working with Conversations
- Use `useChatStore()` hook to access conversation state
- Message creation: `createDMessage()` helpers
- Content rendering: `src/modules/blocks/` components

### Adding tRPC Endpoints
1. Add procedure to appropriate router in `src/server/trpc/`
2. Use `publicProcedure` base
3. Input validation with Zod schemas
4. Access user context via `ctx.user`

## Database Notes

The database is **optional**. When not configured:
- All data stored client-side in IndexedDB
- Chat sharing feature is disabled

When database is configured:
- Used primarily for `LinkStorage` (chat sharing)
- Schema defined in `src/server/prisma/schema.prisma`
- After schema changes: `npm run db:push` and `npm run postinstall`

## Build Configuration

- TypeScript strict mode enabled
- Build errors ignored in production (`ignoreBuildErrors: true`)
- Source maps enabled for debugging
- Webpack configured for:
  - Async WebAssembly (tiktoken tokenizer)
  - MUI Material → Joy aliasing
  - Minimal chunk size of 40KB
  - PostHog error tracking with source map upload

## Authentication Flow

1. Azure AD OAuth via NextAuth.js
2. MSAL configuration in `msalConfig.js`
3. Session stored in JWT tokens
4. User context available in tRPC procedures
5. Middleware authentication in `middleware.ts`

## Known Patterns

### Rendering Content
- **Mermaid diagrams**: Enabled for specific diagram types (Flow, Sequence, etc.)
- **PlantUML**: Rendering enabled
- **LaTeX/KaTeX**: Math formula rendering via rehype-katex
- **Code blocks**: Syntax highlighting with Prism.js
- **SVG**: Direct rendering support

### Client-Side Storage
- Conversations: Dexie (IndexedDB wrapper)
- Settings: idb-keyval for key-value storage
- Attachments: Browser filesystem APIs via `browser-fs-access`

### Performance Optimizations
- React strict mode disabled for performance
- Bundle chunking with 40KB minimum
- Source map strategy: 'cheap-module-source-map'
- Optional bundle analyzer with `ANALYZE_BUNDLE=true`

## Main Branch

The main development branch is `v1-dev` (not `main`). Use this for PRs and deployments.
