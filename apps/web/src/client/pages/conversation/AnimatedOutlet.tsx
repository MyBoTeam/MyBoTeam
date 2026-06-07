import { useState } from 'react';
import { useOutlet } from 'react-router';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const [frozenOutlet] = useState(outlet);
  return frozenOutlet;
}
