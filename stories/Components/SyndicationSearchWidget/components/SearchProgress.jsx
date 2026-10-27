/**
 * @file SearchProgress.jsx
 * @description Decorative shared progress strip. The results region owns
 * aria-busy and SearchResults owns announcements; the strip adds no live region.
 */
import React from 'react';
import { ProgressBar } from '../../ProgressBar/ProgressBar';
import { useSearchLabels } from '../context/SearchContext';

export default function SearchProgress() {
  const labels = useSearchLabels();
  return (
    <div className="mg-search__progress" aria-hidden="true">
      <ProgressBar variant="flush" label={labels.srSearching} />
    </div>
  );
}
