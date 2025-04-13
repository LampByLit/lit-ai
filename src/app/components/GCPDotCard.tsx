'use client';

import React from 'react';
import styles from './GCPDotCard.module.css';

interface GCPDotCardProps {
  title: string;
}

export const GCPDotCard: React.FC<GCPDotCardProps> = ({ title }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.dotContainer}>
        {/* Placeholder for future content */}
      </div>
    </div>
  );
}; 