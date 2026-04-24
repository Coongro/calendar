import { getHostReact, getHostReactDOM, getHostUI } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';

const React = getHostReact();
const ReactDOM = getHostReactDOM();
const UI = getHostUI();

export interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Bottom sheet anclado al borde inferior del viewport. Reusa el Root de
 * Radix Dialog (via UI.Dialog) para focus trap, ESC y open state, pero el
 * panel y backdrop se renderizan en un Portal propio con inline styles
 * porque DialogContent del host fuerza un layout modal centrado.
 *
 * Referencia visual: design/event-overlap-exploration.html, seccion
 * "Bottom sheet — lista del cluster".
 */
export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
}: MobileBottomSheetProps) {
  const handleBackdropClick = () => onOpenChange(false);

  return React.createElement(
    UI.Dialog,
    { open, onOpenChange },
    open
      ? ReactDOM.createPortal(
          React.createElement(
            'div',
            {
              role: 'presentation',
              style: {
                position: 'fixed',
                inset: 0,
                zIndex: 500,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              },
            },
            // Backdrop
            React.createElement('div', {
              onClick: handleBackdropClick,
              style: {
                position: 'absolute',
                inset: 0,
                background: 'rgba(26, 25, 22, 0.35)',
              },
            }),
            // Panel
            React.createElement(
              'div',
              {
                role: 'dialog',
                'aria-modal': true,
                'aria-label': title,
                style: {
                  position: 'relative',
                  width: '100%',
                  maxHeight: '75vh',
                  background: TOKENS.surface,
                  borderTopLeftRadius: TOKENS.rXl,
                  borderTopRightRadius: TOKENS.rXl,
                  padding: '10px 0 16px',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
                },
                onClick: (e: React.MouseEvent) => e.stopPropagation(),
              },
              // Handle
              React.createElement('div', {
                style: {
                  width: '36px',
                  height: '4px',
                  background: TOKENS.borderMd,
                  borderRadius: '2px',
                  margin: '0 auto 12px',
                },
              }),
              // Header
              React.createElement(
                'div',
                {
                  style: {
                    padding: '0 18px 12px',
                    borderBottom: `1px solid ${TOKENS.border}`,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                  },
                },
                React.createElement(
                  'h3',
                  {
                    style: {
                      fontFamily: TOKENS.fontSerif,
                      fontWeight: 700,
                      fontSize: '16px',
                      color: TOKENS.ink,
                      margin: 0,
                    },
                  },
                  title
                ),
                subtitle
                  ? React.createElement(
                      'span',
                      {
                        style: { fontSize: '11px', color: TOKENS.ink3 },
                      },
                      subtitle
                    )
                  : null
              ),
              // Body
              React.createElement(
                'div',
                {
                  style: {
                    padding: '12px 18px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '8px',
                    overflowY: 'auto' as const,
                    minHeight: 0,
                  },
                },
                children
              )
            )
          ),
          document.body
        )
      : null
  );
}
