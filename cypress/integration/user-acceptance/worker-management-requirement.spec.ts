context("Worker management requirement", () => {
  it("Should be able to switch from main page to worker management page", () => {
    cy.visit(Cypress.env("baseUrl"));
    cy.get(".MuiTabs-flexContainer").children().eq(1).click();
    cy.get(".management-page", { timeout: 100 }).should("exist");
  });
});

context("Worker management page requirement - add worker", () => {
  const wokerName = "TestName";

  it("Should be able to switch from main page to worker management page", () => {
    cy.visit(Cypress.env("baseUrl"));
    cy.get(".MuiTabs-flexContainer").children().eq(1).click();
    cy.get(".management-page", { timeout: 100 }).should("exist").screenshotSync();
  });

  it("Should be able to open the drawer", () => {
    cy.get("[data-cy=btnDodajPracownika]").click();
  });

  it("Should be able write the name", () => {
    cy.get("[data-cy=name]").type(wokerName);
  });

  it("Should be change the worker type", () => {
    cy.get("[data-cy=position]").click();
    cy.get("[data-cy=openedDropdown]").click();
  });

  it("Should be able to save the changes", () => {
    cy.get("[data-cy=saveWorkerInfoBtn]").click();
  });

  it("Should be change the contract type", () => {
    cy.get("[data-cy=contract]").click();
    cy.get("[data-cy=openedDropdown]").click();
  });

  it("Should be able to save the changes again", () => {
    cy.get("[data-cy=saveWorkerInfoBtn]").click();
  });

  it("Should be able to exit drawer", () => {
    cy.get("[data-cy=exit-drawer]").click();
  });

  it("New worker should exist", () => {
    cy.screenshotSync();
    cy.get("[data-cy=workerName]").contains(wokerName);
  });
});
