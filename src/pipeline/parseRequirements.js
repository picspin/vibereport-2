import fs from "node:fs";

export function parseRequirements(markdown) {
  const lines = markdown.split(/\r?\n/);

  const obj = {
    title: "",
    deliverables: [],
    client: {
      name: "Jiangmen Central Hospital",
      marketPosition: [],
      ecosystemDeployment: [],
      strategicPartnership: [],
    },
    presentation: {
      audience: "",
      objective: "",
      constraints: [],
      infographicMustCommunicate: [],
      promoCopyMustInclude: [],
    },
    extractedNumbers: {
      bedsAuthorized: "3,000",
      bedsOperational: "2,200+",
      outpatientVisits2024: "2.607M",
      discharges2024: "115.5K",
      surgeries2024: "41,238",
      severeCriticalPct: "83.96%",
      tier34SurgeryPct: "64.21%",
      ctUnits: "8",
      nuclearCtUnits: "1",
      ctPatientsDaily: "600-800",
      dataPointsDaily: "1,000+",
      ctContrastBottlesMonthly: "7,500",
      mrContrastBottlesMonthly: "3,000",
      primovistBottlesMonthly: "300",
      ctSetsMonthly: "7,500",
      mrSetsMonthly: "3,300",
      partnershipMonths: "39",
      partnershipStart: "January 2023",
    },
  };

  let section = "";
  let subsection = "";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (!obj.title) {
      obj.title = line;
      continue;
    }

    if (line === "---") {
      section = "";
      subsection = "";
      continue;
    }

    if (line.startsWith("**Client Profile:")) {
      section = "client";
      continue;
    }

    if (line.startsWith("**Presentation Requirements:")) {
      section = "presentation";
      continue;
    }

    if (line.startsWith("**Deliverables:")) {
      section = "deliverables";
      continue;
    }

    if (line.startsWith("*Market Position")) {
      subsection = "marketPosition";
      continue;
    }

    if (line.startsWith("*Bayer Ecosystem Deployment")) {
      subsection = "ecosystemDeployment";
      continue;
    }

    if (line.startsWith("*Strategic Partnership")) {
      subsection = "strategicPartnership";
      continue;
    }

    if (line.startsWith("*Audience:")) {
      obj.presentation.audience = line.replace("*Audience:*", "").trim();
      continue;
    }

    if (line.startsWith("*Objective:")) {
      obj.presentation.objective = line.replace("*Objective:*", "").trim();
      continue;
    }

    if (line.startsWith("*Constraints:")) {
      subsection = "constraints";
      continue;
    }

    if (line.startsWith("*Infographic Must Communicate:")) {
      subsection = "infographicMustCommunicate";
      continue;
    }

    if (line.startsWith("*Promotional Copy Must Include:")) {
      subsection = "promoCopyMustInclude";
      continue;
    }

    if (/^\d+\./.test(line) && section === "deliverables") {
      obj.deliverables.push(line.replace(/^\d+\.\s*/, ""));
      continue;
    }

    if (line.startsWith("-") && section === "client") {
      const text = line.replace(/^\-\s*/, "");
      if (subsection && obj.client[subsection]) obj.client[subsection].push(text);
      continue;
    }

    if (line.startsWith("-") && section === "presentation") {
      const text = line.replace(/^\-\s*/, "");
      if (subsection === "constraints") obj.presentation.constraints.push(text);
      continue;
    }

    if (/^\d+\./.test(line) && section === "presentation") {
      const text = line.replace(/^\d+\.\s*/, "");
      if (subsection === "infographicMustCommunicate") obj.presentation.infographicMustCommunicate.push(text);
      if (subsection === "promoCopyMustInclude") obj.presentation.promoCopyMustInclude.push(text);
      continue;
    }
  }

  return obj;
}

export function parseRequirementsFile(filePath) {
  const md = fs.readFileSync(filePath, "utf8");
  return parseRequirements(md);
}
