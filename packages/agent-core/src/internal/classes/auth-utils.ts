export function parseConnectorAuthPayload(
  text: string,
  marker: string,
): Record<string, unknown> | null {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const after = text.slice(start + marker.length).trim();
  const braceStart = after.indexOf('{');
  if (braceStart < 0) return null;
  try {
    let depth = 0;
    for (let i = braceStart; i < after.length; i++) {
      if (after[i] === '{') depth++;
      else if (after[i] === '}') {
        depth--;
        if (depth === 0) {
          return JSON.parse(after.slice(braceStart, i + 1));
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}
