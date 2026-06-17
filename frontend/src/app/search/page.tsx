import { Suspense } from "react";
import SearchPage from "./search-content";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}
