interface KpiBreakdownProps {
  title: string;
  lines: string[];
}

export const KpiBreakdown = ({ title, lines }: KpiBreakdownProps) => {
  return (
    <section className="kpi-breakdown">
      <p className="kpi-breakdown-title">{title}</p>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
};
