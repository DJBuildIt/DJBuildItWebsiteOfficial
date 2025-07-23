// Products Service - Stripe API Integration
// Single source of truth for product data from Stripe

import axios from 'axios';
import { Product, ProductImage } from '@/types/ecommerce';
import { formatPrice } from '@/lib/ecommerce-config';

// ============================================================================
// TYPES
// ============================================================================

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  metadata: Record<string, string>;
  stripeProductId: string;
  defaultPrice: {
    id: string;
    amount: number;
    currency: string;
    stripePriceId: string;
  } | null;
  allPrices: Array<{
    id: string;
    amount: number;
    currency: string;
    recurring: any;
    stripePriceId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ProductsApiResponse {
  success: boolean;
  products: StripeProduct[];
  cached: boolean;
  requestId: string;
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

// ============================================================================
// PRODUCTS SERVICE
// ============================================================================

export class ProductsService {
  private static readonly API_BASE = '/api/stripe';
  
  /**
   * Fetch all active products from Stripe
   */
  static async getProducts(): Promise<Product[]> {
    const requestId = `client_products_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔵 [${new Date().toISOString()}] PRODUCTS_SERVICE_START:`, { requestId });
    
    try {
      console.log(`🔵 [${new Date().toISOString()}] PRODUCTS_API_CALL:`, { 
        requestId,
        url: `${this.API_BASE}/products`
      });
      
      // Fetch from API
      const response = await axios.get<ProductsApiResponse>(`${this.API_BASE}/products`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ [${new Date().toISOString()}] PRODUCTS_API_RESPONSE:`, {
        requestId,
        success: response.data.success,
        productsCount: response.data.products?.length || 0,
        cached: response.data.cached,
        serverRequestId: response.data.requestId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch products');
      }
      
      // Transform Stripe products to our internal format
      const products = this.transformStripeProducts(response.data.products);
      
      console.log(`✅ [${new Date().toISOString()}] PRODUCTS_SERVICE_COMPLETE:`, {
        requestId,
        productsCount: products.length,
        cached: false // Caching is now handled by TanStack Query
      });
      
      return products;
      
    } catch (error: any) {
      console.error(`🔴 [${new Date().toISOString()}] PRODUCTS_SERVICE_ERROR:`, {
        requestId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }
  
  /**
   * Get a single product by ID
   */
  static async getProductById(productId: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === productId) || null;
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Transform Stripe products to our internal Product format
   */
  private static transformStripeProducts(stripeProducts: StripeProduct[]): Product[] {
    return stripeProducts.map(sp => {
      if (!sp.defaultPrice) {
        console.warn(`⚠️ Product ${sp.id} has no default price, skipping`);
        return null;
      }
      
      // Transform images
      const images: ProductImage[] = sp.images.map((url, index) => ({
        id: `${sp.id}_img_${index}`,
        url,
        alt: sp.name,
        isPrimary: index === 0,
        position: index + 1
      }));
      
      // Add fallback image if none provided
      if (images.length === 0) {
        images.push({
          id: `${sp.id}_img_fallback`,
          url: '/placeholder.svg',
          alt: sp.name,
          isPrimary: true,
          position: 1
        });
      }
      
      const product: Product = {
        id: sp.id,
        name: sp.name,
        description: sp.description || '',
        price: sp.defaultPrice.amount, // Use Stripe default price
        currency: sp.defaultPrice.currency.toUpperCase(),
        stripeProductId: sp.stripeProductId,
        stripePriceId: sp.defaultPrice.stripePriceId,
        printfulProductId: sp.metadata.printfulProductId ? parseInt(sp.metadata.printfulProductId) : undefined,
        printfulVariantId: sp.metadata.printfulVariantId ? parseInt(sp.metadata.printfulVariantId) : undefined,
        category: 'physical',
        images,
        variants: [], // TODO: Implement variants if needed
        features: this.extractFeaturesFromDescription(sp.description),
        rating: 4.8, // Default rating, could be stored in metadata
        isActive: true,
        metadata: sp.metadata,
        createdAt: sp.createdAt,
        updatedAt: sp.updatedAt
      };
      
      return product;
    }).filter(Boolean) as Product[];
  }
  
  /**
   * Extract features from product description
   */
  private static extractFeaturesFromDescription(description: string): string[] {
    // Default features for physical products
    const defaultFeatures = [
      'High-quality materials',
      'Fast shipping',
      'Satisfaction guaranteed'
    ];
    
    // Could implement more sophisticated feature extraction from description
    // For now, return defaults
    return defaultFeatures;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProductsService; 