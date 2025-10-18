window.STRINGS = {
  title: "Hospital Patient Database",
  subtitle: "Run SQL safely, seed demo data, and inspect results.",
  panelQueryTitle: "SQL Console",
  panelQueryDesc: "Type a SELECT to read or an INSERT to write. The button decides GET vs POST automatically.",
  sqlLabel: "SQL Query",
  sqlHelp: "Examples: SELECT * FROM patient;  INSERT INTO patient (name, dateOfBirth) VALUES ('Alice','2000-05-05 00:00:00');",
  btnRun: "Run Query",
  btnSeed: "Insert Seeder Rows",
  autoRefreshLabel: "Refresh table after requests",
  panelResponseTitle: "Raw Server Response",
  panelResponseDesc: "JSON returned by the API is shown here for transparency.",
  tableTitle: "patient Table",
  tableDesc: "Latest snapshot from the database.",
  btnRefresh: "Refresh",
  alerts: {
    seeded: "Seeder rows inserted.",
    insertOk: "Insert completed.",
    selectOk: "Query executed.",
    emptySql: "Please enter a SQL statement.",
    onlyPatient: "Queries must reference the 'patient' table.",
    invalid: "Only SELECT (read) and INSERT (write) are permitted.",
    error: "Request failed."
  }
};
