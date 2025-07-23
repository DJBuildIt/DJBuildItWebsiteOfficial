export const webhookHealth = {
  stripe: null as null | number,
  printful: null as null | number,
};

export const updateWebhookHealth = (provider: 'stripe' | 'printful') => {
  webhookHealth[provider] = Date.now();
}; 