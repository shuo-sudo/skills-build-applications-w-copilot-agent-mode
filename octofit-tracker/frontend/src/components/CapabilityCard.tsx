import type { ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  items: T[] | null | undefined;
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  renderItem: (item: T, index: number) => ReactNode;
};

export function CapabilityCard<T>({ title, description, items, isLoading, error, emptyMessage, renderItem }: Props<T>) {
  if (isLoading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading {title.toLowerCase()}...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="alert">Unable to load {title.toLowerCase()}.</p></div></section>;
  }

  if (!items || items.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p>{emptyMessage}</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><ul className="list-unstyled mb-0">{items.map((item, index) => <li key={index}>{renderItem(item, index)}</li>)}</ul></div></section>;
}
