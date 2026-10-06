import { Dialog } from '@coongro/ui-components';
import { useEffect } from 'react';
import type { ReactElement, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { TOKENS } from '../../styles/tokens.js';

export interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Bottom sheet anclado al borde inferior del viewport. Pensado solo para
 * mobile (consumer hace gating con useIsMobile). UI.Dialog (Root de Radix)
 * solo nos sirve para tener un wrapper con `open`/`onOpenChange`; ESC y
 * focus trap NO se cablean porque el panel se renderiza en un Portal
 * propio fuera de Dialog.Content (DialogContent del host fuerza layout
 * modal centrado y no podemos overridearlo). En mobile no hay teclado
 * fisico, asi que ESC no aplica.
 *
 * Mientras `open`, bloqueamos el scroll del body para evitar que el
 * contenido detras del backdrop scrollee.
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
}: MobileBottomSheetProps): ReactElement | null {
  const handleBackdropClick = () => onOpenChange(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open
        ? createPortal(
            <div
              role="presentation"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 500,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              {/* Backdrop */}
              <div
                onClick={handleBackdropClick}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--cg-bg-overlay)',
                }}
              />
              {/* Panel */}
              <div
                role="dialog"
                aria-modal={true}
                aria-label={title}
                style={{
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
                }}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                {/* Handle */}
                <div
                  style={{
                    width: '36px',
                    height: '4px',
                    background: TOKENS.borderMd,
                    borderRadius: '2px',
                    margin: '0 auto 12px',
                  }}
                />
                {/* Header */}
                <div
                  style={{
                    padding: '0 18px 12px',
                    borderBottom: `1px solid ${TOKENS.border}`,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: TOKENS.fontSerif,
                      fontWeight: 700,
                      fontSize: '16px',
                      color: TOKENS.ink,
                      margin: 0,
                    }}
                  >
                    {title}
                  </h3>
                  {subtitle ? (
                    <span style={{ fontSize: '11px', color: TOKENS.ink3 }}>{subtitle}</span>
                  ) : null}
                </div>
                {/* Body */}
                <div
                  style={{
                    padding: '12px 18px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '8px',
                    overflowY: 'auto' as const,
                    minHeight: 0,
                  }}
                >
                  {children}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </Dialog>
  );
}
