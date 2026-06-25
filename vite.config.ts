import { createGameViteConfig } from '@gamedevland/vite';

export default ({ mode }: { readonly mode: string }) => {
  const config = createGameViteConfig({
    mode,
    repoRoot: __dirname,
  });

  return {
    ...config,
    build: {
      ...config.build,
      chunkSizeWarningLimit: 1600,
    },
  };
};
