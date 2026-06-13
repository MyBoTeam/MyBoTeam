'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '../utils/cn';
import { Button } from './button';

function useCarousel({
  totalItems,
  autoPlay = false,
  interval = 3000,
}: {
  totalItems: number;
  autoPlay?: boolean;
  interval?: number;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!autoPlay || totalItems <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, totalItems]);

  const goToSlide = React.useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  return {
    currentIndex,
    goToSlide,
    goToPrevious,
    goToNext,
    totalItems,
  };
}

function Carousel({
  className,
  autoPlay = false,
  interval = 3000,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  autoPlay?: boolean;
  interval?: number;
}) {
  const items = React.Children.toArray(children);
  const { currentIndex, goToSlide, goToPrevious, goToNext } = useCarousel({
    totalItems: items.length,
    autoPlay,
    interval,
  });
  const id = React.useId();
  const slideKeys = React.useMemo(
    () => Array.from({ length: items.length }, (_, i) => `${id}-${i}`),
    [id, items.length],
  );

  if (items.length === 0) return null;

  return (
    <div
      data-slot="carousel"
      className={cn('relative w-full overflow-hidden rounded-lg', className)}
      {...props}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div key={slideKeys[index]} className="min-w-full shrink-0">
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((_, index) => (
              <button
                key={`${id}-dot-${slideKeys[index]}`}
                type="button"
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'w-6 bg-primary'
                    : 'bg-muted-foreground/50 hover:bg-muted-foreground',
                )}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
Carousel.displayName = 'Carousel';

export { Carousel, useCarousel };
