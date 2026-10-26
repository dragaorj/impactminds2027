// Wraps the number inside a stat string ("25 mil+", "8.7K", "638,79", "03")
// in a [data-count] span, so ScrollFx counts it up from zero while any prefix
// or unit around it stays put. The server-rendered text is the final value.
export default function CountUp({ value, locale }: { value: string; locale: string }) {
  const m = value.match(/^(.*?)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return <>{value}</>;
  const [, before, num, after] = m;
  const sep = num.match(/[.,]/)?.[0];
  const decimals = sep ? num.split(sep)[1].length : 0;
  const pad = !sep && num.length > 1 && num.startsWith("0") ? num.length : undefined;
  return (
    <>
      {before}
      <span
        data-count={Number(sep ? num.replace(sep, ".") : num)}
        data-decimals={decimals || undefined}
        data-pad={pad}
        data-locale={locale}
        className="tabular-nums"
      >
        {num}
      </span>
      {after}
    </>
  );
}
