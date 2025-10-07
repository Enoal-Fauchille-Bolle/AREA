import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { appIcons } from '../lib/appIcons';

describe('App Icons Library', () => {
  it('exports an array of app icons', () => {
    expect(Array.isArray(appIcons)).toBe(true);
    expect(appIcons.length).toBeGreaterThan(0);
  });

  it('has at least 20 different app icons', () => {
    expect(appIcons.length).toBeGreaterThanOrEqual(20);
  });

  it('all icons are valid React elements', () => {
    appIcons.forEach((icon) => {
      expect(icon).toBeDefined();
      expect(typeof icon).toBe('object');
      expect(icon.type).toBe('svg');
    });
  });

  it('all icons have proper SVG structure', () => {
    appIcons.forEach((icon) => {
      const { container } = render(icon);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('viewBox');
      expect(svg).toHaveClass('w-8', 'h-8');
    });
  });

  it('icons have different colors/fills', () => {
    const colors = new Set();
    appIcons.forEach((icon) => {
      const { container } = render(icon);
      const svg = container.querySelector('svg');
      const fill = svg?.getAttribute('fill');
      if (fill) {
        colors.add(fill);
      }
    });
    expect(colors.size).toBeGreaterThan(5);
  });

  it('includes popular app icons', () => {
    const iconTexts = appIcons.map((icon) => {
      const { container } = render(icon);
      return container.innerHTML;
    });
    const allIconsHtml = iconTexts.join('');
    expect(allIconsHtml).toContain('#EA4335');
    expect(allIconsHtml).toContain('#5865F2');
    expect(allIconsHtml).toContain('#1DB954');
    expect(allIconsHtml).toContain('#1877F2');
    expect(allIconsHtml).toContain('#FF0000');
  });

  it('can be rendered in grid layout', () => {
    const { container } = render(
      <div className="grid grid-cols-8 gap-2">
        {appIcons.map((icon, index) => (
          <div
            key={index}
            className="w-16 h-16 bg-white rounded-lg flex items-center justify-center"
          >
            {icon}
          </div>
        ))}
      </div>,
    );
    const gridItems = container.querySelectorAll('.grid > div');
    expect(gridItems.length).toBe(appIcons.length);
  });
});
