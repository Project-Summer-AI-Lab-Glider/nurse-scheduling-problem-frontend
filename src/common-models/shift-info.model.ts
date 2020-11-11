export enum ShiftCode {
  R = "R",
  P = "P",
  D = "D",
  N = "N",
  DN = "DN",
  PN = "PN",
  W = "W",
  U = "U",
  L4 = "L4",
}

export interface ShiftInfoModel {
  // eslint-disable-next-line @typescript-eslint/camelcase
  [nurse_name: string]: ShiftCode[];
}