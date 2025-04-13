'use client';

import React, { useEffect, useState } from 'react';
import styles from './BigPictureArticle.module.css';

interface BigPictureData {
  overview: {
    article: string;
    generatedAt: number;
  };
}

function processQuotes(text: string): React.ReactNode[] {
  if (!text) return [];
  
  try {
    const segments = text.split(/("[^"]*")/g);
    return segments.map((segment, index) => {
      if (segment.startsWith('"') && segment.endsWith('"')) {
        return <span key={`quote-${index}`} className={styles.quote}>{segment}</span>;
      }
      return <span key={`text-${index}`}>{segment}</span>;
    });
  } catch (error) {
    console.error('Error processing quotes:', error);
    return [text];
  }
}

export default function BigPictureArticle() {
  const [article, setArticle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchArticle = async () => {
      try {
        const response = await fetch('/api/analysis/big-picture');
        if (!response.ok) {
          throw new Error('Failed to fetch article data');
        }
        const data: BigPictureData = await response.json();
        if (mounted) {
          setArticle(data.overview.article || '');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        if (mounted) {
          setError('Failed to load article');
          setIsLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!article) {
    return <div className={styles.error}>No content available</div>;
  }

  const paragraphs = article.split('\n\n').filter(Boolean);

  return (
    <div className={styles.container}>
      {paragraphs.map((paragraph, index) => (
        <p key={`p-${index}`} className={styles.paragraph}>
          {processQuotes(paragraph)}
        </p>
      ))}
    </div>
  );
} 