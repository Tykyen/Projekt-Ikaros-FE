import { Component, type ReactNode } from 'react';

/**
 * Malý ErrorBoundary pro lazy části Vypravěče (panel, taháky). Bez něj
 * rejected dynamic import (offline) propadne až do GlobalErrorBoundary
 * a NÁPOVĚDA shodí celou aplikaci (revize 07/23, nález 10).
 */
export class VypravecChyba extends Component<
  {
    /** Render chybového stavu; `zkusZnovu` resetuje boundary (retry). */
    naChybu: (zkusZnovu: () => void) => ReactNode;
    children: ReactNode;
  },
  { chyba: boolean }
> {
  state = { chyba: false };

  static getDerivedStateFromError(): { chyba: boolean } {
    return { chyba: true };
  }

  render(): ReactNode {
    if (!this.state.chyba) return this.props.children;
    return this.props.naChybu(() => this.setState({ chyba: false }));
  }
}
