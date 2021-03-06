import { usePersistFn, useControllableValue } from 'ahooks'
import { Tooltip } from 'antd'
import { IColumn } from 'office-ui-fabric-react'
import React, { useCallback, useRef, useMemo, useEffect } from 'react'
import { useShallowCompareEffect } from 'react-use'
import {
  CoreUtils,
  SelectionWithFilter,
  useClientRequest,
  useServices,
} from '@tidb-dashboard/core'
import {
  IBaseSelectProps,
  BaseSelect,
  InstanceStatusBadge,
  TextWrap,
} from '../'
import DropOverlay from './DropOverlay'
import { ITableWithFilterRefProps } from './TableWithFilter'
import ValueDisplay from './ValueDisplay'
import { useScopedTranslation } from './meta'

export interface IInstanceSelectProps
  extends Omit<IBaseSelectProps<string[]>, 'dropdownRender' | 'valueRender'> {
  onChange?: (value: string[]) => void
  enableTiFlash?: boolean
  defaultSelectAll?: boolean
}

export interface IInstanceSelectRefProps {
  getInstanceByKeys: (keys: string[]) => CoreUtils.IInstanceTableItem[]
  getInstanceByKey: (key: string) => CoreUtils.IInstanceTableItem
}

function InstanceSelect(
  props: IInstanceSelectProps,
  ref: React.Ref<IInstanceSelectRefProps>
) {
  const [internalVal, setInternalVal] = useControllableValue<string[]>(props)
  const setInternalValPersist = usePersistFn(setInternalVal)
  const {
    enableTiFlash,
    defaultSelectAll,
    value, // only to exclude from restProps
    onChange, // only to exclude from restProps
    ...restProps
  } = props

  const { t } = useScopedTranslation()

  const { ApiClient } = useServices()
  const {
    data: dataTiDB,
    isLoading: loadingTiDB,
  } = useClientRequest((cancelToken) =>
    ApiClient.default.getTiDBTopology({ cancelToken })
  )
  const {
    data: dataStores,
    isLoading: loadingStores,
  } = useClientRequest((cancelToken) =>
    ApiClient.default.getStoreTopology({ cancelToken })
  )
  const {
    data: dataPD,
    isLoading: loadingPD,
  } = useClientRequest((cancelToken) =>
    ApiClient.default.getPDTopology({ cancelToken })
  )

  const columns: IColumn[] = useMemo(
    () => [
      {
        name: t('columns.key'),
        key: 'key',
        minWidth: 150,
        maxWidth: 150,
        onRender: (node: CoreUtils.IInstanceTableItem) => {
          return (
            <TextWrap>
              <Tooltip title={node.key}>
                <span>{node.key}</span>
              </Tooltip>
            </TextWrap>
          )
        },
      },
      {
        name: t('columns.status'),
        key: 'status',
        minWidth: 100,
        maxWidth: 100,
        onRender: (node: CoreUtils.IInstanceTableItem) => {
          return (
            <TextWrap>
              <InstanceStatusBadge status={node.status} />
            </TextWrap>
          )
        },
      },
    ],
    [t]
  )

  const [tableItems] = useMemo(() => {
    if (loadingTiDB || loadingStores || loadingPD) {
      return [[], []]
    }
    return CoreUtils.buildInstanceTable({
      dataPD,
      dataTiDB,
      dataTiKV: dataStores?.tikv,
      dataTiFlash: dataStores?.tiflash,
      includeTiFlash: enableTiFlash,
    })
  }, [
    enableTiFlash,
    dataTiDB,
    dataStores,
    dataPD,
    loadingTiDB,
    loadingStores,
    loadingPD,
  ])

  const selection = useRef(
    new SelectionWithFilter({
      onSelectionChanged: () => {
        const s = selection.current.getAllSelection() as CoreUtils.IInstanceTableItem[]
        const keys = s.map((v) => v.key)
        setInternalValPersist([...keys])
      },
    })
  )

  useShallowCompareEffect(() => {
    selection.current?.resetAllSelection(internalVal ?? [])
  }, [internalVal])

  const dataHasLoaded = useRef(false)

  useEffect(() => {
    // When data is loaded for the first time, we need to:
    // - Select all if `defaultSelectAll` is set and value is not given.
    // - Update selection according to value
    if (dataHasLoaded.current) {
      return
    }
    if (tableItems.length === 0) {
      return
    }
    const sel = selection.current
    sel.setChangeEvents(false)
    sel.setAllItems(tableItems)
    if (internalVal && internalVal.length > 0) {
      sel.resetAllSelection(internalVal)
    } else if (defaultSelectAll) {
      sel.setAllSelectionSelected(true)
    }
    sel.setChangeEvents(true)
    dataHasLoaded.current = true
    // [defaultSelectAll, internalVal] is not needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableItems])

  const getInstanceByKeys = usePersistFn((keys: string[]) => {
    const keyToItemMap = {}
    for (const item of tableItems) {
      keyToItemMap[item.key] = item
    }
    return keys.map((key) => keyToItemMap[key])
  })

  const getInstanceByKey = usePersistFn((key: string) => {
    return getInstanceByKeys([key])[0]
  })

  React.useImperativeHandle(ref, () => ({
    getInstanceByKey,
    getInstanceByKeys,
  }))

  const renderValue = useCallback(
    (selectedKeys) => {
      if (
        tableItems.length === 0 ||
        !selectedKeys ||
        selectedKeys.length === 0
      ) {
        return null
      }
      return <ValueDisplay items={tableItems} selectedKeys={selectedKeys} />
    },
    [tableItems]
  )

  const filterTableRef = useRef<ITableWithFilterRefProps>(null)

  const renderDropdown = useCallback(
    () => (
      <DropOverlay
        columns={columns}
        items={tableItems}
        selection={selection.current}
        filterTableRef={filterTableRef}
      />
    ),
    [columns, tableItems]
  )

  const handleOpened = useCallback(() => {
    filterTableRef.current?.focusFilterInput()
  }, [])

  return (
    <BaseSelect
      dropdownRender={renderDropdown}
      value={internalVal}
      valueRender={renderValue}
      disabled={loadingTiDB || loadingStores || loadingPD}
      placeholder={t('placeholder')}
      onOpened={handleOpened}
      {...restProps}
    />
  )
}

export default React.forwardRef(InstanceSelect)
