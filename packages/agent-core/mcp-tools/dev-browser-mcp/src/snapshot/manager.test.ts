import { beforeEach, describe, expect, it } from 'vitest';
import { SnapshotManager } from './manager.js';

describe('SnapshotManager', () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    manager = new SnapshotManager();
  });

  const simpleSnapshot = `- button "Submit" [ref=e1]`;

  it('returns full snapshot on first call', () => {
    const result = manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test Page');

    expect(result.type).toBe('full');
    expect(result.content).toBe(simpleSnapshot);
  });

  it('returns diff on second call with same page', () => {
    manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test');

    const result = manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test');

    expect(result.type).toBe('diff');
  });

  it('returns full snapshot when URL changes', () => {
    manager.processSnapshot(simpleSnapshot, 'https://example.com/page1', 'Page 1');

    const result = manager.processSnapshot(simpleSnapshot, 'https://example.com/page2', 'Page 2');

    expect(result.type).toBe('full');
  });

  it('returns full snapshot when full_snapshot option is true', () => {
    manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test');

    const result = manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test', {
      fullSnapshot: true,
    });

    expect(result.type).toBe('full');
  });

  it('normalizes URLs for same-page detection', () => {
    manager.processSnapshot(simpleSnapshot, 'https://example.com/page#section1', 'Test');

    const result = manager.processSnapshot(
      simpleSnapshot,
      'https://example.com/page#section2',
      'Test',
    );

    expect(result.type).toBe('diff');
  });

  it('resets state correctly', () => {
    manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test');

    manager.reset();

    const result = manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Test');

    expect(result.type).toBe('full');
  });

  describe('session history', () => {
    it('should track navigation history', () => {
      manager.processSnapshot(simpleSnapshot, 'https://example.com/page1', 'Page 1');
      manager.processSnapshot(simpleSnapshot, 'https://example.com/page2', 'Page 2');
      manager.processSnapshot(simpleSnapshot, 'https://example.com/page3', 'Page 3');

      const summary = manager.getSessionSummary();
      expect(summary.history).toContain('Page 1');
      expect(summary.history).toContain('Page 2');
      expect(summary.history).toContain('Page 3');
      expect(summary.pagesVisited).toBe(3);
    });

    it('should limit history to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        manager.processSnapshot(simpleSnapshot, `https://example.com/page${i}`, `Page ${i}`);
      }

      const summary = manager.getSessionSummary();
      expect(summary.pagesVisited).toBe(10);
      expect(summary.history).not.toContain('Page 0');
      expect(summary.history).toContain('Page 14');
    });

    it('should reset history on manager reset', () => {
      manager.processSnapshot(simpleSnapshot, 'https://example.com', 'Home');
      manager.reset();

      const summary = manager.getSessionSummary();
      expect(summary.pagesVisited).toBe(0);
    });
  });

  describe('full optimization pipeline', () => {
    it('should produce optimized output with all tiers', () => {
      const yaml1 = `- button "Home" [ref=e1]
- link "About" [ref=e2]
- navigation "Main Nav" [ref=e3]`;

      const yaml2 = `- button "Search" [ref=e4]
- textbox "Query" [ref=e5]
- link "Results" [ref=e6]`;

      const result1 = manager.processSnapshot(yaml1, 'https://example.com/home', 'Home', {});

      expect(result1.type).toBe('full');
      expect(result1.content).toBe(yaml1);

      const result2 = manager.processSnapshot(yaml2, 'https://example.com/search', 'Search', {});

      expect(result2.type).toBe('full');
      expect(result2.content).toBe(yaml2);

      const summary = manager.getSessionSummary();
      expect(summary.pagesVisited).toBe(2);
      expect(summary.history).toContain('Home');
      expect(summary.history).toContain('Search');
    });

    it('should use diff for same-page updates', () => {
      const initialYaml = `- button "Submit" [ref=e1]
- textbox "Name" [ref=e2]`;

      const updatedYaml = `- button "Submit" [ref=e1]
- textbox "Name" [ref=e2]
- text "Success!" [ref=e3]`;

      const result1 = manager.processSnapshot(
        initialYaml,
        'https://example.com/form',
        'Form Page',
        {},
      );
      expect(result1.type).toBe('full');

      const result2 = manager.processSnapshot(
        updatedYaml,
        'https://example.com/form',
        'Form Page',
        {},
      );
      expect(result2.type).toBe('diff');

      const summary = manager.getSessionSummary();
      expect(summary.pagesVisited).toBe(2);
      expect(summary.history).toContain('Form Page');
    });

    it('should combine navigation tracking with diff optimization', () => {
      const homeYaml = `- link "Search" [ref=e1]
- navigation "Main" [ref=e2]`;

      const searchYaml = `- textbox "Query" [ref=e3]
- button "Search" [ref=e4]`;

      const searchWithResultsYaml = `- textbox "Query" [ref=e3]
- button "Search" [ref=e4]
- link "Result 1" [ref=e5]
- link "Result 2" [ref=e6]`;

      manager.processSnapshot(homeYaml, 'https://example.com/', 'Home', {});

      manager.processSnapshot(searchYaml, 'https://example.com/search', 'Search', {});

      const resultUpdate = manager.processSnapshot(
        searchWithResultsYaml,
        'https://example.com/search',
        'Search',
        {},
      );
      expect(resultUpdate.type).toBe('diff');

      const summary = manager.getSessionSummary();
      expect(summary.pagesVisited).toBe(3);
      expect(summary.history).toContain('Home');
      expect(summary.history).toContain('Search');
    });
  });
});
