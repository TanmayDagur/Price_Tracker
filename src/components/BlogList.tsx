'use client';

import React, { useState, useMemo } from 'react';
import { PostMetadata } from '../lib/markdown';

interface BlogListProps {
  initialPosts: PostMetadata[];
}

export default function BlogList({ initialPosts }: BlogListProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialPosts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return ['ALL', ...Array.from(tags)];
  }, [initialPosts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesTag = selectedTag === 'ALL' || post.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [initialPosts, search, selectedTag]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Search & Filter Controls */}
      <div className="glass-card" style={{ padding: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '240px',
            background: 'var(--bg-tertiary) !important',
            border: '1px solid var(--border-medium) !important',
            borderRadius: 'var(--radius-sm) !important',
            padding: '8px 16px !important',
            color: 'var(--text-primary) !important',
            outline: 'none !important',
          }}
        />
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                background: selectedTag === tag ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of posts */}
      <div className="grid-3 stagger">
        {filteredPosts.length > 0 ? filteredPosts.map(post => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="glass-card animate-fade-in-up"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textDecoration: 'none', height: '100%', padding: 'var(--space-lg)' }}
          >
            <div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                {post.tags.map(tag => (
                  <span key={tag} className="badge badge--info" style={{ fontSize: '0.65rem' }}>{tag}</span>
                ))}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', lineHeight: '1.4' }}>{post.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-md)' }}>
                {post.description}
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <span>{new Date(post.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>{post.readTime}</span>
            </div>
          </a>
        )) : (
          <div className="glass-card w-full" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            No articles match your search query.
          </div>
        )}
      </div>
    </div>
  );
}
