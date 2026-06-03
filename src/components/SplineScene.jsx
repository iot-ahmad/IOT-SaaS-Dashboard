import { Suspense, lazy, Component } from 'react';
import { Loader2 } from 'lucide-react';

const Spline = lazy(() => import('@splinetool/react-spline'));

/* ── ErrorBoundary: isolates Spline crash so page never goes black ── */
class SplineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[SplineScene] 3D scene failed to load:', err.message);
  }
  render() {
    if (this.state.hasError) {
      /* Silently show nothing — page content is unaffected */
      return <div className="w-full h-full bg-black" />;
    }
    return this.props.children;
  }
}

/* ── SplineScene component (mirrors the original design) ─────────── */
export function SplineScene({ scene, className = '' }) {
  return (
    <SplineErrorBoundary>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-white/20 w-8 h-8" />
              <span
                className="text-[10px] font-mono tracking-widest text-white/15 uppercase"
                style={{ direction: 'ltr' }}
              >
                Loading 3D...
              </span>
            </div>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={`w-full h-full ${className}`}
        />
      </Suspense>
    </SplineErrorBoundary>
  );
}

export default SplineScene;
