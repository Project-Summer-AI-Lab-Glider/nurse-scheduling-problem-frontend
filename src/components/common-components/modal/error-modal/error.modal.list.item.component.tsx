/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import { VerboseDate } from "../../../../common-models/month-info.model";
import { ScheduleErrorMessageModel } from "../../../../common-models/schedule-error-message.model";
import { TranslationHelper } from "../../../../helpers/translations.helper";
import { useMonthInfo } from "../../../schedule-page/validation-drawer/use-verbose-dates";

interface Options {
  error: ScheduleErrorMessageModel;
}

function prepareMonthName(index: number, day: number, month: number): string {
  let monthName = `${TranslationHelper.polishMonthsGenetivus[month]}`;

  if (index < day - 1) {
    monthName = `${TranslationHelper.polishMonthsGenetivus[(month + 11) % 12]}`;
  } else if (index > 20 && day < 8) {
    monthName = `${TranslationHelper.polishMonthsGenetivus[(month + 1) % 12]}`;
  }
  return monthName;
}

export default function ModalErrorListItem({ error }: Options): JSX.Element {
  const { verboseDates, monthNumber } = useMonthInfo();
  const mappedDays = verboseDates.map((d: VerboseDate) => d.date);

  const errorDayIndex = error.day && error.day > 0 ? error.day : -1;
  const errorDay = errorDayIndex ? mappedDays[errorDayIndex - 1] : 0;
  const monthName = prepareMonthName(errorDayIndex, errorDay, monthNumber);

  const displayTitle = error.title && error.title !== "Nie rozpoznano błędu";
  return (
    <div className="error-list-item">
      <div className="red-rectangle" />
      <div className="error-modal">
        {displayTitle && (
          <div className="error-title">
            <p className="error-title-content">
              {error.title === "date" ? `${errorDay} ` + monthName : `${error.title}`}
              {errorDayIndex > -1 && error.title !== "date" ? `, ${errorDay} ` + monthName : ``}
            </p>
          </div>
        )}
        <div
          className="error-text-modal"
          dangerouslySetInnerHTML={{ __html: error.message || "" }}
        />
      </div>
    </div>
  );
}
