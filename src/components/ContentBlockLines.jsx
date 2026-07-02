import React from 'react';
import { lineStyle } from '../lib/contentBlocks';

export default function ContentBlockLines({ block, className = '', lineBreak = true }) {
  if (!block || !Array.isArray(block.lines)) return null;

  return (
    <>
      {block.lines.map((line, index) => (
        <React.Fragment key={`${line.text}-${index}`}>
          <span className={className} style={lineStyle(line, block)}>
            {line.text}
          </span>
          {lineBreak && index < block.lines.length - 1 && <br />}
          {!lineBreak && index < block.lines.length - 1 && ' '}
        </React.Fragment>
      ))}
    </>
  );
}
