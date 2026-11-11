import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, X, Zap, ZapOff, RefreshCw, Upload, AlertCircle, Camera as CameraIcon, Image as ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CameraQrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
}

// Extract relevant certificate ID / QR hash from scanned string or URL
export const extractIdentifier = (raw: string): string => {
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && last.length > 2) return decodeURIComponent(last);
    }
  } catch {
    // Not a valid URL, use raw string
  }
  return trimmed;
};

// Directly open native camera to snap photo and decode QR
export async function snapAndDecodeQr(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const check = await CapCamera.checkPermissions();
      if (check.camera !== 'granted') {
        await CapCamera.requestPermissions({ permissions: ['camera'] });
      }
    } catch {
      // Continue
    }
  }

  const photo = await CapCamera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
  });

  if (!photo.base64String) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) {
        resolve(extractIdentifier(code.data));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/jpeg;base64,${photo.base64String}`;
  });
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({ isOpen, onClose, onScan }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Play a soft confirmation beep on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  };

  // Extract relevant certificate ID / QR hash from scanned string or URL
  const extractIdentifier = (raw: string): string => {
    const trimmed = raw.trim();
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const segments = url.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last.length > 2) return decodeURIComponent(last);
      }
    } catch {
      // Not a valid URL, use raw string
    }
    return trimmed;
  };

  const handleDetectedCode = useCallback(
    (codeData: string) => {
      if (isProcessing) return;
      setIsProcessing(true);

      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
      playBeep();

      const extracted = extractIdentifier(codeData);
      onScan(extracted);
      onClose();
    },
    [isProcessing, onScan, onClose],
  );

  // Decode an image canvas/data with jsQR
  const decodeImageDataWithJsQR = useCallback(
    (img: HTMLImageElement): boolean => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return false;
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) {
        handleDetectedCode(code.data);
        return true;
      }
      return false;
    },
    [handleDetectedCode],
  );

  // Snap with Native Device Camera via Capacitor
  const snapWithNativeCamera = async () => {
    try {
      setIsCapturing(true);
      setCameraError(null);

      if (Capacitor.isNativePlatform()) {
        try {
          const check = await CapCamera.checkPermissions();
          if (check.camera !== 'granted') {
            await CapCamera.requestPermissions({ permissions: ['camera'] });
          }
        } catch {
          // Continue to getPhoto which prompts if needed
        }
      }

      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (!photo.base64String) {
        setIsCapturing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const found = decodeImageDataWithJsQR(img);
        if (!found) {
          alert(
            isRtl
              ? 'لم يتم التعرف على رمز QR في الصورة الملتقطة. تأكد من وضوح الرمز والإضاءة وحاول ثانية.'
              : 'Could not detect a QR code in the captured photo. Please ensure it is clear and well-lit.',
          );
        }
        setIsCapturing(false);
      };
      img.onerror = () => {
        setIsCapturing(false);
      };
      img.src = `data:image/jpeg;base64,${photo.base64String}`;
    } catch (err: any) {
      console.warn('[Camera] Snap error:', err);
      setIsCapturing(false);
      if (!err?.message?.includes('User cancelled')) {
        setCameraError(
          isRtl
            ? 'تعذر التقاط الصورة من الكاميرا. يمكنك اختيار صورة محفوظة من المعرض.'
            : 'Could not capture photo. You can select an image from gallery instead.',
        );
      }
    }
  };

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  // Continuous frame scanning loop
  const scanLoop = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Option 1: Native hardware BarcodeDetector if supported
    if ('BarcodeDetector' in window) {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      detector
        .detect(video)
        .then((barcodes: any[]) => {
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetectedCode(barcodes[0].rawValue);
          } else {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          }
        })
        .catch(() => {
          decodeWithJsQR();
        });
      return;
    }

    // Option 2: Fallback to jsQR
    decodeWithJsQR();

    function decodeWithJsQR() {
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleDetectedCode(code.data);
      } else {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }
  }, [handleDetectedCode]);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsProcessing(false);
    stopCamera();

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await CapCamera.requestPermissions({ permissions: ['camera'] });
        } catch (e) {
          console.warn('[Camera] requestPermissions warning:', e);
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode === 'environment' ? 'environment' : 'user' },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        setHasTorch(Boolean(capabilities.torch));
      }

      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.error('[CameraQrScanner] Camera init error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          isRtl
            ? 'تم رفض إذن الكاميرا. يمكنك استخدام زر "التقاط صورة للشهادة بالكاميرا" أو تفعيل الإذن من إعدادات الهاتف.'
            : 'Camera permission denied. Use the Snap Photo button or enable camera access in settings.',
        );
      } else if (err.name === 'NotFoundError' || err.message === 'CAMERA_NOT_SUPPORTED') {
        setCameraError(
          isRtl
            ? 'لم يتم العثور على كاميرا في هذا الجهاز.'
            : 'No camera hardware found on this device.',
        );
      } else {
        setCameraError(
          isRtl
            ? 'تعذر تشغيل ماسح الفيديو المباشر. يمكنك استخدام زر "التقاط صورة للشهادة بالكاميرا" بدلاً من ذلك.'
            : 'Live camera stream unavailable. You can snap a photo with your camera instead.',
        );
      }
    }
  }, [facingMode, isRtl, scanLoop, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: next }] });
        setTorchOn(next);
      } catch (err) {
        console.warn('Torch toggle failed', err);
      }
    }
  };

  // Flip camera between front and back
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Fallback: Scan QR from an uploaded photo/screenshot
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const found = decodeImageDataWithJsQR(img);
        if (!found) {
          alert(
            isRtl
              ? 'لم يتم العثور على رمز QR صالح في هذه الصورة.'
              : 'No valid QR code found in the selected image.',
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="camera-modal-container">
        {/* Top Controls Bar */}
        <div className="camera-modal-header">
          <div className="camera-header-title">
            <Camera size={20} />
            <span>{isRtl ? 'ماسح رمز QR الذكي' : 'QR Code Field Scanner'}</span>
          </div>

          <div className="camera-header-actions">
            {hasTorch && (
              <button
                type="button"
                className={`camera-tool-btn ${torchOn ? 'active' : ''}`}
                onClick={() => void toggleTorch()}
                title={isRtl ? 'تشغيل الفلاش' : 'Toggle Flashlight'}
              >
                {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
              </button>
            )}

            <button
              type="button"
              className="camera-tool-btn"
              onClick={flipCamera}
              title={isRtl ? 'تبديل الكاميرا' : 'Switch Camera'}
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              className="camera-tool-btn close-btn"
              onClick={onClose}
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Viewfinder Window */}
        <div className="camera-viewfinder-wrap">
          {cameraError ? (
            <div className="camera-error-card">
              <AlertCircle size={40} className="error-icon" />
              <h3>{isRtl ? 'تعذر فتح البث المباشر' : 'Live Stream Unavailable'}</h3>
              <p>{cameraError}</p>

              {/* Upload fallback button */}
              <label className="btn-upload-qr">
                <ImageIcon size={18} />
                <span>{isRtl ? 'اختيار صورة من المعرض' : 'Select from Gallery'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <button type="button" className="btn btn-outline" style={{ marginTop: 6 }} onClick={() => void startCamera()}>
                {isRtl ? 'إعادة محاولة البث المباشر' : 'Retry Live Stream'}
              </button>
            </div>
          ) : (
            <>
              <video ref={videoRef} playsInline autoPlay muted className="camera-video-feed" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Target Scan Box with Corners and Laser Line */}
              <div className="camera-target-box">
                <div className="corner-bracket top-left" />
                <div className="corner-bracket top-right" />
                <div className="corner-bracket bottom-left" />
                <div className="corner-bracket bottom-right" />
                <div className="laser-scan-line" />
              </div>

              <div className="camera-instructions-pill">
                <span>{isRtl ? 'وجّه الكاميرا نحو رمز QR على الوثيقة' : 'Align QR code inside box to verify'}</span>
              </div>
            </>
          )}
        </div>

        {/* Bottom Bar: Action Buttons */}
        <div className="camera-modal-footer">
          <label className="camera-footer-upload-btn">
            <Upload size={16} />
            <span>{isRtl ? 'اختيار صورة من المعرض' : 'From Gallery'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default CameraQrScanner;
