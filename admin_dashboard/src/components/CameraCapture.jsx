import { Camera, RefreshCw, CheckCircle2, AlertCircle, VideoOff, Aperture, Loader2 } from 'lucide-react';

export default function CameraCapture({
  videoRef,
  canvasRef,
  isCameraOpen,
  isStreaming,
  capturedPhoto,
  error,
  hasCamera,
  startCamera,
  stopCamera,
  capturePhoto,
  retakePhoto
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-300 shadow-md p-5 sm:p-7 text-center animate-fade-in relative overflow-hidden">
      {/* Top Accent Strip */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-black" />

      {/* Header */}
      <div className="mb-5 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-black text-[10px] font-bold uppercase tracking-wider border border-zinc-300">
          <Camera className="w-3 h-3" />
          Face Photo Verification
        </div>
        <h3 className="text-sm sm:text-base font-black text-black tracking-tight">
          Position Your Face in the Circle
        </h3>
        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto font-normal">
          Look directly at the camera and click <strong>Capture Photo</strong>.
        </p>
      </div>

      {/* Camera Error Message */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-zinc-100 border border-black text-black text-xs flex items-start gap-2.5 max-w-md mx-auto text-left animate-shake">
          <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{error}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Ensure camera access is permitted in your browser settings.
            </p>
            <button
              onClick={startCamera}
              type="button"
              className="mt-2 text-[11px] bg-black hover:bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer border border-black"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Camera
            </button>
          </div>
        </div>
      )}

      {/* CIRCULAR Camera Viewfinder - Refined size */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full mx-auto overflow-hidden bg-black flex items-center justify-center border-3 border-black shadow-xl ring-6 ring-zinc-100 transition-all">
        {/* Hidden Canvas used for high-res centered frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element - fills the circle and scales with object-cover */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover -scale-x-100 ${
            isCameraOpen && !capturedPhoto ? 'block' : 'hidden'
          }`}
        />

        {/* 1. Captured Photo Preview (Rendered inside circle) */}
        {capturedPhoto && (
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto}
              alt="Captured student attendance photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
            <div className="absolute bottom-3.5 inset-x-0 flex justify-center">
              <span className="bg-black/90 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-1 font-bold border border-zinc-700 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Photo Captured
              </span>
            </div>
          </div>
        )}

        {/* 2. Live Video Circle Overlays & Reticle */}
        {isCameraOpen && !capturedPhoto && (
          <>
            {/* Circular dashed alignment ring */}
            <div className="absolute inset-4 rounded-full border border-dashed border-white/70 pointer-events-none animate-pulse" />

            {/* Corner Biometric HUD Crosshairs */}
            <div className="absolute inset-6 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between items-center opacity-60">
                <div className="w-3 h-3 border-t-2 border-l-2 border-white" />
                <div className="w-3 h-3 border-t-2 border-r-2 border-white" />
              </div>
              <div className="flex justify-between items-center opacity-60">
                <div className="w-3 h-3 border-b-2 border-l-2 border-white" />
                <div className="w-3 h-3 border-b-2 border-r-2 border-white" />
              </div>
            </div>

            {/* Live Badge at top of circle */}
            <div className="absolute top-3.5 inset-x-0 flex justify-center pointer-events-none">
              <span className="bg-black/85 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-zinc-700 shadow-xs uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live Camera
              </span>
            </div>

            {/* Circular guide text at bottom of circle */}
            <div className="absolute bottom-3.5 inset-x-0 flex justify-center pointer-events-none">
              <span className="bg-black/85 backdrop-blur-md text-white text-[10px] px-3 py-0.5 rounded-full border border-zinc-700 font-semibold shadow-xs">
                Center Face in Circle
              </span>
            </div>
          </>
        )}

        {/* 3. Starting Camera Loader / Device Detection */}
        {!isCameraOpen && !capturedPhoto && (
          <div className="text-center p-4 text-zinc-400">
            {!hasCamera ? (
              <div className="space-y-2">
                <VideoOff className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-xs font-bold text-white">No Camera Detected</p>
                <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                  Please connect a webcam to continue.
                </p>
              </div>
            ) : error ? (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white mx-auto flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-white">Camera Blocked</p>
              </div>
            ) : (
              <div className="space-y-2 py-6">
                <Loader2 className="w-8 h-8 mx-auto text-white animate-spin" />
                <p className="text-xs font-bold text-white tracking-wide">Opening camera directly...</p>
                <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                  Connecting to webcam lens
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Action Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {/* Shutter Button */}
        {isCameraOpen && !capturedPhoto && (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer border border-black shadow-md"
          >
            <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            Capture Photo
          </button>
        )}

        {/* Fallback button if camera had permission issue or was closed */}
        {!isCameraOpen && !capturedPhoto && (
          <button
            type="button"
            onClick={startCamera}
            disabled={!hasCamera}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-black shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            Retry Open Camera
          </button>
        )}

        {/* Retake Photo if on preview */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={retakePhoto}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-xs border border-black transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black" />
            Retake Photo
          </button>
        )}
      </div>
    </div>
  );
}
