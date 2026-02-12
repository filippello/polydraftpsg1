'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-game-bg text-foreground p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="font-pixel-heading text-xl mb-4">You&apos;re Offline</h1>
        <p className="font-pixel-body text-lg text-gray-400 mb-8">
          Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-game-accent text-white font-pixel-body text-lg rounded-lg hover:brightness-110 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
