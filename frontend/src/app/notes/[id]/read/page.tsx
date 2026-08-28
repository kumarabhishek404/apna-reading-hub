import { redirect } from "next/navigation";

export default async function NoteReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/notes/${id}/edit`);
}
