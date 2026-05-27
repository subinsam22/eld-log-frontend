import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="loading loading-spinner loading-sm"></span>
      <span>Planning...</span>
    </div>
  );
}