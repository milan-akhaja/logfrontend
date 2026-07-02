import { useEffect, useState } from 'react';
import { DEFAULT_CONTENT_BLOCKS, mergeContentBlocks } from '../lib/contentBlocks';

export default function useContentBlocks() {
  const [blocks, setBlocks] = useState(() => mergeContentBlocks(DEFAULT_CONTENT_BLOCKS));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/content-blocks-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setBlocks(mergeContentBlocks(data));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return blocks;
}
