'use client';

import { useState, useEffect, useRef } from 'react';

interface DropdownItem {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export function VaultDropdown<T extends DropdownItem>({
  items,
  selected,
  onSelect,
  renderItem,
  renderRow,
}: {
  items: T[];
  selected: T;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  /** Optional custom row content (incl. its own checkmark). Falls back to the
   *  default icon + name + description + check when omitted. */
  renderRow?: (item: T, active: boolean) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} className="w-token-sel w-token-rx" style={{ border: 'none' }}>
        {renderItem(selected)}
        <span className="w-caret">▾</span>
      </button>
      <div className={`rx-dropdown ${open ? 'open' : ''}`}>
        {items.map((item) => {
          const active = selected?.id === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
              className={`rx-opt ${active ? 'active' : ''}`}
            >
              {renderRow ? (
                renderRow(item, active)
              ) : (
                <>
                  <img src={item.icon} alt={item.name} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.description && <span className="text-[10px] text-[#9a9a9a]">{item.description}</span>}
                  </div>
                  {active && <span className="rx-check">✓</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
