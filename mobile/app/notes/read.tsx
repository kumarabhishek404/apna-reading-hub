import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ReadNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/notes/edit?id=${id ?? ''}` as any} />;
}
