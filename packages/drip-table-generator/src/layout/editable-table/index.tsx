/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

import React from 'react';
import { Empty } from 'antd';
import { CloseCircleTwoTone } from '@ant-design/icons';
import { builtInComponents, ColumnConfig, DripTableDriver, DripTableRecordTypeBase, DripTableProps } from 'drip-table';
import DripTableDriverAntDesign from 'drip-table-driver-antd';

import { globalActions, GlobalStore, DripTableColumn } from '@/store';
import Draggable from '@/components/Draggable';

import styles from './index.module.less';
import { get } from '@/utils';

interface Props<RecordType extends DripTableRecordTypeBase> {
  driver: DripTableDriver<RecordType>;
  customComponents: DripTableProps<RecordType>['components'] | undefined;
}

const EditableTable = <RecordType extends DripTableRecordTypeBase>(props: Props<RecordType> & { store: GlobalStore }) => {
  const [state, actions] = props.store;
  const store = { state, setState: actions };

  const previewComponentRender = (column: DripTableColumn) => {
    const customComponents = {};
    const componentsList = Object.values(props.customComponents || {});
    componentsList.forEach((item) => {
      Object.keys(item).forEach((key) => { customComponents[key] = item[key]; });
    });
    const DripTableComponent = column['ui:type'].startsWith('custom::')
      ? customComponents[column['ui:type'].replace('custom::', '')]
      : builtInComponents[column['ui:type']];
    const hasRecord = !(!state.dataSource || state.dataSource.length <= 0);
    const record = state.dataSource[0] || {} as Record<string, unknown>;
    const value = column.dataIndex ? get(record, column.dataIndex) : record;

    const errorBoundary = () => {
      let color = '#F00';
      let message = '未知错误';
      if (!DripTableComponent) {
        color = '#F00';
        message = '未知组件';
      } else if (!hasRecord) {
        color = '#c9c9c9';
        message = '暂无数据';
      }
      return (
        <div style={{ color }}>{ message }</div>
      );
    };

    return (
      <div style={{ height: '120px', overflow: 'auto' }}>
        <div className={styles['table-cell']} style={{ width: column.width || 120 }}>
          { DripTableComponent && hasRecord
            ? (
              <DripTableComponent
                driver={props.driver || DripTableDriverAntDesign}
                value={value as unknown}
                data={record as Record<string, unknown>}
                schema={{ ...column, ...(column['ui:props'] || {}) as Record<string, unknown> } as unknown as ColumnConfig}
                preview={{}}
              />
            )
            : errorBoundary() }
        </div>
      </div>
    );
  };

  const renderTableCell = (col: DripTableColumn) => {
    const isCurrent = state.currentColumn && state.currentColumn.$id === col.$id;
    let width = String(col.width).trim() || '120';
    if ((/^[0-9]+$/gui).test(width)) {
      width += 'px';
    }
    return (
      <div
        style={{ width }}
        className={`${styles.column} ${isCurrent ? 'checked' : ''}`}
        onClick={() => {
          state.currentColumn = isCurrent ? void 0 : col;
          globalActions.checkColumn(store);
        }}
      >
        <div className={styles['column-title']}>{ col.title }</div>
        { previewComponentRender(col) }
        { isCurrent && (
          <CloseCircleTwoTone
            className={styles['close-icon']}
            twoToneColor="#ff4d4f"
            onClick={() => {
              const index = state.columns.findIndex(item => item.$id === state.currentColumn?.$id);
              if (index > -1) {
                state.columns.splice(index, 1);
                for (let i = index; i < state.columns.length; i++) {
                  state.columns[i].key = i + 1;
                  state.columns[i].sort = i + 1;
                }
                state.currentColumn = void 0;
                globalActions.editColumns(store);
                globalActions.checkColumn(store);
              }
            }}
          />
        ) }
      </div>
    );
  };

  return (
    <div style={{ padding: '12px 0 12px 12px', overflowX: 'auto' }}>
      {
        state.columns && state.columns.length > 0
          ? (
            <Draggable<DripTableColumn>
              value={(state.columns || []) as DripTableColumn[]}
              codeKey="sort"
              style={{ position: 'relative' }}
              onChange={(data) => {
                state.columns = [...data];
                globalActions.editColumns(store);
              }}
              render={renderTableCell}
            />
          )
          : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无表格配置" />
      }
    </div>
  );
};

export default EditableTable;