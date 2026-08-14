"use client";

import React from "react";
import { Btn } from "@/components/PageHeader";
import { cn } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";

/**
 * The app's create/edit dialog, extracted so the five COMPASS tracking pages
 * share one instead of carrying five copies. Visually identical to the dialog
 * the Kamus Kompetensi page already uses — this is the same markup, not a new
 * design.
 */
export function CrudModal({
  title,
  icon = "competency",
  onClose,
  onSave,
  saveLabel,
  children,
  wide,
}: {
  title: string;
  icon?: IconName;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { t } = useI18n();
  const Glyph = Icon[icon];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 w-full glass card shadow-glass animate-fade-up", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center gap-2 border-b p-4">
          <Glyph className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Btn>
          <Btn variant="primary" onClick={onSave}>
            {saveLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/** Edit / delete affordances on a row or card, revealed on hover. */
export function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        title={t("Edit")}
        className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100"
      >
        {t("Edit")}
      </button>
      <button
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        title={t("Delete")}
        className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export const modalInputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500";
export const modalLabelCls = "block text-[11px] font-medium text-[var(--muted)]";
