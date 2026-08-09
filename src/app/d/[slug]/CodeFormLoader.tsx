"use client";

import dynamic from "next/dynamic";

const CodeForm = dynamic(() => import("./CodeForm"), { ssr: false });

export default function CodeFormLoader({ slug }: { slug: string }) {
  return <CodeForm slug={slug} />;
}
