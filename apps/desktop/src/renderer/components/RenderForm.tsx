import type React from 'react';
import { useState } from 'react';

interface RenderFormProps {
  onRender: (request: { type: string; data: unknown; options?: unknown }) => Promise<unknown>;
}

export function RenderForm({ onRender }: RenderFormProps) {
  const [type, setType] = useState('pdf');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await onRender({
        type,
        data: { content },
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="render-form">
      <h2>Render Document</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="type">Render Type:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="text">Text</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter content to render..."
            rows={10}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Rendering...' : 'Render'}
        </button>
      </form>

      {result && (
        <div className="result">
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}

      {error && (
        <div className="error">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
