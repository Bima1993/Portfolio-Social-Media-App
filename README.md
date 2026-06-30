# Sociality Frontend MVP

Social media MVP frontend built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives, Redux Toolkit, TanStack Query, React Hook Form, Zod, and Day.js.

## API

Default API base URL:

```txt
https://be-social-media-api-production.up.railway.app
```

Swagger docs:

```txt
https://be-social-media-api-production.up.railway.app/api-swagger
```

Copy `.env.example` to `.env.local` if the API base URL needs to change.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Scaffold

- `src/lib` contains shared API utilities, constants, types, and class helpers.
- `src/store` contains the Redux store and auth session slice.
- `src/app/providers.tsx` wires Redux and TanStack Query.
- `src/features/*/api.ts` contains endpoint wrappers by domain.
- `src/components/ui` contains shadcn-compatible primitives ready for the Figma UI pass.
