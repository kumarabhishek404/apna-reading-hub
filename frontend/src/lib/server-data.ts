/**
 * Server-only data access for RSC pages.
 * Avoids HTTP self-fetch to /api on Vercel (which causes SSR 500s).
 */
import "server-only";

import { getBlogById } from "@backend/services/blog.service";
import { getLinkById } from "@backend/services/link.service";
import { getNoteById } from "@backend/services/note.service";
import { getPdfById } from "@backend/services/pdf.service";

export { getBlogById, getLinkById, getNoteById, getPdfById };
