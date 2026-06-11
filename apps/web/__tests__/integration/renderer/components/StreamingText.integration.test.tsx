import { StreamingText, useStreamingState } from '@myboteam/ui';
import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('StreamingText Integration', () => {
  describe('basic rendering', () => {
    it('should render with container div', () => {
      render(
        <StreamingText text="Hello World" isComplete={true}>
          {(text) => <span>{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render full text when isComplete is true', () => {
      render(
        <StreamingText text="Complete text" isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Complete text');
    });

    it('should render empty initially when not complete', () => {
      render(
        <StreamingText text="Streaming text" isComplete={false}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('');
    });

    it('should apply custom className', () => {
      render(
        <StreamingText text="Test" isComplete={true} className="custom-class">
          {(text) => <span>{text}</span>}
        </StreamingText>,
      );

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('text streaming animation', () => {
    it('should start with zero characters when streaming', () => {
      render(
        <StreamingText text="Hello" isComplete={false}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('');
    });
  });

  describe('completion state', () => {
    it('should show full text immediately when isComplete is true', () => {
      render(
        <StreamingText text="Immediate complete" isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Immediate complete');
    });

    it('should stop streaming when isComplete changes to true', () => {
      const { rerender } = render(
        <StreamingText text="Partial text" isComplete={false}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      rerender(
        <StreamingText text="Partial text" isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Partial text');
    });

    it('should not call onComplete when isComplete is initially true', () => {
      const onComplete = vi.fn();

      render(
        <StreamingText text="Already done" isComplete={true} onComplete={onComplete}>
          {(text) => <span>{text}</span>}
        </StreamingText>,
      );

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('cursor indicator', () => {
    it('should show cursor while streaming', () => {
      render(
        <StreamingText text="Streaming" isComplete={false}>
          {(text) => <span>{text}</span>}
        </StreamingText>,
      );

      const cursor = document.querySelector('.animate-pulse');
      expect(cursor).toBeInTheDocument();
    });

    it('should hide cursor when streaming is complete', () => {
      render(
        <StreamingText text="Done" isComplete={true}>
          {(text) => <span>{text}</span>}
        </StreamingText>,
      );

      const cursor = document.querySelector('.animate-pulse');
      expect(cursor).not.toBeInTheDocument();
    });
  });

  describe('different content types', () => {
    it('should handle plain text content', () => {
      render(
        <StreamingText text="Plain text content" isComplete={true}>
          {(text) => <p>{text}</p>}
        </StreamingText>,
      );

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should handle markdown-style text', () => {
      render(
        <StreamingText text="**Bold** and *italic* text" isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('**Bold** and *italic* text');
    });

    it('should handle code content', () => {
      render(
        <StreamingText text="const x = 42;" isComplete={true}>
          {(text) => <code data-testid="content">{text}</code>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('const x = 42;');
    });

    it('should handle multiline content', () => {
      const multilineText = `Line 1
Line 2
Line 3`;

      render(
        <StreamingText text={multilineText} isComplete={true}>
          {(text) => <pre data-testid="content">{text}</pre>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Line 1');
      expect(screen.getByTestId('content')).toHaveTextContent('Line 2');
      expect(screen.getByTestId('content')).toHaveTextContent('Line 3');
    });

    it('should handle empty text', () => {
      render(
        <StreamingText text="" isComplete={true}>
          {(text) => <span data-testid="content">{text || 'empty'}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('empty');
    });

    it('should handle special characters', () => {
      render(
        <StreamingText text="Special chars: @#$%^&*()" isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Special chars: @#$%^&*()');
    });

    it('should handle unicode characters', () => {
      render(
        <StreamingText text="Unicode: Hello World" isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Unicode: Hello World');
    });

    it('should handle long text content', () => {
      const longText = 'A'.repeat(1000);

      render(
        <StreamingText text={longText} isComplete={true}>
          {(text) => <span data-testid="content">{text}</span>}
        </StreamingText>,
      );

      expect(screen.getByTestId('content').textContent?.length).toBe(1000);
    });
  });

  describe('render prop flexibility', () => {
    it('should pass displayed text to children render prop', () => {
      const renderSpy = vi.fn((text: string) => <span>{text}</span>);

      // Act
      render(
        <StreamingText text="Test" isComplete={true}>
          {renderSpy}
        </StreamingText>,
      );

      expect(renderSpy).toHaveBeenCalledWith('Test');
    });

    it('should allow custom rendering of text', () => {
      render(
        <StreamingText text="Custom" isComplete={true}>
          {(text) => (
            <div data-testid="custom-render">
              <strong>{text.toUpperCase()}</strong>
            </div>
          )}
        </StreamingText>,
      );

      // Assert
      expect(screen.getByTestId('custom-render')).toHaveTextContent('CUSTOM');
    });

    it('should allow wrapping text in complex markup', () => {
      // Arrange & Act
      render(
        <StreamingText text="Wrapped" isComplete={true}>
          {(text) => (
            <article>
              <header>Header</header>
              <p data-testid="body">{text}</p>
              <footer>Footer</footer>
            </article>
          )}
        </StreamingText>,
      );

      expect(screen.getByTestId('body')).toHaveTextContent('Wrapped');
    });
  });
});

describe('useStreamingState Hook', () => {
  describe('initial state', () => {
    it('should return shouldStream as true for latest running assistant message', () => {
      const { result } = renderHook(() => useStreamingState('msg-1', true, true));

      expect(result.current.shouldStream).toBe(true);
    });

    it('should return shouldStream as false when not latest assistant message', () => {
      const { result } = renderHook(() => useStreamingState('msg-1', false, true));

      expect(result.current.shouldStream).toBe(false);
    });

    it('should return shouldStream as false when task not running', () => {
      const { result } = renderHook(() => useStreamingState('msg-1', true, false));

      expect(result.current.shouldStream).toBe(false);
    });

    it('should return isComplete as opposite of shouldStream', () => {
      const { result } = renderHook(() => useStreamingState('msg-1', true, true));

      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('streaming completion', () => {
    it('should provide onComplete callback', () => {
      const { result } = renderHook(() => useStreamingState('msg-1', true, true));

      expect(typeof result.current.onComplete).toBe('function');
    });

    it('should mark as complete after onComplete is called', () => {
      const { result, rerender } = renderHook(() => useStreamingState('msg-1', true, true));

      act(() => {
        result.current.onComplete();
      });

      rerender();

      expect(result.current.shouldStream).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('message ID changes', () => {
    it('should reset streaming state when message ID changes', () => {
      const { result, rerender } = renderHook(
        ({ messageId }) => useStreamingState(messageId, true, true),
        { initialProps: { messageId: 'msg-1' } },
      );

      act(() => {
        result.current.onComplete();
      });

      rerender({ messageId: 'msg-2' });

      expect(result.current.shouldStream).toBe(true);
    });
  });

  describe('task running state changes', () => {
    it('should stop streaming when task stops running', () => {
      const { result, rerender } = renderHook(
        ({ isRunning }) => useStreamingState('msg-1', true, isRunning),
        { initialProps: { isRunning: true } },
      );

      expect(result.current.shouldStream).toBe(true);

      rerender({ isRunning: false });

      expect(result.current.shouldStream).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('latest message changes', () => {
    it('should stop streaming when no longer latest message', () => {
      const { result, rerender } = renderHook(
        ({ isLatest }) => useStreamingState('msg-1', isLatest, true),
        { initialProps: { isLatest: true } },
      );

      expect(result.current.shouldStream).toBe(true);

      rerender({ isLatest: false });

      expect(result.current.shouldStream).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle all flags being false', () => {
      const { result } = renderHook(() => useStreamingState('msg-1', false, false));

      expect(result.current.shouldStream).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    it('should handle rapid state changes', () => {
      const { result, rerender } = renderHook(
        ({ isLatest, isRunning }) => useStreamingState('msg-1', isLatest, isRunning),
        { initialProps: { isLatest: true, isRunning: true } },
      );

      for (let i = 0; i < 10; i++) {
        rerender({ isLatest: i % 2 === 0, isRunning: i % 3 === 0 });
      }

      expect(typeof result.current.shouldStream).toBe('boolean');
      expect(typeof result.current.isComplete).toBe('boolean');
    });

    it('should handle empty message ID', () => {
      const { result } = renderHook(() => useStreamingState('', true, true));

      expect(result.current.shouldStream).toBe(true);
    });
  });
});
