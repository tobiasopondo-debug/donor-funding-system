"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ProjectMarkdownBody({ text }: { text: string }) {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-p:leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
