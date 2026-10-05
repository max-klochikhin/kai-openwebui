// Kai fork: product-mode switches. All default to upstream behaviour (off).
// Enable at build time: VITE_KAI_SINGLE_ASSISTANT=true npm run build
export const KAI_SINGLE_ASSISTANT = import.meta.env.VITE_KAI_SINGLE_ASSISTANT === 'true';
