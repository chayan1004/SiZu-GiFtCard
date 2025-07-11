import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Camera, X } from "lucide-react";

interface QRScannerProps {
  onResult: (result: string) => void;
}

export default function QRScanner({ onResult }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsScanning(true);
        
        // Start scanning for QR codes
        scanQRCode();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Try to decode QR code using a simple pattern detection
    // Note: In a real implementation, you would use a proper QR code library like @zxing/browser
    // For demo purposes, we'll simulate QR code detection
    
    // Simple mock QR code detection - in production, use a proper QR code library
    const mockQRDetection = () => {
      // This is a placeholder - in production, you'd use a library like @zxing/browser
      // For now, we'll show how the interface would work
      return null;
    };

    const qrResult = mockQRDetection();
    
    if (qrResult) {
      onResult(qrResult);
      stopCamera();
    } else {
      // Continue scanning
      setTimeout(scanQRCode, 100);
    }
  };

  if (error) {
    return (
      <Card className="glassmorphism border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Camera Access Error</h3>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Button 
            onClick={startCamera}
            className="gradient-primary text-white hover:opacity-90 transition-opacity"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-white/20">
      <CardContent className="p-6">
        <div className="relative">
          <div className="relative w-full max-w-md mx-auto">
            <video 
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              playsInline
              muted
            />
            <canvas 
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-white text-sm mb-4">
              {isScanning ? 'Point your camera at the QR code' : 'Preparing camera...'}
            </p>
            
            {/* Instructions */}
            <div className="bg-white/10 rounded-lg p-3 mb-4">
              <h4 className="text-white font-semibold mb-2">Scanning Tips:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Hold your device steady</li>
                <li>• Ensure good lighting</li>
                <li>• Keep QR code within the frame</li>
                <li>• Move closer or further if needed</li>
              </ul>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={startCamera}
                disabled={isScanning}
                size="sm"
                className="gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Start Camera'}
              </Button>
              
              <Button 
                onClick={stopCamera}
                disabled={!isScanning}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
