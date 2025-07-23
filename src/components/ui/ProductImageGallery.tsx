import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full aspect-square ${COLORS.glass.base} rounded-lg flex items-center justify-center`}>
        <span className="text-white/60">No images available</span>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Main Image Container */}
      <div className="relative">
        <div className="relative w-full aspect-square bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden group">
          <img
            src={images[currentIndex]}
            alt={`${alt} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Navigation with Consistent Scrollbar Space */}
      <div className="h-16"> {/* Fixed height container */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 h-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-all duration-200 ${
                  index === currentIndex
                    ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <img
                  src={image}
                  alt={`${alt} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
