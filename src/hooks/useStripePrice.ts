import { useQuery } from '@tanstack/react-query';

interface StripePriceResponse {
  success: boolean;
  price?: {
    id: string;
    amount: number | null;
    currency: string | null;
    productId: string;
    productName: string | null;
  };
  error?: { message: string };
}

export const useStripePrice = (priceId: string | undefined) => {
  return useQuery({
    queryKey: ['stripePrice', priceId],
    enabled: !!priceId,
    queryFn: async (): Promise<StripePriceResponse['price']> => {
      const res = await fetch(`/api/stripe/price/${priceId}`);
      const json: StripePriceResponse = await res.json();
      if (!json.success || !json.price) throw new Error(json.error?.message || 'Failed to load price');
      return json.price;
    },
    staleTime: 5 * 60 * 1000,
  });
}; 