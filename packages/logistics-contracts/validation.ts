/**
 * Canonical logistics domain contracts for cross-service compatibility.
 *
 * These contracts define stable payload shapes that can coexist with internal
 * domain entities. They are technology-agnostic interfaces for service boundaries,
 * event payloads, action requests, simulations, and audits.
 *
 * Key design goals:
 * - Validation: Zod schemas for runtime validation
 * - Versioning: contractVersion field for forward/backward compatibility
 * - Tenant context: tenantId for multi-tenant isolation
 * - Source lineage: originService/originEvent for traceability
 * - Audit metadata: createdAt/updatedAt + user tracking
 *
 * IMPORTANT: These are CANONICAL contracts, NOT internal domain entities.
 * Internal entities should map TO these contracts at service boundaries, not
 * the other way around. This ensures cross-service stability even when internal
 * models change.
 */
import { z } from "zod";

/**
 * Base contract metadata shared across all canonical logistics contracts.
 * Provides versioning, tenant context, source lineage, and audit metadata.
 */
export const BaseContractSchema = z.object({
  /** Unique contract identifier */
  contractId: z.string().uuid(),
  /** Version of the contract schema (for compatibility tracking) */
  contractVersion: z.string().default("1.0.0"),
  /** Tenant identifier for multi-tenant isolation */
  tenantId: z.string().uuid(),
  /** Source service that originated this contract */
  originService: z.string(),
  /** Source event or origin identifier for traceability */
  originId: z.string().optional(),
  /** Creation timestamp */
  createdAt: z.date().default(() => new Date()),
  /** Last update timestamp */
  updatedAt: z.date().default(() => new Date()),
  /** User who created the contract */
  createdBy: z.string().optional(),
  /** User who last updated the contract */
  updatedBy: z.string().optional(),
});

/**
 * Type inferred from BaseContractSchema
 */
export type BaseContract = z.infer<typeof BaseContractSchema>;

/**
 * Validation result for a canonical contract.
 */
export const ContractValidationResult = z.object({
  /** Whether the contract is valid */
  valid: z.boolean(),
  /** Zod error issues if invalid */
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  /** Contract data if valid */
  data: z.unknown().optional(),
});

/**
 * Type for contract validation result
 */
export type ContractValidationResultType = z.infer<typeof ContractValidationResult>;

/**
 * Event contract base - for event payloads crossing service boundaries.
 * Distinguishes from internal domain events by being a stable canonical shape.
 */
export const EventContractSchema = BaseContractSchema.extend({
  /** Event type/category (e.g., "shipment.created", "delivery.completed") */
  eventType: z.string(),
  /** Event payload with domain-specific data */
  payload: z.unknown(),
  /** Event status at emission */
  status: z.enum(["pending", "published", "failed", "retry"]).default("pending"),
});

/**
 * Type inferred from EventContractSchema
 */
export type EventContract = z.infer<typeof EventContractSchema>;

/**
 * Action request contract - for user/initiator requests that trigger
 * downstream processes. Distinguishes from internal command objects by
 * having a stable, versioned shape for cross-service compatibility.
 */
export const ActionRequestSchema = BaseContractSchema.extend({
  /** Action type (e.g., "shipment.cancel", "route.optimize") */
  actionType: z.string(),
  /** Priority level for processing */
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  /** Timeout in milliseconds for the action to complete */
  timeoutMs: z.number().int().positive().optional(),
  /** Whether the action requires synchronous confirmation */
  requiresConfirmation: z.boolean().default(false),
});

/**
 * Type inferred from ActionRequestSchema
 */
export type ActionRequest = z.infer<typeof ActionRequestSchema>;

/**
 * Simulation request contract - for simulation/what-if scenarios.
 * Distinguishes from internal simulation objects by being a canonical
 * shape that can be serialized across service boundaries.
 */
export const SimulationRequestSchema = BaseContractSchema.extend({
  /** Simulation type (e.g., "route.optimization", "delivery.timing") */
  simulationType: z.string(),
  /** Parameters specific to the simulation type */
  parameters: z.unknown(),
  /** Desired outcome metrics to optimize */
  objectives: z.array(z.string()).optional(),
  /** Maximum steps or iterations for the simulation */
  maxSteps: z.number().int().positive().optional(),
});

/**
 * Type inferred from SimulationRequestSchema
 */
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

/**
 * Audit log contract - for audit trail entries crossing service boundaries.
 * Distinguishes from internal audit records by being a stable canonical shape.
 */
export const AuditLogSchema = BaseContractSchema.extend({
  /** Type of action being audited (e.g., "shipment.created", "action.executed") */
  actionType: z.string(),
  /** Resource affected by the action */
  resourceId: z.string().uuid(),
  /** Outcome of the action (e.g., "success", "failed", "cancelled") */
  outcome: z.enum(["success", "failed", "cancelled", "timeout"]),
  /** Detailed audit note */
  note: z.string().optional(),
  /** Before/after state (partial) */
  beforeState: z.unknown().optional(),
  /** After state (partial) */
  afterState: z.unknown().optional(),
});

/**
 * Type inferred from AuditLogSchema
 */
export type AuditLog = z.infer<typeof AuditLogSchema>;

/**
 * Shipping manifest contract - for cross-service shipment coordination.
 * Canonical shape that internal shipment entities map to at boundaries.
 */
export const ShippingManifestSchema = BaseContractSchema.extend({
  /** Shipment identifier */
  shipmentId: z.string().uuid(),
  /** Current status of the shipment */
  status: z.enum([
    "pending",
    "confirmed",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "exception",
    "cancelled",
  ]),
  /** Shipment type */
  shipmentType: z.string(),
  /** Origin location (optional) */
  origin: z.object({
    address: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }).optional(),
  /** Destination location (optional) */
  destination: z.object({
    address: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }).optional(),
  /** Carrier information (optional) */
  carrier: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
  }).optional(),
  /** Expected delivery window */
  expectedDelivery: z.date().optional(),
  /** Actual delivery date (optional) */
  actualDelivery: z.date().optional(),
});

/**
 * Type inferred from ShippingManifestSchema
 */
export type ShippingManifest = z.infer<typeof ShippingManifestSchema>;

/**
 * Tracking event contract - for tracking updates crossing service boundaries.
 */
export const TrackingEventSchema = BaseContractSchema.extend({
  /** Tracking event type */
  eventType: z.enum([
    "location.update",
    "status.change",
    "delivery.attempt",
    "exception",
    "out_for_delivery",
    "delivered",
  ]),
  /** Current location (optional) */
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  /** Shipment ID this event relates to */
  shipmentId: z.string().uuid(),
});

/**
 * Type inferred from TrackingEventSchema
 */
export type TrackingEvent = z.infer<typeof TrackingEventSchema>;

/**
 * Contracts namespace export for tree-shaking.
 * Contains only Zod schemas (values), not inferred types.
 */
export const logisticsContracts = {
  BaseContractSchema,
  EventContractSchema,
  ActionRequestSchema,
  SimulationRequestSchema,
  AuditLogSchema,
  ShippingManifestSchema,
  TrackingEventSchema,
  ContractValidationResult,
};

/**
 * Pre-defined contract versions for compatibility tracking.
 */
export const ContractVersions = {
  V1_0_0: "1.0.0",
  V1_1_0: "1.1.0",
  V2_0_0: "2.0.0",
} as const;

export type ContractVersion = typeof ContractVersions[keyof typeof ContractVersions];

/**
 * Validates that a contract version is supported.
 * Returns the normalized version string.
 */
export function validateContractVersion(version: string): ContractVersion {
  const supported: Record<string, ContractVersion> = {
    "1.0.0": "1.0.0",
    "1.1.0": "1.1.0",
    "2.0.0": "2.0.0",
  };
  return supported[version] || "1.0.0";
}