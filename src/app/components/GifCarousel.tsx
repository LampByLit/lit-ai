'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './GifCarousel.module.css';

export const GifCarousel = () => {
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const [gifs, setGifs] = useState<string[]>([]);

  useEffect(() => {
    // Fetch the list of GIFs when component mounts
    const fetchGifs = async () => {
      try {
        const response = await fetch('/api/gifs');
        const data = await response.json();
        setGifs(data.gifs);
      } catch (error) {
        console.error('Error fetching GIFs:', error);
      }
    };

    fetchGifs();
  }, []);

  useEffect(() => {
    if (gifs.length === 0) return;

    // Rotate through GIFs every 4 seconds
    const interval = setInterval(() => {
      setCurrentGifIndex((prevIndex) => 
        prevIndex === gifs.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [gifs]);

  if (gifs.length === 0) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <Image
          src={`/api/gifs?file=${encodeURIComponent(gifs[currentGifIndex])}`}
          alt="Rotating GIF"
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          style={{ objectFit: 'cover' }}
        />
      </div>
    </div>
  );
}; 