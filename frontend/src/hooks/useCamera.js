import { useState, useRef, useEffect, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64 data URL
  const [capturedBlob, setCapturedBlob] = useState(null);   // Blob for FormData upload
  const [error, setError] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);

  // Stop all active camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsStreaming(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setError('Camera access is not supported by this browser. Please use Chrome, Edge, Safari, or Firefox.');
      return;
    }

    try {
      // First check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');

      if (videoDevices.length === 0) {
        setHasCamera(false);
        setError('No camera device detected on this system. Please connect a webcam.');
        return;
      }

      setHasCamera(true);

      // Prefer front-facing camera
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((err) => {
            console.warn('Video play error:', err);
          });
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraOpen(false);
      setIsStreaming(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings to take your attendance photo.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setHasCamera(false);
        setError('No camera found on this device. Please connect a camera.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is currently in use by another application. Please close other video apps and retry.');
      } else {
        setError(`Camera error: ${err.message || 'Unable to access camera.'}`);
      }
    }
  }, []);

  // Capture photo from video to canvas
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera video preview is not ready.');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // Use centered square crop to perfectly match the circular camera view
    const size = Math.min(vWidth, vHeight);
    const startX = (vWidth - size) / 2;
    const startY = (vHeight - size) / 2;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    // Mirror horizontally for natural front-facing view
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);

    // Convert dataUrl to Blob for upload
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      'image/jpeg',
      0.92
    );

    // Turn off active camera track after capturing to save battery/privacy
    stopCamera();

    return dataUrl;
  }, [stopCamera]);

  // Retake photo: clear previous capture and reopen camera
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  // Reset all
  const resetCamera = useCallback(() => {
    stopCamera();
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setError(null);
  }, [stopCamera]);

  // Ensure video element plays the stream whenever isCameraOpen becomes true
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((err) => {
            console.warn('Video play error:', err);
          });
          setIsStreaming(true);
        };
      }
    }
  }, [isCameraOpen]);

  // Clean up tracks when hook unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isCameraOpen,
    isStreaming,
    capturedPhoto,
    capturedBlob,
    error,
    hasCamera,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
    resetCamera
  };
}

