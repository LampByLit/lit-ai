'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import styles from './StagePost.module.css';

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
  const [data, setData] = useState<Get | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (cardType === 'meds') {
          const response = await fetch('/api/meds');
          const json = await response.json();

          if (!response.ok) {
            throw new Error(json.error || 'Failed to fetch meds data');
          }
          
          if (!Array.isArray(json)) {
            throw new Error('Invalid meds data structure');
          }

          // Select post based on position
          const postIndex = position === 'top' ? 0 : position === 'middle' ? 1 : 2;
          const selectedPost = json[postIndex];

          if (!selectedPost || !selectedPost.no) {
            throw new Error(`No post data for position ${position}`);
          }

          if (isMounted) {
            setData({
              postNumber: selectedPost.no.toString(),
              comment: selectedPost.com || '',
              checkCount: 0,
              getType: 'Meds Post',
              hasImage: selectedPost.tim !== undefined || selectedPost.filename !== undefined,
              filename: selectedPost.filename,
              ext: selectedPost.ext,
              tim: selectedPost.tim,
              sub: selectedPost.sub,
              resto: selectedPost.resto,
              threadId: selectedPost.threadId
            });
          }
          return;
        }

        if (cardType === 'insights') {
          const response = await fetch('/api/reply');
          const json = await response.json();

          if (!response.ok) {
            throw new Error(json.error || 'Failed to fetch reply data');
          }
          
          if (!Array.isArray(json)) {
            throw new Error('Invalid reply data structure');
          }

          // Select post based on position
          const postIndex = position === 'top' ? 0 : position === 'middle' ? 1 : 2;
          const selectedPost = json[postIndex];

          if (!selectedPost || !selectedPost.no) {
            throw new Error(`No post data for position ${position}`);
          }

          if (isMounted) {
            setData({
              postNumber: selectedPost.no.toString(),
              comment: selectedPost.com || '',
              checkCount: selectedPost.replies || 0,
              getType: 'Most Replied',
              hasImage: selectedPost.tim !== undefined || selectedPost.filename !== undefined,
              filename: selectedPost.filename,
              ext: selectedPost.ext,
              tim: selectedPost.tim,
              sub: selectedPost.sub,
              resto: selectedPost.resto,
              threadId: selectedPost.threadId
            });
          }
          return;
        }

        // For GETs card, fetch GET data
        const response = await fetch('/api/significant-gets');
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'Failed to fetch GET data');
        }

        const result = position === 'top' ? json.getOne : json.getTwo;
        if (!result) {
          throw new Error(`No ${position} GET data available`);
        }

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching data');
          console.error('Error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 600000); // Refresh every 10 minutes

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [position, cardType]);

  if (loading) {
    return (
      <div className={styles.stagePost}>
        <div className={styles.header}>
          <span className={styles.name}>Loading...</span>
        </div>
        <div className={styles.comment}>
          <span className={styles.placeholderComment}>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stagePost}>
        <div className={styles.header}>
          <span className={styles.name}>Error</span>
        </div>
        <div className={styles.comment}>
          <span className={styles.placeholderComment}>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.stagePost}>
        <div className={styles.header}>
          <span className={styles.name}>No Data</span>
        </div>
        <div className={styles.comment}>
          <span className={styles.placeholderComment}>No data available</span>
        </div>
      </div>
    );
  }

  const parsedComment = data.comment ? parseComment(data.comment) : '';

  return (
    <div className={styles.stagePost}>
      <div className={styles.header}>
        <span className={styles.name}>Anonymous</span>
        <a 
          href={`https://archive.4plebs.org/x/post/${data.postNumber}/`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.postNumber}
        >
          No.{data.postNumber}
        </a>
      </div>
      <div className={styles.comment}>
        {data.hasImage && (
          <span className={styles.greentext}>&gt;pic related</span>
        )}
        {parsedComment || <span className={styles.placeholderComment}>&gt;pic related</span>}
      </div>
      <div className={styles.footer}>
        {cardType === 'insights' ? (
          <span className={styles.checkCount}>
            {data.checkCount} {data.checkCount === 1 ? 'Reply' : 'Replies'}
          </span>
        ) : (
          <>
            <span className={styles.getType}>
              {data.getType.charAt(0).toUpperCase() + data.getType.slice(1).toLowerCase()} •
            </span>
            <span className={styles.checkCount}>{formatCheckCount(data.checkCount)}</span>
          </>
        )}
      </div>
    </div>
  );
} 