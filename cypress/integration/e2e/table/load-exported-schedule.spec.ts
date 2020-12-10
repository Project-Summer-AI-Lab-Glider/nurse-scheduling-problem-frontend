context("Load Exported Schedule", () => {
  before(() => {
    cy.loadSchedule();
  });

  it("Should be able to save file and load the exported file", () => {
    cy.get("[data-cy=export-schedule-button]").click();

    cy.get("a[download]")
      .then(
        (anchor) =>
          new Cypress.Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", anchor.prop("href"), true);
            xhr.responseType = "blob";
            xhr.onload = (): void => {
              if (xhr.status === 200) {
                const blob = xhr.response;
                const reader = new FileReader();
                reader.onload = (): void => {
                  resolve(reader.result);
                };
                reader.readAsBinaryString(blob);
              }
            };
            xhr.send();
          })
      )
      .then((file: string) => {
        cy.writeFile("cypress/fixtures/grafik.xlsx", file, "binary");
        cy.get('[data-cy="file-input"]').attachFile("grafik.xlsx");
      });
  });
});