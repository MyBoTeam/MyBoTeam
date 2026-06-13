'use client';

import * as React from 'react';
import type { Area, Point } from 'react-easy-crop';
import CropperLib from 'react-easy-crop';

import { cn } from '../utils/cn';
import { Slider } from './slider';

interface CropperProps {
  image: string;
  onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
  aspect?: number;
  glow?: boolean;
  className?: string;
}

function Cropper({ image, onCropComplete, aspect = 1, glow = false, className }: CropperProps) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [_croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);

  const handleCropComplete = React.useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
      onCropComplete?.(_croppedArea, croppedAreaPixels);
    },
    [onCropComplete],
  );

  return (
    <div
      data-slot="cropper"
      className={cn(
        'relative h-[400px] w-full overflow-hidden rounded-lg',
        glow && 'shadow-lg shadow-primary-700/20',
        className,
      )}
    >
      <CropperLib
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
      />
      <div className="absolute bottom-4 left-1/2 w-3/4 -translate-x-1/2">
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.1}
          onValueChange={(value: number[]) => setZoom(value[0])}
        />
      </div>
    </div>
  );
}

export { Cropper };
