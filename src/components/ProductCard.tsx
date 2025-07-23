import { useState } from "react";
import { COLORS, ANIMATIONS } from '@/lib/design-system';
import { ProductDisplay, SimpleProductCardProps } from '@/types/product';
const ProductCard = ({
  product,
  onClick
}: SimpleProductCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  };
  return <div className={`${COLORS.glass.base} ${COLORS.glass.hover} rounded-lg overflow-hidden hover:scale-105 ${ANIMATIONS.transition.all} cursor-pointer group w-3/4`} onClick={() => onClick(product)}>
      <div className="relative h-48 bg-gray-200">
        <img src={product.images[currentImageIndex]} alt={product.name} className="w-full h-full object-cover" />
        {product.images.length > 1 && <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              ←
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </button>
          </>}
      </div>
      <div className={`w-full ${COLORS.glass.base} ${COLORS.glass.hover} text-white uppercase tracking-[0.05em] text-base py-3 rounded-lg ${ANIMATIONS.transition.all} px-[14px]`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-white text-base uppercase tracking-[0.05em] font-normal">
            {product.name}
          </h3>
          <span className="text-white text-lg">
            {product.price}
          </span>
        </div>
      </div>
    </div>;
};
export default ProductCard;