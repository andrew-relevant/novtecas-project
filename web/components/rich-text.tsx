interface RichTextProps {
  content: string | null;
  className?: string;
}

export function RichText({ content, className = "" }: RichTextProps) {
  if (!content) return null;

  return (
    <div
      className={`prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
