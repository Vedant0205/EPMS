import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Parses inline spans: bold, italic, inline code, inline math, and links
const renderInline = (text: string): React.ReactNode[] => {
  // Matches tokens in order of precedence: inline code, inline math, bold, italic, markdown link
  const tokenRegex = /(`[^`]+`|\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-cyan-700 dark:text-cyan-300 font-mono text-xs border border-slate-200 dark:border-navy-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-slate-800 dark:text-slate-200 font-mono text-xs border border-slate-200 dark:border-navy-800 font-medium"
        >
          {part.slice(1, -1)}
        </span>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-navy-900 dark:text-lavender-50">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 dark:text-cyan-400 underline hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for restricted clipboard contexts
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700/60 bg-navy-950 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-navy-900 border-b border-navy-800 text-xs text-slate-400">
        <span className="font-mono lowercase">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors focus:outline-none"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Normalize Windows line endings and split into major block sections
  const normalized = content.replace(/\r\n/g, '\n');
  const blocks = normalized.split(/\n\n+/);

  return (
    <div className={`space-y-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Fenced code block detection
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const firstLineEnd = trimmed.indexOf('\n');
          const language = firstLineEnd > 3 ? trimmed.slice(3, firstLineEnd).trim() : '';
          const code = firstLineEnd !== -1 ? trimmed.slice(firstLineEnd + 1, -3).replace(/\n$/, '') : '';
          return <CodeBlock key={blockIdx} language={language} code={code} />;
        }

        // Display math formula block detection
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const formula = trimmed.slice(2, -2).trim();
          return (
            <div
              key={blockIdx}
              className="my-3 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/80 font-mono text-xs sm:text-sm text-center text-slate-900 dark:text-slate-100 overflow-x-auto"
            >
              {formula}
            </div>
          );
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={blockIdx} className="font-semibold text-base text-navy-900 dark:text-lavender-50 pt-1">
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={blockIdx} className="font-bold text-lg text-navy-900 dark:text-lavender-50 pt-1.5 border-b border-slate-200 dark:border-navy-800 pb-1">
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={blockIdx} className="font-bold text-xl text-navy-900 dark:text-lavender-50 pt-2 border-b border-slate-200 dark:border-navy-800 pb-1">
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // Blockquote
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, ''));
          return (
            <blockquote
              key={blockIdx}
              className="my-2 border-l-2 border-cyan-500 pl-3 py-1 bg-cyan-500/5 text-slate-700 dark:text-slate-300 italic rounded-r"
            >
              {quoteLines.map((line, qIdx) => (
                <p key={qIdx}>{renderInline(line)}</p>
              ))}
            </blockquote>
          );
        }

        // Markdown Table detection
        const lines = trimmed.split('\n');
        if (lines.length >= 2 && lines[0].includes('|') && lines[1].includes('|') && lines[1].includes('-')) {
          const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
          const bodyRows = lines.slice(2).filter(row => row.includes('|')).map(row =>
            row.split('|').map(c => c.trim()).filter(Boolean)
          );

          return (
            <div key={blockIdx} className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-navy-800">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-navy-800 text-xs">
                <thead className="bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-200 font-semibold">
                  <tr>
                    {headerCells.map((cell, cIdx) => (
                      <th key={cIdx} className="px-3 py-2 text-left">
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-800 bg-white dark:bg-navy-950">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/50 dark:bg-navy-900/40' : ''}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Unordered or Ordered lists
        const isList = lines.every(l => /^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l));
        if (isList) {
          const isOrdered = /^\d+\.\s+/.test(lines[0]);
          if (isOrdered) {
            return (
              <ol key={blockIdx} className="list-decimal pl-5 space-y-1">
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>{renderInline(line.replace(/^\d+\.\s+/, ''))}</li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={blockIdx} className="list-disc pl-5 space-y-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>{renderInline(line.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={blockIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
