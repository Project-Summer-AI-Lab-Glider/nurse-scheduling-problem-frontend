/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
describe("Tab management", () => {
  beforeEach(() => {
    cy.loadScheduleToMonth();
    cy.get('[data-cy="btn-management-tab"]').click();
    cy.get('[data-cy="management-page-title"]').should("be.visible");
    cy.get('[data-cy="btn-add-worker"]').click();
    cy.get('[data-cy="worker-drawer"]').should("be.visible");
  });

  describe("Creating worker", () => {
    context("when creating valid worker", () => {
      const newWorker = "Ala makota";

      it("creates the worker", () => {
        cy.get('[data-cy="name"]').type(newWorker);
        cy.get(`[value="${newWorker}"]`).should("be.visible");
        cy.get('[data-cy="position"]').click().get('[data-cy="other"]').click();
        cy.get('[data-cy="contract"]').click().get('[data-cy="employment_contract"]').click();
        cy.get('[data-cy="contract-time-dropdown"]').click().get('[data-cy="other"]').click();
        cy.get('[data-cy="input-employ-time-other"]').click().type("{backspace}{backspace}13");
        cy.get('[data-cy="btn-save-worker"]').click();
        cy.get('[data-cy="btn-add-worker"]').should("be.visible");
        cy.contains(newWorker);
        cy.get('[data-cy="btn-schedule-tab"]').click();
        cy.contains(newWorker);
      });
    });
  });

  describe("Editing the time", () => {
    beforeEach(() => {
      cy.get('[data-cy="contract"]').click();
    });

    it("Should properly handle employment contract", () => {
      cy.get('[data-cy="employment_contract"]').click();
      cy.get('[data-cy="contract-time-dropdown"]').click().get('[data-cy="full"]').click();
      cy.get('[data-cy="contract-time-dropdown"]').click().get('[data-cy="half"]').click();
      cy.get('[data-cy="contract-time-dropdown"]').click().get('[data-cy="other"]').click();
      cy.get('[data-cy="input-employ-time-other"] input')
        .click()
        .clear({ force: true })
        .type("123");
    });
    it("Should properly handle civil contract", () => {
      cy.get('[data-cy="civil_contract"]').click();
      cy.get('[data-cy="input-civil-time"]').click();
      cy.get('[data-cy="input-civil-time"] input').clear({ force: true }).type("123");
    });
  });
});
