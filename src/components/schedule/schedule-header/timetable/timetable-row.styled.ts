/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import styled from "styled-components";
import { colors } from "../../../../assets/colors";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0;
  position: static;
  width: 1350px;
  height: 70px;
  cursor: default;

  //text
  text-align: center;
  letter-spacing: 0.75px;
  font-style: normal;
  font-weight: 300;
  font-size: 12px;
  line-height: 24px;

  &:not(:last-child) {
    border-bottom: 1px solid ${colors.tableBorderGrey};

    &.selection {
      border-color: white;
    }
  }

  &.selection {
    border-left: 1px solid white;
    background-color: white;
    outline: white solid 1px;
    box-shadow: 0 4px 7px rgba(16, 32, 70, 0.2), 0 0 7px rgba(16, 32, 70, 0.2);
  }

  &.blocked {
    cursor: default;
  }
`;