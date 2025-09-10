import React from 'react';

interface FormattedTraceProps {
  content: string;
  className?: string;
}

// Token-to-style mapping
const styleMap: Record<string, string> = {
  BOLD: 'font-bold',
  DIM: 'opacity-60',
  GREY: 'text-gray-400',
  RED: 'text-red-400',
  GREEN: 'text-green-400',
  YELLOW: 'text-yellow-400',
  CYAN: 'text-cyan-400',
  WHITE: 'text-white',
  MAGENTA: 'text-purple-400',
};

// Recursive parser that handles nested formatting tokens
const parseFormattedText = (text: string, keyCounter = { value: 0 }): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  let currentIndex = 0;

  // Find the first opening tag
  const openTagRegex = /\[(\w+)\]/g;
  let match;

  while ((match = openTagRegex.exec(text)) !== null) {
    const [openTag, styleToken] = match;
    const matchStart = match.index;
    const closeTag = `[/${styleToken}]`;
    
    // Add any text before this match
    if (matchStart > currentIndex) {
      const plainText = text.slice(currentIndex, matchStart);
      if (plainText) {
        tokens.push(plainText);
      }
    }

    // Find the matching closing tag
    let depth = 1;
    let searchIndex = matchStart + openTag.length;
    let closeIndex = -1;

    while (depth > 0 && searchIndex < text.length) {
      const nextOpen = text.indexOf(`[${styleToken}]`, searchIndex);
      const nextClose = text.indexOf(closeTag, searchIndex);

      if (nextClose === -1) break; // No closing tag found

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Found another opening tag before the closing tag
        depth++;
        searchIndex = nextOpen + openTag.length;
      } else {
        // Found the closing tag
        depth--;
        if (depth === 0) {
          closeIndex = nextClose;
        }
        searchIndex = nextClose + closeTag.length;
      }
    }

    if (closeIndex !== -1) {
      // Extract content between tags
      const content = text.slice(matchStart + openTag.length, closeIndex);
      
      // Add the styled content (recursively parse nested content)
      const className = styleMap[styleToken.toUpperCase()];
      if (className) {
        tokens.push(
          <span key={keyCounter.value++} className={className}>
            {parseFormattedText(content, keyCounter)}
          </span>
        );
      } else {
        // Fallback for unknown tokens - just parse the content
        tokens.push(...parseFormattedText(content, keyCounter));
      }
      
      currentIndex = closeIndex + closeTag.length;
      openTagRegex.lastIndex = currentIndex;
    } else {
      // No matching closing tag found, treat as plain text
      const plainText = text.slice(matchStart);
      tokens.push(plainText);
      break;
    }
  }
  
  // Add any remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      tokens.push(remainingText);
    }
  }
  
  return tokens;
};

export function FormattedTrace({ content, className = '' }: FormattedTraceProps) {
  const parsedContent = parseFormattedText(content);
  
  return (
    <div className={`whitespace-pre-wrap font-mono ${className}`}>
      {parsedContent}
    </div>
  );
}
