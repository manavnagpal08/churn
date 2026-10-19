import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (this.state.failed) return <main className="workspace-feedback" role="alert"><h1>This page could not load</h1><p>Reload the application to recover your workspace.</p><button className="primary-button" onClick={() => location.reload()}>Reload workspace</button></main>;
    return this.props.children;
  }
}
