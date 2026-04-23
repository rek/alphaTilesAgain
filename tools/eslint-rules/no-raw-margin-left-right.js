/**
 * ESLint rule: no-raw-margin-left-right
 *
 * Bans physical-direction style keys in style objects. Every component must
 * use logical props (marginStart/marginEnd) for RTL safety — ARCHITECTURE.md §16.
 *
 * Banned keys (physical-direction — use the logical equivalents):
 *   marginLeft          → marginStart
 *   marginRight         → marginEnd
 *   paddingLeft         → paddingStart
 *   paddingRight        → paddingEnd
 *   left                → (use start)
 *   right               → (use end)
 *   borderLeftWidth     → borderStartWidth
 *   borderRightWidth    → borderEndWidth
 *   borderLeftColor     → borderStartColor
 *   borderRightColor    → borderEndColor
 *   borderTopLeftRadius     → borderTopStartRadius
 *   borderTopRightRadius    → borderTopEndRadius
 *   borderBottomLeftRadius  → borderBottomStartRadius
 *   borderBottomRightRadius → borderBottomEndRadius
 *
 * Allowlist: files under libs/shared/util-theme/** are exempt (the helpers
 * themselves may reference physical keys in comments/docs, and to stay
 * flexible for any low-level implementation need).
 *
 * Escape hatch: add an inline ESLint disable comment with a justification:
 *   // eslint-disable-next-line no-raw-margin-left-right -- reason
 *
 * See design.md §D6 and openspec/changes/theme-fonts/tasks.md §7.
 */

'use strict';

const BANNED_KEYS = new Set([
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'left',
  'right',
  'borderLeftWidth',
  'borderRightWidth',
  'borderLeftColor',
  'borderRightColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow physical-direction style keys; use logical props for RTL safety',
      url: 'https://reactnative.dev/docs/text-style-props#textalign',
    },
    messages: {
      bannedKey:
        '"{{key}}" is a physical-direction style key. ' +
        'Use logical prop (e.g. marginStart) — see libs/shared/util-theme/style',
    },
    schema: [],
  },

  create(context) {
    // Allow the util-theme lib itself to use any keys
    const filename = context.getFilename();
    if (filename.includes('libs/shared/util-theme')) {
      return {};
    }

    return {
      /**
       * Walk ObjectExpression properties. Flag any Property whose key name
       * appears in BANNED_KEYS.
       *
       * This catches all style objects — StyleSheet.create({…}), inline styles,
       * and plain object literals passed to style props.
       */
      Property(node) {
        const key = node.key;
        let keyName;

        if (key.type === 'Identifier') {
          keyName = key.name;
        } else if (key.type === 'Literal' && typeof key.value === 'string') {
          keyName = key.value;
        } else {
          return;
        }

        if (BANNED_KEYS.has(keyName)) {
          context.report({
            node,
            messageId: 'bannedKey',
            data: { key: keyName },
          });
        }
      },
    };
  },
};
