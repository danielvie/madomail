import { useEffect, useRef, type ReactNode } from 'react'
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels'
import type { AppSettings } from '../../../shared/settings'

type Props = {
  list: ReactNode
  reader: ReactNode
  staging: ReactNode
  readerOpen: boolean
  sizes: AppSettings['paneSizes']
  onSizesChange: (sizes: AppSettings['paneSizes']) => void
}

export default function InboxPanes({
  list,
  reader,
  staging,
  readerOpen,
  sizes,
  onSizesChange
}: Props) {
  const readerRef = usePanelRef()
  const sizesRef = useRef(sizes)
  sizesRef.current = sizes
  useEffect(() => {
    if (readerOpen) readerRef.current?.resize(`${100 - sizesRef.current.list}%`)
    else readerRef.current?.collapse()
  }, [readerOpen, readerRef])

  return (
    <Group
      id="inbox-panes"
      orientation="horizontal"
      className="min-h-0 flex-1"
      defaultLayout={{ inbox: sizes.inbox, staging: 100 - sizes.inbox }}
      onLayoutChanged={(layout, meta) => {
        if (meta.isUserInteraction) onSizesChange({ ...sizes, inbox: layout.inbox })
      }}
    >
      <Panel id="inbox" minSize="40%" maxSize="85%" className="min-h-0 min-w-0">
        <Group
          id="reader-panes"
          orientation="vertical"
          className="h-full"
          onLayoutChanged={(layout, meta) => {
            if (readerOpen && meta.isUserInteraction && layout.list >= 15 && layout.list <= 85)
              onSizesChange({ ...sizes, list: layout.list })
          }}
        >
          <Panel id="list" minSize="15%" className="min-h-0">
            {list}
          </Panel>
          <Separator
            id="reader-divider"
            aria-label="Resize email list and reader"
            disabled={!readerOpen}
            disableDoubleClick
            className="pane-divider pane-divider-horizontal"
          />
          <Panel
            id="reader"
            panelRef={readerRef}
            defaultSize={readerOpen ? `${100 - sizes.list}%` : '56px'}
            collapsible
            collapsedSize="56px"
            minSize="15%"
            maxSize="85%"
            className="min-h-0"
          >
            {reader}
          </Panel>
        </Group>
      </Panel>
      <Separator
        id="staging-divider"
        aria-label="Resize inbox and staging"
        disableDoubleClick
        className="pane-divider pane-divider-vertical"
      />
      <Panel id="staging" minSize="15%" maxSize="60%" className="min-h-0 min-w-0">
        {staging}
      </Panel>
    </Group>
  )
}
