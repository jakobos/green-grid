import { useState } from 'react'
import { CATALOG, LAYER_NAMES } from '@/data/catalog'
import { Input } from '@/components/ui/input'
import type { CatalogItem, Layer } from '@/types/garden'

const LAYERS: Layer[] = [1, 2, 3, 4, 5]

type LayerSectionProps = {
  layer: Layer
  items: CatalogItem[]
  queryActive: boolean
}

function LayerSection({ layer, items, queryActive }: LayerSectionProps): JSX.Element {
  const [open, setOpen] = useState(true)
  const showItems = open || queryActive

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-expanded={open}
      >
        <span>{LAYER_NAMES[layer]}</span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {showItems && (
        <ul className="py-1">
          {items.map((item) => (
            <CatalogEntry key={item.catalogId} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

type CatalogEntryProps = {
  item: CatalogItem
}

function CatalogEntry({ item }: CatalogEntryProps): JSX.Element {
  function handleDragStart(e: React.DragEvent<HTMLLIElement>): void {
    e.dataTransfer.setData('application/x-catalog-id', item.catalogId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      className="flex cursor-grab items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
      title={item.description}
      data-catalog-id={item.catalogId}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-sm"
        style={{
          backgroundColor: item.color,
          borderRadius: item.shape === 'circle' ? '50%' : '2px',
        }}
        aria-hidden="true"
      />
      <span className="truncate">{item.name}</span>
    </li>
  )
}

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps): JSX.Element {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const queryActive = trimmed.length > 0

  const filteredItems = queryActive
    ? CATALOG.filter(
        (item) =>
          item.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          item.description.toLowerCase().includes(trimmed.toLowerCase())
      )
    : CATALOG

  const visibleLayers = LAYERS.map((layer) => ({
    layer,
    items: filteredItems.filter((item) => item.layer === layer),
  })).filter(({ items }) => items.length > 0)

  return (
    <aside
      data-testid="sidebar"
      className={`flex h-full flex-col border-r border-border bg-background transition-all duration-200 ${
        collapsed ? 'w-8' : 'w-52'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Catalog
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="border-b border-border px-2 py-2">
            <label htmlFor="catalog-search" className="sr-only">
              Search catalog
            </label>
            <Input
              id="catalog-search"
              type="search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('')
                }
              }}
              className="h-7 text-xs"
              data-testid="catalog-search"
            />
          </div>

          <div className="flex-1 overflow-y-auto" data-testid="sidebar-catalog">
            {visibleLayers.length === 0 && queryActive ? (
              <p className="px-3 py-4 text-xs text-muted-foreground">No items match.</p>
            ) : (
              visibleLayers.map(({ layer, items }) => (
                <LayerSection
                  key={layer}
                  layer={layer}
                  items={items}
                  queryActive={queryActive}
                />
              ))
            )}
          </div>
        </>
      )}
    </aside>
  )
}
