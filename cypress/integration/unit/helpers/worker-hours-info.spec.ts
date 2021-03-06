/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as _ from "lodash";
import {
  NotWorkingShift,
  NotWorkingShiftType,
  Shift,
  ShiftCode,
  SHIFTS,
} from "../../../../src/common-models/shift-info.model";
import { ContractType } from "../../../../src/common-models/worker-info.model";
import { MonthDataArray, ShiftHelper } from "../../../../src/helpers/shifts.helper";
import {
  DEFAULT_NORM_SUBTRACTION,
  WorkerHourInfo,
} from "../../../../src/helpers/worker-hours-info.model";
import {
  workerTestData,
  WorkerTestDataInstance,
} from "../../../fixtures/worker-data/worker-data-preprocessor";

describe("Worker hours info", () => {
  workerTestData.forEach((workerInstance) => {
    context(
      `Same data in calculation as in original schedule for ${workerInstance.workerName}`,
      () => {
        const calculation = calculateWorkerHoursFromWorkerInstance(workerInstance);
        it("worker norm", () => {
          expect(calculation.workerHourNorm).to.equal(workerInstance.workerReqiuredHours);
        });

        it("worker actual hours", () => {
          expect(calculation.workerTime).to.equal(workerInstance.workerActualHours);
        });

        it("overtime", () => {
          expect(calculation.overTime).to.equal(workerInstance.workerOvertime);
        });
      }
    );
  });

  const exampleWorker = workerTestData[0];
  const exampleWorkringShift = SHIFTS[ShiftCode.D];

  context(`After replacing working shift ${exampleWorkringShift.code} with`, () => {
    const annualLeaveFreeShift = findFreeShift(NotWorkingShiftType.AnnualLeave);
    it(`annual leave free shift ${annualLeaveFreeShift.code} should subtract from required hours max(duration of working shift, shift subtraction)`, () => {
      const subtraction = Math.max(
        ShiftHelper.shiftToWorkTime(exampleWorkringShift),
        annualLeaveFreeShift.normSubtraction ?? DEFAULT_NORM_SUBTRACTION
      );
      const {
        primaryScheduleWorkerHoursInfo,
        actualScheduleWorkerHoursInfo,
      } = calculateRequiredTimeBeforeAndAfterShiftReplacement(
        exampleWorker,
        exampleWorkringShift,
        annualLeaveFreeShift
      );
      const expectedWorkHourNorm = primaryScheduleWorkerHoursInfo.workerHourNorm - subtraction;
      expect(actualScheduleWorkerHoursInfo.workerHourNorm).to.equal(expectedWorkHourNorm);
    });

    const medicalLeaveFreeShift = findFreeShift(NotWorkingShiftType.MedicalLeave);
    it(`medical leave free shift: ${medicalLeaveFreeShift.code} should not subtract from required hours if there was no working shift in primary schedule`, () => {
      const {
        primaryScheduleWorkerHoursInfo,
        actualScheduleWorkerHoursInfo,
      } = calculateRequiredTimeBeforeAndAfterShiftReplacement(
        exampleWorker,
        SHIFTS[ShiftCode.W],
        medicalLeaveFreeShift
      );
      const expectedWorkHourNorm = primaryScheduleWorkerHoursInfo.workerHourNorm;
      expect(actualScheduleWorkerHoursInfo.workerHourNorm).to.equal(expectedWorkHourNorm);
    });

    it(`medical leave free shift ${medicalLeaveFreeShift.code} should subtract from required hours max(duration of working shift, shift subtraction, 8) if there was working shift in primary schedule`, () => {
      const subtraction = Math.max(
        ShiftHelper.shiftToWorkTime(exampleWorkringShift),
        medicalLeaveFreeShift.normSubtraction ?? DEFAULT_NORM_SUBTRACTION
      );
      const {
        primaryScheduleWorkerHoursInfo,
        actualScheduleWorkerHoursInfo,
      } = calculateRequiredTimeBeforeAndAfterShiftReplacement(
        exampleWorker,
        exampleWorkringShift,
        medicalLeaveFreeShift
      );
      const expectedWorkHourNorm = primaryScheduleWorkerHoursInfo.workerHourNorm - subtraction;
      expect(actualScheduleWorkerHoursInfo.workerHourNorm).to.equal(expectedWorkHourNorm);
    });

    it("wolne, should not subtract from required hours", () => {
      const {
        primaryScheduleWorkerHoursInfo,
        actualScheduleWorkerHoursInfo,
      } = calculateRequiredTimeBeforeAndAfterShiftReplacement(
        exampleWorker,
        exampleWorkringShift,
        SHIFTS[ShiftCode.W]
      );
      const expectedWorkHourNorm = primaryScheduleWorkerHoursInfo.workerHourNorm;
      expect(actualScheduleWorkerHoursInfo.workerHourNorm).to.equal(expectedWorkHourNorm);
    });
  });

  it("Should not throw when test data contains more days than one month could normally contain", () => {
    const testedMonthParams = {
      monthNumber: 2,
      dayCount: 31,
      year: 2021,
    };
    const dates = _.range(1, testedMonthParams.dayCount + 5);
    const shifts = dates.map((_) => ShiftCode.W);
    const primaryShifts = shifts;
    const calculateWorkerDataAction = (): WorkerHourInfo =>
      WorkerHourInfo.fromWorkerInfo(
        shifts,
        primaryShifts as MonthDataArray<ShiftCode>,
        1,
        ContractType.EMPLOYMENT_CONTRACT,
        testedMonthParams.monthNumber,
        testedMonthParams.year,
        dates,
        SHIFTS
      );

    expect(calculateWorkerDataAction).to.not.throw();
  });
});

//#region helper function
interface RequiredTimeForPrimaryAndActualSchedule {
  primaryScheduleWorkerHoursInfo: WorkerHourInfo;
  actualScheduleWorkerHoursInfo: WorkerHourInfo;
}

function calculateWorkerHoursFromWorkerInstance(
  workerInstance: WorkerTestDataInstance,
  primaryWorkerShifts?: ShiftCode[],
  actualWorkerShifts?: ShiftCode[]
): WorkerHourInfo {
  return WorkerHourInfo.fromWorkerInfo(
    actualWorkerShifts ?? workerInstance.actualWorkerShifts,
    (primaryWorkerShifts as MonthDataArray<ShiftCode>) ?? workerInstance.primaryWorkerShifts,
    workerInstance.workerNorm,
    workerInstance.workerContract,
    workerInstance.month,
    workerInstance.year,
    workerInstance.dates,
    SHIFTS
  );
}
function calculateRequiredTimeBeforeAndAfterShiftReplacement(
  workerInstance: WorkerTestDataInstance,
  primaryShift: Shift,
  primaryShiftReplacement: Shift
): RequiredTimeForPrimaryAndActualSchedule {
  const testedShiftIndex = 0;
  const primaryWorkerShifts = [...workerInstance.primaryWorkerShifts];
  primaryWorkerShifts[testedShiftIndex] = primaryShift.code as ShiftCode;
  const actualWorkerShifts = [...primaryWorkerShifts];
  const primaryScheduleWorkerHoursInfoRequiredTime = calculateWorkerHoursFromWorkerInstance(
    workerInstance,
    primaryWorkerShifts,
    actualWorkerShifts
  );
  actualWorkerShifts[testedShiftIndex] = primaryShiftReplacement.code as ShiftCode;
  const actualScheduleWorkerHoursInfoRequiredTime = calculateWorkerHoursFromWorkerInstance(
    workerInstance,
    primaryWorkerShifts,
    actualWorkerShifts
  );
  return {
    primaryScheduleWorkerHoursInfo: primaryScheduleWorkerHoursInfoRequiredTime,
    actualScheduleWorkerHoursInfo: actualScheduleWorkerHoursInfoRequiredTime,
  };
}

function findFreeShift(shiftType: NotWorkingShiftType) {
  return Object.values(SHIFTS).find(
    (shift) => shift.isWorkingShift === false && shift.type === shiftType
  ) as NotWorkingShift;
}

//#endregion
