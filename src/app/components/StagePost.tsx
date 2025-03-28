'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import styles from './StagePost.module.css';
import useSWR from 'swr';

interface Get {
  postNumber: string;
  comment: string;
  checkCount: number;
  getType: string;
  hasImage?: boolean;
  filename?: string;
  ext?: string;
  tim?: number;
  sub?: string;
  resto?: number;
  threadId?: number;
}

interface StagePostProps {
  position: 'top' | 'middle' | 'bottom';
  cardType?: 'gets' | 'insights' | 'meds';
}

function parseComment(html: string): React.ReactNode {
  // Convert HTML to text first
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Convert quote links (>>123456) to text
  const quoteLinks = div.getElementsByClassName('quotelink');
  Array.from(quoteLinks).forEach(link => {
    link.textContent = link.textContent || link.getAttribute('href')?.replace('#p', '>>') || '';
  });

  // Convert <br> to newlines
  let text = div.innerHTML
    .replace(/<br\s*\/?>/g, '\n')
    // Convert quotes to greentext
    .replace(/<span class="quote">&gt;/g, '>')
    // Remove any remaining HTML tags
    .replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

  // Split the text into segments, preserving post references
  const segments = text.split(/(&gt;&gt;|>>)(\d+)/g);
  
  return (
    <span>
      {segments.map((segment, index) => {
        // Every third element is a post number (after the '>>' match)
        if (index % 3 === 2) {
          return (
            <a
              key={index}
              href={`https://archive.4plebs.org/x/post/${segment}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.postNumber}
            >
              &gt;&gt;{segment}
            </a>
          );
        }
        // Skip the '>>' matches
        if (index % 3 === 1) {
          return null;
        }
        // Regular text
        return segment;
      })}
    </span>
  );
}

/**
 * Format check count into natural language
 */
function formatCheckCount(count: number): string {
  if (count === 0) return 'Not checked yet';
  if (count === 1) return 'Checked once';
  if (count === 2) return 'Checked twice';
  if (count === 3) return 'Checked thrice';
  return `Checked ${count} times`;
}

export default function StagePost({ position, cardType = 'gets' }: StagePostProps) {
  const { data: post, error, isLoading } = useSWR<Post>(
    position === 'top' ? '/api/top-post' : '/api/latest-post',
    fetcher
  );

  if (error) return <div className={styles.error}>Failed to load post</div>;
  if (isLoading || !post) return <div className={styles.loading}>Loading...</div>;

  const formattedDate = new Date(post.time * 1000).toLocaleString();

  const archiveUrl = `https://archive.4plebs.org/x/post/${post.no}/`;
  const parsedComment = post.com ? parseComment(post.com) : '';

  return (
    <div className={styles.stagePost}>
      <div className={styles.header}>
        <span className={styles.name}>Anonymous</span>
        <a 
          href={`https://archive.4plebs.org/x/post/${post.no}/`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.postNumber}
        >
          No.{post.no}
        </a>
      </div>
      <div className={styles.comment}>
        {post.tim && (
          <span className={styles.greentext}>&gt;pic related</span>
        )}
        {parsedComment || <span className={styles.placeholderComment}>&gt;pic related</span>}
      </div>
      <div className={styles.footer}>
        {cardType === 'insights' ? (
          <span className={styles.checkCount}>
            {post.replies} {post.replies === 1 ? 'Reply' : 'Replies'}
          </span>
        ) : (
          <>
            <span className={styles.getType}>
              {post.getType.charAt(0).toUpperCase() + post.getType.slice(1).toLowerCase()} •
            </span>
            <span className={styles.checkCount}>{formatCheckCount(post.replies)}</span>
          </>
        )}
      </div>
    </div>
  );
} 