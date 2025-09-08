# Agent Guidelines

## Commands
- `bun run dev` - Start development servers
- `bun run build` - Build all apps
- `bun run check-types` - Type checking
- `bun run dev:web` - Web app only
- `bun run dev:server` - Server only

## Code Style
- Use TypeScript with strict mode
- Import paths: `@/*` for app imports
- Components: PascalCase, files: kebab-case
- Use Zod for validation
- ORPC for API routes
- Tailwind CSS with shadcn/ui components
- No default exports, named exports only
- Error handling with try/catch and proper types