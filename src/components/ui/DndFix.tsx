// This file is required for react-beautiful-dnd to work with strict mode in React 18+.
import { useEffect } from 'react';

export default function DndFix() {
  useEffect(() => {
    const original = window.getComputedStyle;
    window.getComputedStyle = (elt, pseudoElt) => {
      return original(elt, pseudoElt);
    };
    return () => {
      window.getComputedStyle = original;
    };
  }, []);
  return null;
}
