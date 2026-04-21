import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface DiscordMarkdownProps {
  children: string;
  className?: string;
}

const Spoiler = ({ children }: { children: React.ReactNode }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(true)}
      className={`cursor-pointer rounded px-1 transition-colors duration-200 ${
        revealed ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-800 text-transparent hover:bg-zinc-700'
      }`}
    >
      {children}
    </span>
  );
};

export default function DiscordMarkdown({ children, className = '' }: DiscordMarkdownProps) {
  // Pre-process Discord-specific markdown into HTML tags that rehype-raw can parse
  // Spoilers: ||text|| -> <spoiler>text</spoiler>
  // Underline: __text__ -> <u>text</u>
  
  const processedText = children
    .replace(/\|\|(.*?)\|\|/g, '<spoiler>$1</spoiler>')
    .replace(/__(.*?)__/g, '<u>$1</u>');

  return (
    <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // @ts-ignore
          spoiler: ({ node, ...props }) => <Spoiler {...props} />,
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-zinc-800/30 rounded-r-lg text-zinc-300 italic" {...props} />
          ),
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
}
