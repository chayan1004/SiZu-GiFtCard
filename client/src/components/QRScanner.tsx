import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, AlertCircle, Loader2 } from 'lucide-react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Result } from '@zxing/library';

interface QRScannerProps {
  onResult: (result: string) => void;
}

export default function QRScanner({ onResult }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerControls, setScannerControls] = useState<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    // Initialize the QR code reader
    codeReaderRef.current = new BrowserQRCodeReader();
    
    return () => {
      // Cleanup on unmount
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setHasScanned(false);
      
      if (!codeReaderRef.current) {
        throw new Error('QR Scanner not initialized');
      }

      // Check for camera permissions
      const devices = await codeReaderRef.current.listVideoInputDevices();
      if (devices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (or preferred back camera on mobile)
      const selectedDeviceId = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.deviceId || devices[0].deviceId;

      // Start continuous scanning
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result: Result | null, error?: Error) => {
          if (result && !hasScanned) {
            // Successfully scanned
            const text = result.getText();
            // QR Code scanned successfully
            setHasScanned(true);
            onResult(text);
            stopScanning();
          }
          
          if (error && error.name !== 'NotFoundException') {
            // Only log errors that aren't "QR code not found"
            console.error('QR scanning error:', error);
          }
        }
      );

      setScannerControls(controls);
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Unable to start scanner: ${errorMessage}`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerControls) {
      scannerControls.stop();
      setScannerControls(null);
    }
    setIsScanning(false);
    setHasScanned(false);
  };

  if (error) {
    return (
      <Card className="glassmorphism border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Camera Access Error</h3>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Button 
            onClick={startScanning}
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
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            
            {!isScanning && (
              <div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70">Camera preview will appear here</p>
                </div>
              </div>
            )}
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-white text-sm mb-4">
              {isScanning ? 'Point your camera at the QR code' : 'Click Start Scanning to begin'}
            </p>
            
            {/* Instructions */}
            <div className="bg-white/10 rounded-lg p-3 mb-4">
              <h4 className="text-white font-semibold mb-2">Scanning Tips:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Hold your device steady</li>
                <li>• Ensure good lighting</li>
                <li>• Keep QR code within the frame</li>
                <li>• Move closer or further if needed</li>
                <li>• Make sure QR code is not damaged</li>
              </ul>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={startScanning}
                disabled={isScanning}
                size="sm"
                className="gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>
              
              <Button 
                onClick={stopScanning}
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