# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps, generate Prisma client, run migrations
npm run dev          # Start dev server at http://localhost:3000 (Turbopack)
npm run build        # Production build
npm run test         # Run all tests with Vitest
npm run test -- --reporter=verbose src/path/to/file.test.ts  # Run a single test file
npm run lint         # ESLint
npm run db:reset     # Reset SQLite database (destructive)
```

**Do not run `npm audit fix`** — dependencies are pinned to known-working versions. Bumping them can break the app.

## Environment

Copy `.env.local` and set:
- `ANTHROPIC_API_KEY` — required for real AI generation; without it the app falls back to a `MockLanguageModel` that returns canned components
- `JWT_SECRET` — defaults to `"development-secret-key"` if unset

## Architecture

### Virtual File System

The core abstraction is `VirtualFileSystem` (`src/lib/file-system.ts`) — an in-memory tree of `FileNode` objects. **No generated files are written to disk.** The AI operates on this VFS via two tools:

- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create/view/edit files using str-replace
- `file_manager` (`src/lib/tools/file-manager.ts`) — rename/delete/list files

The VFS is serialized as JSON and stored in the `Project.data` column (SQLite via Prisma). On each chat request, the frontend sends the current `files` state to the API route, which deserializes it into a fresh `VirtualFileSystem` instance.

### AI Chat Flow

`POST /api/chat` (`src/app/api/chat/route.ts`) is the only AI endpoint. It:
1. Reconstructs the VFS from the serialized `files` payload
2. Calls `streamText` (Vercel AI SDK) with the system prompt, user messages, and the two VFS tools
3. Streams the response back; on finish, saves updated messages + VFS state to the DB if a `projectId` is provided and the user is authenticated

The model is selected by `getLanguageModel()` (`src/lib/provider.ts`): real Claude (`claude-haiku-4-5`) if `ANTHROPIC_API_KEY` is set, otherwise `MockLanguageModel`.

### Preview / JSX Transform

Generated JSX/TSX files are transformed client-side by `transformJSX` (`src/lib/transform/jsx-transformer.ts`) using `@babel/standalone`. The preview iframe (`PreviewFrame.tsx`) resolves imports against the VFS — missing local imports are replaced with placeholder components, and CSS imports are stripped.

### Auth

JWT-based session auth (`src/lib/auth.ts`) with bcrypt passwords stored in SQLite. Sessions are 7-day httpOnly cookies. Anonymous users can use the app without signing in; projects are only persisted for authenticated users.

### Data Model

```
User      id, email, password, createdAt, updatedAt
Project   id, name, userId?, messages (JSON), data (JSON), createdAt, updatedAt
```

`messages` stores the full Vercel AI SDK message array. `data` stores the serialized VFS.

### Key Contexts

- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — manages messages, streaming state, project ID
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — manages VFS state on the client; syncs with the server on project load
