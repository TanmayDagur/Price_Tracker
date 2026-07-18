import fs from 'fs';
import path from 'path';

export interface PostMetadata {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  slug: string;
  readTime: string;
}

export interface Post {
  metadata: PostMetadata;
  html: string;
}

export function parseMarkdown(mdContent: string, slug: string): Post {
  let frontmatter: any = {};
  let content = mdContent;

  if (mdContent.startsWith('---')) {
    const parts = mdContent.split('---');
    if (parts.length >= 3) {
      const yaml = parts[1];
      content = parts.slice(2).join('---');

      const lines = yaml.split('\n');
      lines.forEach((line) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim();
          let val = line.slice(colonIdx + 1).trim();
          // Clean quotes
          val = val.replace(/^["']|["']$/g, '');
          
          if (key === 'tags') {
            frontmatter[key] = val
              .replace(/[\[\]]/g, '')
              .split(',')
              .map((t) => t.trim().replace(/^["']|["']$/g, ''));
          } else {
            frontmatter[key] = val;
          }
        }
      });
    }
  }

  // Calculate dynamic reading time
  const wordCount = content.trim().split(/\s+/).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  // Standardize newlines
  let formatted = content.replace(/\r\n/g, '\n').trim();

  // Parse Headings
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="color: var(--text-primary); margin: var(--space-lg) 0 var(--space-sm); font-size: 1.25rem;">$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="color: var(--text-primary); margin: var(--space-xl) 0 var(--space-md); font-size: 1.6rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gim, '<h1 style="color: var(--text-primary); margin: var(--space-2xl) 0 var(--space-lg); font-size: 2.2rem;">$1</h1>');

  // Parse Bold & Italics
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em style="color: var(--text-secondary);">$1</em>');

  // Parse Links
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-gradient" style="font-weight: 600; text-decoration: underline;">$1</a>');

  // Parse Inline Code blocks
  formatted = formatted.replace(/`(.*?)`/g, '<code class="font-mono" style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); color: var(--accent-cyan);">$1</code>');

  // Parse Blockquotes
  formatted = formatted.replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid var(--accent-cyan); padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-lg); background: rgba(6, 182, 212, 0.03); border-radius: 0 var(--radius-md) var(--radius-md) 0; color: var(--text-secondary); margin: var(--space-lg) 0; font-style: italic;">$1</blockquote>');

  // Parse Bullet Lists
  const lines = formatted.split('\n');
  let inList = false;
  const parsedLines = lines.map(line => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    if (isBullet) {
      const cleanText = line.trim().substring(2);
      if (!inList) {
        inList = true;
        return `<ul style="list-style-type: disc; padding-left: var(--space-xl); margin: var(--space-md) 0; display: flex; flex-direction: column; gap: 8px; color: var(--text-secondary);"><li>${cleanText}</li>`;
      }
      return `<li>${cleanText}</li>`;
    } else {
      if (inList) {
        inList = false;
        return `</ul>\n${line}`;
      }
      return line;
    }
  });
  if (inList) {
    parsedLines.push('</ul>');
  }
  formatted = parsedLines.join('\n');

  // Parse Paragraphs (group double newlines)
  const blocks = formatted.split(/\n\s*\n/);
  const html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      // If block is already wrapped in HTML element (e.g. h1, h2, h3, ul, blockquote, p), return it directly
      if (/^<(h1|h2|h3|ul|blockquote|p)/i.test(trimmed)) {
        return trimmed;
      }
      // Otherwise wrap in paragraph
      return `<p style="line-height: 1.8; margin-bottom: var(--space-lg); color: var(--text-secondary); font-size: 1.05rem;">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return {
    metadata: {
      title: frontmatter.title || 'Untitled Post',
      description: frontmatter.description || '',
      date: frontmatter.date || new Date().toLocaleDateString(),
      author: frontmatter.author || 'Anonymous',
      tags: frontmatter.tags || [],
      slug,
      readTime,
    },
    html,
  };
}

export function getAllPosts(): PostMetadata[] {
  const blogDir = path.join(process.cwd(), 'content/blog');
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir);
  const posts = files
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace('.md', '');
      const fullPath = path.join(blogDir, filename);
      const content = fs.readFileSync(fullPath, 'utf8');
      const { metadata } = parseMarkdown(content, slug);
      return metadata;
    });

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const blogDir = path.join(process.cwd(), 'content/blog');
  const fullPath = path.join(blogDir, `${slug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const content = fs.readFileSync(fullPath, 'utf8');
  return parseMarkdown(content, slug);
}
