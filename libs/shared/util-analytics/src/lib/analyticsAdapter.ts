/**
 * AnalyticsAdapter — the interface that concrete analytics backends implement.
 *
 * V1 ships a no-op default. V2 plugs in a real provider via
 * `setAnalyticsAdapter(impl)`. See design.md D10, D11.
 *
 * Adapter authors:
 * - Call `transformPropsToSnake(props)` before transmitting to the wire to
 *   convert camelCase prop keys to snake_case (design.md D7).
 * - The `_sampled` prop on tile-tap events signals that the event survived 10%
 *   sampling; adapters may upweight by 10× if desired (design.md D5).
 */
export type AnalyticsAdapter = {
  track(event: string, props?: Record<string, unknown>): void;
  identify(playerId: string, traits?: Record<string, unknown>): void;
  screen(name: string, props?: Record<string, unknown>): void;
};
