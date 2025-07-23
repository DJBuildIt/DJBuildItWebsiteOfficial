
import React from 'react';
import { X } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

interface Product {
  id: string;
  name: string;
  price: string;
  images: string[];
  description: string;
}

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

const ProductDetail = ({ product, onClose }: ProductDetailProps) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
      <div className={`${COLORS.glass.base} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-white text-2xl uppercase tracking-[0.05em] font-bold">
              {product.name}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-[#AABACF] text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="mb-6">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[#AABACF] text-3xl font-bold">
                {product.price}
              </span>
            </div>
            
            <p className="text-white/90 text-lg leading-relaxed">
              {product.description}
            </p>
            
            <button className="w-full bg-[#AABACF] text-black uppercase tracking-[0.05em] text-lg font-bold py-4 px-8 rounded-lg hover:bg-white transition-all duration-300">
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
