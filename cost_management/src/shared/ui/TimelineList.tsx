export interface TimelineItem {
  id: string;
  title: string;
  subtitle: string;
  value?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'info';
}

interface TimelineListProps {
  items: TimelineItem[];
  emptyText?: string;
}

export const TimelineList = ({ items, emptyText = 'Sem eventos no período.' }: TimelineListProps) => {
  if (items.length === 0) {
    return <div className="timeline-empty">{emptyText}</div>;
  }

  return (
    <div className="timeline-list-v2">
      {items.map((item) => (
        <article key={item.id} className={`timeline-row tone-${item.tone || 'neutral'}`}>
          <div>
            <p className="timeline-title">{item.title}</p>
            <p className="timeline-subtitle">{item.subtitle}</p>
          </div>
          {item.value && <p className="timeline-value">{item.value}</p>}
        </article>
      ))}
    </div>
  );
};
