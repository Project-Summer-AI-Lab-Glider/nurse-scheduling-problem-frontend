import React, { useEffect, useState } from "react";
import { CellColorSet } from "../../../../../../helpers/colors/cell-color-set.model";
import { BaseCellInputComponent, BaseCellInputOptions } from "./base-cell-input.component";
import { VerboseDate, WeekDay } from "../../../../../../common-models/month-info.model";
import { TranslationHelper } from "../../../../../../helpers/translations.helper";
import { useDrag, useDrop } from "react-dnd";
import classNames from "classnames/bind";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useRef } from "react";
import { usePopper } from "react-popper";
import { Popper } from "./popper";

export enum CellManagementKeys {
  Enter = "Enter",
  Escape = "Escape",
}

const PivotCellType = "Cell";
export interface PivotCell {
  type: string;
  rowIndex: number;
  cellIndex: number;
}
export interface BaseCellOptions {
  rowIndex: number;
  index: number;
  value: string;
  style?: CellColorSet;
  isBlocked: boolean;
  isPointerOn: boolean;
  isSelected: boolean;
  onClick?: () => void;
  onContextMenu?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  input?: React.FC<BaseCellInputOptions>;
  monthNumber?: number;
  verboseDate?: VerboseDate;
  onDrag?: (pivotCell: PivotCell) => void;
  onDragEnd?: () => void;
  sectionKey: string;
}

export function BaseCellComponent({
  rowIndex,
  index,
  value,
  isBlocked,
  isSelected,
  isPointerOn,
  onKeyDown,
  onValueChange,
  onClick,
  onBlur,
  input: InputComponent = BaseCellInputComponent,
  monthNumber,
  verboseDate,
  onDrag,
  onDragEnd,
  sectionKey,
}: BaseCellOptions): JSX.Element {
  const dragAnDropType = `${PivotCellType}${sectionKey ?? ""}`;
  const errorTriangle = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [isToolTipOpen, setToolTipOpen] = useState(false);
  const { styles, attributes } = usePopper(errorTriangle.current, tooltipRef.current);
  function showErrorTooltip(): void {
    setToolTipOpen(true);
  }
  function hideErrorTooltip(): void {
    setToolTipOpen(false);
  }
  const [, drop] = useDrop({
    accept: dragAnDropType,
    collect: (monitor) => {
      if (monitor.isOver()) {
        if (!isBlocked) {
          onDrag && onDrag(monitor.getItem() as PivotCell);
        }
      }
    },
    drop: () => {
      onDragEnd && onDragEnd();
    },
  });
  const [, drag, preview] = useDrag({
    item: {
      type: dragAnDropType,
      rowIndex: rowIndex,
      cellIndex: index,
    } as PivotCell,
    end: (item, monitor) => {
      if (!monitor.didDrop()) onDragEnd && onDragEnd();
    },
  });
  // Below lines disable default preview image that is inserted by browser on dragging
  useEffect(() => {
    preview(getEmptyImage());
  }, [preview]);

  function _onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === CellManagementKeys.Enter) {
      onValueChange && onValueChange(e.currentTarget.value);
      return;
    }
    onKeyDown && onKeyDown(e);
  }
  function _onValueChange(newValue: string): void {
    onValueChange && onValueChange(newValue);
  }
  function getId(): string {
    if (verboseDate && monthNumber) {
      if (verboseDate.month !== TranslationHelper.englishMonths[monthNumber]) {
        return "otherMonth";
      }
      if (
        verboseDate.isPublicHoliday ||
        verboseDate.dayOfWeek === WeekDay.SA ||
        verboseDate.dayOfWeek === WeekDay.SU
      ) {
        return "weekend";
      }
    }
    return "thisMonth";
  }

  //  #region view
  return (
    <td
      ref={drop}
      className={classNames("mainCell", { selection: isSelected, blocked: isBlocked })}
      id={getId()}
      onBlur={(): void => {
        onBlur && onBlur();
      }}
    >
      <div className="content" ref={drag}>
        {isPointerOn && !isBlocked && (
          <InputComponent
            className="cell-input"
            onValueChange={(value): void => _onValueChange(value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => _onKeyDown(e)}
          />
        )}

        <Popper
          ref={tooltipRef}
          className="errorTooltip"
          style={styles}
          {...attributes}
          data={
            <div>
              <h3>{TranslationHelper.polishMonths[monthNumber || 0]}</h3> Bład w linii: {rowIndex},
              pozycji: {index}. Wartość komórki: {value}
            </div>
          }
          isOpen={isToolTipOpen}
        ></Popper>

        {(!isPointerOn || (isPointerOn && isBlocked)) && (
          <p
            data-cy="cell"
            className="relative"
            onClick={(): void => {
              !isBlocked && onClick && onClick();
            }}
          >
            {
              value === "N" && (
                <span
                  onMouseEnter={showErrorTooltip}
                  onMouseLeave={hideErrorTooltip}
                  ref={errorTriangle}
                  className="error-triangle"
                />
              ) //todo change to proper error flag
            }
            {value}
          </p>
        )}
      </div>
    </td>
  );
  //#endregion
}
