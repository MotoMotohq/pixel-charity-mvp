import { useCallback, useState } from "react";
import { useI18n } from "../context/I18nContext";

type Props = {
  text: string;
  label: string;
  className?: string;
};

export default function CopyTextButton({ text, label, className }: Props) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  const onClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <button type="button" className={className ?? "copy-chip"} onClick={() => void onClick()} title={label}>
      {done ? t("chain.copied") : label}
    </button>
  );
}
