// Roles for the character select — one example career per Bereich from bundeswehrkarriere.de.
// Stats are illustrative profile values for the concept (1–5).
// image = cut-out character (replaces the stand-in figure); props = which placeholder pieces the stand-in figure wears (see stage.js).

export const STAT_LABELS = ["Technik", "Teamgeist", "Draußen", "Verantwortung"];

export const ROLES = [
  {
    bereich: "Technik", role: "Kfz-Mechatroniker/in", image: "/characters/technik.webp", props: ["toolbox"],
    desc: "Du hältst Fahrzeuge vom Wolf bis zum Boxer am Laufen — Diagnose, Reparatur, Wartung.",
    stats: [5, 3, 3, 3], loadout: ["Werkzeugkoffer", "Diagnose-Tablet", "Schutzbrille"], entry: ["Ausbildung", "Quereinstieg"],
  },
  {
    bereich: "IT", role: "IT-Spezialist/in Cyber", image: "/characters/it.webp", props: ["tablet", "headset"],
    desc: "Netze, Server, Cyberabwehr. Du schützt Systeme, auf die sich ein ganzes Land verlässt.",
    stats: [5, 3, 1, 4], loadout: ["Laptop", "Netzwerk-Kit", "Headset"], entry: ["Ausbildung", "Studium", "Quereinstieg"],
  },
  {
    bereich: "Sanität", role: "Notfallsanitäter/in", image: "/characters/sanitaet.webp", props: ["medpack"],
    desc: "Erste Hilfe, Rettung, Versorgung — für Menschen, die sich auf dich verlassen.",
    stats: [3, 4, 3, 5], loadout: ["Sanitätsrucksack", "Defibrillator", "Funkgerät"], entry: ["Ausbildung", "Quereinstieg"],
  },
  {
    bereich: "Zivil", role: "Verwaltungsfachkraft", image: "/characters/zivil.webp", props: ["folder"],
    desc: "Personal, Haushalt, Beschaffung — Karriere bei der Bundeswehr, ganz ohne Uniform.",
    stats: [2, 3, 1, 3], loadout: ["Laptop", "Projektmappe", "Dienstausweis"], entry: ["Ausbildung", "Studium"],
  },
  {
    bereich: "Land", role: "Soldat/in Heer", image: "/characters/land.webp", props: ["helmet", "backpack"],
    desc: "Draußen, im Team, im Gelände. Jeder Tag fordert dich anders — körperlich und mental.",
    stats: [2, 5, 5, 4], loadout: ["Rucksack", "Kompass", "Funkgerät"], entry: ["Ausbildung", "Wehrdienst"],
  },
  {
    bereich: "Luft", role: "Pilot/in", image: "/characters/luft.webp", props: ["flighthelmet"],
    desc: "Jet, Hubschrauber oder Transporter — dein Arbeitsplatz ist der Himmel über Europa.",
    stats: [5, 4, 3, 5], loadout: ["Fliegerhelm", "Checkliste", "Navigations-Tablet"], entry: ["Studium", "Offizierlaufbahn"],
  },
  {
    bereich: "See", role: "Bootsmann / Bootsfrau", image: "/characters/see.webp", props: ["cap", "binoculars"],
    desc: "An Bord: Navigation, Technik und Einsätze auf Nord- und Ostsee und weltweit.",
    stats: [4, 5, 4, 4], loadout: ["Rettungsweste", "Fernglas", "Funkgerät"], entry: ["Ausbildung", "Quereinstieg"],
  },
  {
    bereich: "Spezialkräfte", role: "Kampfschwimmer/in", image: "/characters/spezialkraefte.webp", props: ["helmet", "backpack"],
    desc: "Höchste Anforderungen, kleinste Teams. Nur für die, die mehr wollen als den Standard.",
    stats: [4, 5, 5, 5], loadout: ["Tauchausrüstung", "Nachtsichtgerät", "Kompass"], entry: ["Auswahlverfahren"],
  },
  {
    bereich: "Führung", role: "Offizier/in", image: "/characters/fuehrung.webp", props: ["cap", "tablet"],
    desc: "Du übernimmst Verantwortung für Menschen — mit Studium an einer Bundeswehr-Universität.",
    stats: [3, 4, 3, 5], loadout: ["Lagekarte", "Tablet", "Dein Team"], entry: ["Studium", "Offizierlaufbahn"],
  },
  {
    bereich: "Logistik", role: "Logistiker/in", image: "/characters/logistik.webp", props: ["scanner", "toolbox"],
    desc: "Alles am richtigen Ort, zur richtigen Zeit. Ohne dich bewegt sich nichts.",
    stats: [3, 4, 3, 4], loadout: ["Scanner", "Frachtpapiere", "Lkw-Führerschein"], entry: ["Ausbildung", "Quereinstieg"],
  },
];
