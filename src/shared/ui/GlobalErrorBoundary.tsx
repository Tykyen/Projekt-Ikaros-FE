import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState, FullPageState } from './StatePlaceholder';
import { captureError } from '@/shared/lib/monitoring';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, info.componentStack);
    // Monitoring (3. noha) — pošli do GlitchTip/Sentry (dřív chyba jen do konzole).
    captureError(error, 'react-boundary');
  }

  render() {
    if (this.state.hasError) {
      return (
        <FullPageState>
          <ErrorState
            size="hero"
            illustration="crash"
            title="Něco se rozbilo"
            description="V aplikaci nastala neočekávaná chyba. Zkus stránku obnovit — pokud potíže přetrvají, dej nám vědět."
            action={{ label: 'Obnovit stránku', onClick: () => window.location.reload() }}
          />
        </FullPageState>
      );
    }

    return this.props.children;
  }
}
