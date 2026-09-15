/**
 * TypeScript types for canonical logistics domain contracts.
 *
 * These types define the stable canonical contracts that can coexist with
 * internal domain entities. They are technology-agnostic interfaces for
 * service boundaries, event payloads, action requests, simulations, and audits.
 *
 * Key distinctions from internal domain entities:
 * - These are cross-service contracts, not internal models
 * - They have versioning for compatibility tracking
 * - They include tenant context for multi-tenant isolation
 * - They provide source lineage for traceability
 * - They include audit metadata for compliance
 *
 * Usage pattern at service boundaries:
 *   1. Internal domain entity → map TO canonical contract (export)
 *   2. Receive canonical contract → map TO internal domain entity (import)
 *   3. Canonical contracts remain stable even when internal models change
 */
import type {
  BaseContractSchema,
  EventContractSchema,
  ActionRequestSchema,
  SimulationRequestSchema,
  AuditLogSchema,
  ShippingManifestSchema,
  TrackingEventSchema,
  ContractValidationResult,
  ContractVersion,
} from "../validation.js";

import type {
  BaseContract,
  EventContract,
  ActionRequest,
  SimulationRequest,
  AuditLog,
  ShippingManifest,
  TrackingEvent,
} from "../validation.js";

/**
 * Root export type for the logistics-contracts package.
 * All canonical contract types are available through this.
 */
export type {
  BaseContract,
  EventContract,
  ActionRequest,
  SimulationRequest,
  AuditLog,
  ShippingManifest,
  TrackingEvent,
  ContractVersion,
  ContractValidationResult,
};

/**
 * Available contract schemas for validation.
 * Use these Zod schemas for runtime validation of contract payloads.
 */
export type {
  BaseContractSchema,
  EventContractSchema,
  ActionRequestSchema,
  SimulationRequestSchema,
  AuditLogSchema,
  ShippingManifestSchema,
  TrackingEventSchema,
};

/**
 * Contract metadata types shared across all canonical contracts.
 */
export type { BaseContractSchema as BaseMetadataSchema };