const MAX_ERROR_MESSAGE_LENGTH = 256;

/**
 * Truncate an error message to the analytics payload budget.
 * See openspec/changes/ota-updates/design.md D7.
 */
export function truncateMessage(msg: string): string {
  return msg.length > MAX_ERROR_MESSAGE_LENGTH
    ? msg.slice(0, MAX_ERROR_MESSAGE_LENGTH)
    : msg;
}
