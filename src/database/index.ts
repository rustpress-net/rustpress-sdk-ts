/**
 * Subpath entry: `@rustpress/sdk/database`
 *
 * Re-exports the database/query types so plugin code can scope imports
 * to the persistence layer.
 */

export type {
  Database,
  Collection,
  QueryBuilder,
  QueryOperator,
  QueryFilter,
  AggregationStage,
  ExecuteResult,
  UpdateResult,
  DeleteResult,
  PaginatedResult,
  Transaction,
  Migration,
} from '../index.js';
