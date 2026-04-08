import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const MarkdownContent = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        components={{
          a: ({ node, children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
