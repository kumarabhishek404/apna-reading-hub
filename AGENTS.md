yy<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project-specific AI workflow for apna-reading-hub

Use this workflow for feature work in this repository.

## Principles
- This project has a Next.js frontend in `frontend/` and a TypeScript backend in `backend/`.
- Prefer small, testable changes that fit the existing app structure.
- Use plain HTML pages for prototyping instead of visual generation tools.
- Keep requirements, prototypes, implementation notes, and testing notes in `docs/features/{feature-slug}/`.

## Feature workflow
1. Requirements
   - Capture functional requirements, edge cases, and API/data considerations.
   - Keep the scope aligned with the current Next.js and Prisma architecture.
2. Prototyping
   - Create one or more HTML files under `docs/features/{feature-slug}/prototype/`.
   - Use semantic HTML and simple CSS to express the main layout and key states.
   - Treat the prototype as the design reference for implementation.
3. Implementation
   - Implement the frontend in `frontend/src/` and backend logic in `backend/src/`.
   - Update Prisma schema and migrations only when the data model changes.
4. Testing
   - Verify the relevant UI flow, API behavior, and validation states.
5. Documentation
   - Update the feature docs and leave implementation notes for the next contributor.
