/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React, { ChangeEvent, createContext, useContext, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useScheduleConverter } from "./hooks/use-schedule-converter";
import { ScheduleDataActionCreator } from "../../../state/reducers/month-state/schedule-data/schedule-data.action-creator";
import { ScheduleErrorActionType } from "../../../state/reducers/month-state/schedule-errors.reducer";
import { ActionModel } from "../../../state/models/action.model";
import { ScheduleError } from "../../../common-models/schedule-error.model";
import ParseErrorModal from "../../common-components/modal/error-modal/errors.modal.component";

export interface ImportModalContextValues {
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImportModalContext = createContext<ImportModalContextValues | null>(null);

export function ImportModalProvider({ children }): JSX.Element {
  const [open, setParserModalOpen] = React.useState(false);
  const scheduleDipatcher = useDispatch();
  const { monthModel, setSrcFile, scheduleErrors } = useScheduleConverter();

  useEffect(() => {
    if (monthModel) {
      const action = ScheduleDataActionCreator.setScheduleFromMonthDMAndSaveInDB(monthModel);
      scheduleDipatcher(action);
    }
    if (scheduleErrors) {
      setParserModalOpen(true);
    }

    scheduleDipatcher({
      type: ScheduleErrorActionType.UPDATE,
      payload: scheduleErrors,
    } as ActionModel<ScheduleError[]>);
  }, [monthModel, scheduleErrors, scheduleDipatcher]);

  function handleImport(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target?.files && event.target?.files[0];
    if (file) {
      setSrcFile(file);
    }
  }

  return (
    <ImportModalContext.Provider
      value={{
        handleImport,
      }}
    >
      {children}
      {scheduleErrors.length > 0 && <ParseErrorModal open={open} setOpen={setParserModalOpen} />}
    </ImportModalContext.Provider>
  );
}

export function useImportModal(): ImportModalContextValues {
  const context = useContext(ImportModalContext);

  if (!context) throw new Error("useImportModal have to be used within ImportModalProvider");

  return context;
}
