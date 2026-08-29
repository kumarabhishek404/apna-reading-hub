import type { NoteContainsKind } from "./searchQuery";

/** Matches http(s), www, and common bare domains like google.com */
const LINK_REGEX =
  "(https?://|www\\.|[\\w-]+\\.(com|org|net|io|in|co|edu|gov|me|app|dev|ai|info)(/|\\b))";

function linkField(field: string) {
  return { [field]: { $regex: LINK_REGEX, $options: "i" } };
}

export function noteContainsMongoClause(kind: NoteContainsKind | null | undefined) {
  if (kind === "pdf") {
    return {
      $or: [{ "blocks.type": "pdf" }, { content: { $regex: "\\[PDF:", $options: "i" } }],
    };
  }

  if (kind === "image") {
    return {
      $or: [{ "blocks.type": "image" }],
    };
  }

  if (kind === "handwriting") {
    return {
      $or: [{ "blocks.type": "handwriting" }, { content: { $regex: "\\[Handwriting:", $options: "i" } }],
    };
  }

  if (kind === "link") {
    return {
      $or: [
        { "blocks.type": "url" },
        linkField("title"),
        linkField("content"),
        linkField("blocks.url"),
        linkField("blocks.content"),
      ],
    };
  }

  return null;
}

export function noteTextMongoClause(regex: { $regex: string; $options: string }) {
  return {
    $or: [{ title: regex }, { content: regex }, { "blocks.content": regex }, { "blocks.url": regex }],
  };
}
