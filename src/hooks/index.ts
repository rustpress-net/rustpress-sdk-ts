/**
 * Subpath entry: `@rustpress/sdk/hooks`
 *
 * Re-exports the hook-authoring surface so consumers can write
 *   import { defineHook, Hook } from '@rustpress/sdk/hooks';
 * instead of pulling the whole root module.
 */

export {
  Hook,
  defineHook,
  parseTrigger,
  buildTrigger,
  isValidTrigger,
} from '../index.js';

export type {
  TriggerTiming,
  TriggerArgs,
  TriggerComponents,
  HookFunction,
  HookMetadata,
  HookDefinition,
  HookRegistry,
} from '../index.js';
