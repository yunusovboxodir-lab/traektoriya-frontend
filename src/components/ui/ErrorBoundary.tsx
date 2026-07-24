import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  return (
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Loading CSS chunk') ||
    error.name === 'ChunkLoadError'
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Could send to error tracking service in the future
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">{chunkError ? '🔄' : '💥'}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {chunkError ? 'Обновление приложения' : 'Что-то пошло не так'}
            </h2>
            <p className="text-gray-500 mb-2 text-sm">
              {chunkError
                ? 'Вышла новая версия приложения. Нажмите «Обновить» для загрузки.'
                : 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.'}
            </p>
            {this.state.error && !chunkError && (
              <p className="text-xs text-red-400 bg-red-50 rounded-lg p-2 mb-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={chunkError ? this.handleReload : this.handleReset}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                {chunkError ? 'Обновить' : 'Попробовать снова'}
              </button>
              <button
                onClick={() => window.location.assign('/dashboard')}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                {'На главную'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
