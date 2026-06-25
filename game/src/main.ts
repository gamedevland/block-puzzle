import { Engine } from '@gamedevland/engine';

import { BlockPuzzleGameConfig } from './config/game.config';

if (document.readyState === 'complete') {
  void Engine.run('#app', BlockPuzzleGameConfig.config);
} else {
  window.addEventListener('load', () => void Engine.run('#app', BlockPuzzleGameConfig.config), {
    once: true,
  });
}
