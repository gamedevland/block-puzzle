import { SchemaDecoder } from '@gamedevland/engine/validation';

export class CommonSchemas {
  static readonly SOUNDS_CONFIG_FILE =
    'json/configs/common/app/sounds-volumes.json';
  static readonly PLAYER_PROGRESS_VERSION = 1;

  static readonly PLAYER_PROGRESS = SchemaDecoder.object({
    version: SchemaDecoder.number({
      defaultValue: CommonSchemas.PLAYER_PROGRESS_VERSION,
      integer: true,
      min: CommonSchemas.PLAYER_PROGRESS_VERSION,
      max: CommonSchemas.PLAYER_PROGRESS_VERSION,
    }),
    bestScore: SchemaDecoder.number({
      defaultValue: 0,
      integer: true,
      min: 0,
    }),
  });
}
