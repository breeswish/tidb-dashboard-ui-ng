import { IColumn, ISelection } from 'office-ui-fabric-react'
import React, { useState, useMemo } from 'react'
import TableWithFilter, {
  ITableWithFilterRefProps,
} from '../InstanceSelect/TableWithFilter'
import { useScopedTranslation } from './meta'
import { IItem } from '.'

const containerStyle = { fontSize: '0.8rem' }

export interface IDropOverlayProps<T> {
  selection: ISelection
  columns: IColumn[]
  items: T[]
  filterFn?: (keyword: string, item: T) => boolean
  filterTableRef?: React.Ref<ITableWithFilterRefProps>
}

function DropOverlay<T extends IItem>({
  selection,
  columns,
  items,
  filterFn,
  filterTableRef,
}: IDropOverlayProps<T>) {
  const { t } = useScopedTranslation()
  const [keyword, setKeyword] = useState('')

  const filteredItems = useMemo(() => {
    if (keyword.length === 0) {
      return items
    }
    const kw = keyword.toLowerCase()
    const filter =
      filterFn == null
        ? (it: T) =>
            it.key.toLowerCase().indexOf(kw) > -1 ||
            (it.label ?? '').toLowerCase().indexOf(kw) > -1
        : (it: T) => filterFn(keyword, it)
    return items.filter(filter)
  }, [items, keyword, filterFn])

  return (
    <TableWithFilter
      selection={selection}
      filterPlaceholder={t('filterPlaceholder')}
      filter={keyword}
      onFilterChange={setKeyword}
      tableMaxHeight={300}
      tableWidth={250}
      columns={columns}
      items={filteredItems}
      containerStyle={containerStyle}
      ref={filterTableRef}
    />
  )
}

const typedMemo: <T>(c: T) => T = React.memo

export default typedMemo(DropOverlay)
