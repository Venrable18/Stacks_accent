import { toast, ToastOptions } from 'react-toastify';
import { loadConfig } from './config';
import { t } from './i18n';
import React from 'react';

// Shared toast helper utilities with explorer transaction link support.

const baseOpts: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

function explorerTxUrl(txId: string, network: string): string {
  return network === 'testnet'
    ? `https://explorer.stacks.co/txid/${txId}?chain=testnet`
    : `https://explorer.stacks.co/txid/${txId}`;
}

export function info(message: string, opts: ToastOptions = {}) {
  toast.info(message, { ...baseOpts, ...opts });
}
export function warn(message: string, opts: ToastOptions = {}) {
  toast.warn(message, { ...baseOpts, ...opts });
}
export function error(message: string | Error, opts: ToastOptions = {}) {
  const msg = typeof message === 'string' ? message : (message as Error).message;
  toast.error(msg, { ...baseOpts, ...opts });
}

interface TxSuccessOpts extends ToastOptions {
  label?: string; // Custom header label
}

export function txPending(kind: 'session' | 'attendance') {
  const label = kind === 'session' ? t('wallet.open') : t('wallet.open');
  info(label);
}

export function txSuccess(txId: string, kind: 'session' | 'attendance', opts: TxSuccessOpts = {}) {
  const cfg = loadConfig();
  const url = explorerTxUrl(txId, cfg.network);
  const label = opts.label || (kind === 'session' ? t('session.created') : t('attendance.submitted'));
  toast.success(
    <div className="flex flex-col gap-1">
      <span>{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline decoration-dashed opacity-80 hover:opacity-100"
      >
        {t('tx.viewOnExplorer')}
      </a>
      <CopyTxIdButton txId={txId} />
    </div>,
    { ...baseOpts, ...opts }
  );
}

function CopyTxIdButton({ txId }: { txId: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(txId).then(() => {
          info(t('tx.copied'));
        });
      }}
      className="mt-1 text-[10px] px-2 py-1 rounded bg-white/10 border border-white/20 hover:border-green-500/40 hover:bg-green-500/10 transition-colors"
      type="button"
    >
      {t('tx.copy')}
    </button>
  );
}
