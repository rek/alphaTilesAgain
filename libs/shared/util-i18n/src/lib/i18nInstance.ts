/**
 * Module-level i18next singleton. All lib files import from here — never
 * create a second i18next instance. Type:util per ADR-006 / design.md §D1.
 */
import i18n from 'i18next';

export { i18n };
