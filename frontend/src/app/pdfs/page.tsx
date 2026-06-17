import { Suspense } from "react";
import { PdfsPageClient } from "@/components/pdfs/pdfs-page";

export default function PdfsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">Loading...</div>}>
      <PdfsPageClient />
    </Suspense>
  );
}
