/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TranslationHelper } from "../../../helpers/translations.helper";
import { ApplicationStateModel } from "../../../state/application-state.model";
import { Button } from "../../common-components";
import { ScheduleKey } from "../../../logic/data-access/persistance-store.model";
import { MonthSwitchActionCreator } from "../../../state/schedule-data/month-switch.action-creator";
import { LocalStorageProvider } from "../../../logic/data-access/local-storage-provider.model";
import { MonthDataModel } from "../../../state/schedule-data/schedule-data.model";
import { MonthHelper } from "../../../helpers/month.helper";
import { useImportModal } from "../import-buttons/import-modal-context";
import { useTranslation } from "react-i18next";

export function EmptyMonthButtons(): JSX.Element {
  const { month_number: currentMonth, year: currentYear } = useSelector(
    (state: ApplicationStateModel) => state.actualState.persistentSchedule.present.schedule_info
  );
  const { revision } = useSelector((state: ApplicationStateModel) => state.actualState);

  const prevDate = MonthHelper.getDateWithMonthOffset(currentMonth, currentYear, -1);

  const [hasValidPrevious, setHasValidPrevious] = useState<boolean>(false);
  const { handleImport } = useImportModal();

  const dispatch = useDispatch();

  const fileUpload = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // To prevent a memory leak
    // https://www.debuggr.io/react-update-unmounted-component/
    let mounted = true;
    const setPrevMonth = async (): Promise<void> => {
      const storageProvider = new LocalStorageProvider();
      const prevMonth = await storageProvider.getMonthRevision(
        new ScheduleKey(prevDate.getMonth(), prevDate.getFullYear()).getRevisionKey(revision)
      );
      if (mounted) {
        setHasValidPrevious(isMonthValid(prevMonth));
      }
    };
    setPrevMonth();
    return (): void => {
      mounted = false;
    };
  }, [prevDate, revision]);

  const isMonthValid = (month: MonthDataModel | undefined): boolean => {
    return (
      month !== undefined &&
      month.month_info.dates.length > 0 &&
      !month.isAutoGenerated &&
      !month.isCorrupted
    );
  };
  const { t } = useTranslation();

  return (
    <div className={"newPageButtonsPane"}>
      {hasValidPrevious && (
        <Button
          onClick={(): void => {
            dispatch(MonthSwitchActionCreator.copyFromPrevMonth());
          }}
          variant="secondary"
          data-cy="copy-prev-month"
        >
          {" "}
          {`${t("loadScheduleFrom")} z ${
            TranslationHelper.polishMonths[prevDate.getMonth()]
          } ${prevDate.getFullYear()}`}
        </Button>
      )}

      <Button variant="primary" onClick={(): void => fileUpload.current?.click()}>
        <input
          ref={fileUpload}
          id="file-input"
          data-cy="file-input"
          onChange={(event): void => handleImport(event)}
          style={{ display: "none" }}
          type="file"
          accept=".xlsx"
        />
        {t("loadFromFile")}
      </Button>
    </div>
  );
}
