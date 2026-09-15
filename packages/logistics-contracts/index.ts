/** Paquete compartido: contratos canónicos del dominio logístico.
 *  Contratos estables para boundaries entre servicios, payloads de eventos,
 *  solicitudes de acción, simulaciones y auditorías.
 *
 *  A diferencia de las entidades de dominio internas, estos contratos son
 *  independientes y pueden coexistir con cambios en los modelos internos.
 *  Proporcionan: validación, versionado, contexto de tenant, línea de origen
 *  y metadatos de auditoría.
 */
export * from "./validation.js";
export * from "./types/index.js";