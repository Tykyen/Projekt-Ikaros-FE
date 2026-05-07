import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest nemá `globals: true` → @testing-library/react automatický cleanup
// se nespouští. Bez tohoto by se mounty mezi testy hromadily v document.body
// (zvláště pro Modal používající createPortal).
afterEach(() => {
  cleanup();
});
