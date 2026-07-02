export const FONT_OPTIONS = [
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' }
];

export const DEFAULT_LINE_STYLE = {
  fontFamily: 'Montserrat',
  fontSize: '',
  color: '',
  fill: 'solid',
  bold: true,
  italic: false
};

export const DEFAULT_CONTENT_BLOCKS = {
  home_manifesto: {
    id: 'home_manifesto',
    page: 'Homepage',
    location: 'Below product grid / What We Believe section',
    label: 'What We Believe',
    background: '#FAF9F6',
    align: 'left',
    lines: [
      { text: 'Good clothes', color: '#111113', fill: 'solid', bold: true },
      { text: "don't need a", color: '#7E7E82', fill: 'solid', bold: false, italic: true },
      { text: 'corporate story.', color: '#111113', fill: 'solid', bold: true },
      { text: 'They need a', color: '#EF3E3E', fill: 'solid', bold: true },
      { text: 'conscience.', color: '#111113', fill: 'solid', bold: true }
    ]
  },
  mission_hero: {
    id: 'mission_hero',
    page: 'Our Mission',
    location: 'Top hero quote',
    label: '',
    background: '#111113',
    align: 'center',
    body: "We set out to create premium streetwear that serves a double purpose. We didn't want to write a corporate storytelling pamphlet. Instead, we committed to a straightforward action.",
    lines: [
      { text: 'Wear. Give.', color: '#FFFFFF', fill: 'solid', bold: true },
      { text: 'Repeat.', color: '#EF3E3E', fill: 'solid', bold: true }
    ]
  },
  mission_conscience: {
    id: 'mission_conscience',
    page: 'Our Mission',
    location: 'Our Conscience quote section',
    label: 'Our Conscience',
    background: '#FAF9F6',
    align: 'left',
    lines: [
      { text: 'Every order funds', color: '#111113', fill: 'solid', bold: true },
      { text: 'something that matters.', color: '#7E7E82', fill: 'solid', bold: false, italic: true },
      { text: 'No corporate spin.', color: '#111113', fill: 'solid', bold: true },
      { text: 'Just a real impact.', color: '#111113', fill: 'solid', bold: true }
    ]
  },
  mission_statement: {
    id: 'mission_statement',
    page: 'Our Mission',
    location: 'Bottom black CTA banner',
    label: '',
    background: '#111113',
    align: 'center',
    body: 'Minimal styles. Heavyweight fabrics. Direct social support.',
    buttonText: 'Shop Collections',
    buttonLink: '/',
    lines: [
      { text: 'Join The', color: '#FFFFFF', fill: 'solid', bold: true },
      { text: 'Movement.', color: '#FFFFFF', fill: 'outline', bold: true }
    ]
  },
  footer_luxury: {
    id: 'footer_luxury',
    page: 'All Pages',
    location: 'Before footer luxury/search widget',
    label: '',
    background: '#FAF9F6',
    align: 'left',
    lines: [
      { text: 'Feel the Luxury of Premium Streetwear with LOG - Best Unisex Clothing Brand in India', color: '#111113', fill: 'solid', bold: true }
    ]
  }
};

export function mergeContentBlocks(value = {}) {
  const merged = {};
  Object.entries(DEFAULT_CONTENT_BLOCKS).forEach(([key, fallback]) => {
    const current = value[key] || {};
    merged[key] = {
      ...fallback,
      ...current,
      lines: Array.isArray(current.lines) && current.lines.length
        ? current.lines.map((line, index) => ({
            ...DEFAULT_LINE_STYLE,
            ...(fallback.lines[index] || {}),
            ...line
          }))
        : fallback.lines.map((line) => ({ ...DEFAULT_LINE_STYLE, ...line }))
    };
  });
  return merged;
}

export function lineStyle(line = {}, block = {}) {
  const style = {
    fontFamily: `'${line.fontFamily || DEFAULT_LINE_STYLE.fontFamily}', sans-serif`,
    fontWeight: line.bold ? 900 : 400,
    fontStyle: line.italic ? 'italic' : 'normal',
    color: line.color || 'inherit'
  };
  if (line.fontSize) {
    style.fontSize = `${Number(line.fontSize)}px`;
  }
  if (line.fill === 'outline') {
    style.color = 'transparent';
    style.WebkitTextStroke = `1px ${line.color || block.textColor || '#111113'}`;
  }
  return style;
}
