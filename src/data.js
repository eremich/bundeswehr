// Roles for the character select — one example career per Bereich from bundeswehrkarriere.de.
// Stats are illustrative profile values for the concept (1–5).
// image = cut-out character shown on the platform; path = career levels on the profile screen (illustrative).

export const STAT_LABELS = ["Technik", "Teamgeist", "Draußen", "Verantwortung"];

// Employer perks, taken from bundeswehrkarriere.de/entdecker/karriere-infos/benefits
const MILITARY = [
  { value: "0 €", label: "Sozialabgaben" },
  { value: "30", label: "Tage Urlaub im Jahr" },
  { value: "100 %", label: "Krankheitskosten übernommen" },
  { value: "0 €", label: "Bahnfahren in Uniform" },
  { value: "Sport", label: "in der Dienstzeit" },
  { value: "75 %", label: "Gehalt nach der Dienstzeit, bis zu 60 Monate" },
];
export const PERKS = {
  military: MILITARY,
  // officer and IT tracks study on full pay
  study: [{ value: "~2.200 €", label: "Grundgehalt im Studium" }, ...MILITARY.slice(0, 5)],
  civil: [
    { value: "30", label: "Tage Urlaub im Jahr" },
    { value: "Jobticket", label: "mit Zuschuss" },
    { value: "Homeoffice", label: "und Teilzeit möglich" },
    { value: "0 €", label: "Weiterbildung, in der Arbeitszeit" },
    { value: "Sport", label: "in der Dienstzeit" },
    { value: "Kita", label: "und Hilfe bei Pflege" },
  ],
};

export const ROLES = [
  {
    bereich: "Technik", role: "Kfz-Mechatroniker/in",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Ausbildung", text: "Kfz-Mechatroniker/in mit IHK-Abschluss." }, { title: "Im Verband", text: "Instandsetzung von Wolf bis Boxer." }, { title: "Aufstieg", text: "Meister/in — zivil anerkannt." }], perks: "military", image: "/characters/technik.webp",
    desc: "Du hältst Fahrzeuge vom Wolf bis zum Boxer am Laufen — Diagnose, Reparatur, Wartung.",
    stats: [5, 3, 3, 3], loadout: ["Werkzeugkoffer", "Diagnose-Tablet", "Schutzbrille"], entry: ["Ausbildung", "Quereinstieg"],
  },
  {
    bereich: "IT", role: "IT-Spezialist/in Cyber",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Ausbildung oder Studium", text: "Fachinformatik oder Informatik an der Uni der Bundeswehr." }, { title: "Cyber- und Informationsraum", text: "Netze betreiben und gegen Angriffe schützen." }, { title: "Aufstieg", text: "IT-Feldwebel oder Offizier/in." }], perks: "study", image: "/characters/it.webp",
    desc: "Netze, Server, Cyberabwehr. Du schützt Systeme, auf die sich ein ganzes Land verlässt.",
    stats: [5, 3, 1, 4], loadout: ["Laptop", "Netzwerk-Kit", "Headset"], entry: ["Ausbildung", "Studium", "Quereinstieg"],
  },
  {
    bereich: "Sanität", role: "Notfallsanitäter/in",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Ausbildung", text: "Notfallsanitäter/in mit staatlicher Prüfung." }, { title: "Im Einsatz", text: "Rettungsdienst im Sanitätsdienst." }, { title: "Aufstieg", text: "Weiterbildung und Führung im Team." }], perks: "military", image: "/characters/sanitaet.webp",
    desc: "Erste Hilfe, Rettung, Versorgung — für Menschen, die sich auf dich verlassen.",
    stats: [3, 4, 3, 5], loadout: ["Sanitätsrucksack", "Defibrillator", "Funkgerät"], entry: ["Ausbildung", "Quereinstieg"],
  },
  {
    bereich: "Zivil", role: "Verwaltungsfachkraft",
    path: [{ title: "Einstieg", text: "Ausbildung oder duales Studium in der Verwaltung." }, { title: "Fachbereich", text: "Personal, Haushalt oder Beschaffung." }, { title: "Verantwortung", text: "Eigene Projekte und Budgets." }, { title: "Aufstieg", text: "Laufbahn als Beamtin oder Beamter." }], perks: "civil", image: "/characters/zivil.webp",
    desc: "Personal, Haushalt, Beschaffung — Karriere bei der Bundeswehr, ganz ohne Uniform.",
    stats: [2, 3, 1, 3], loadout: ["Laptop", "Projektmappe", "Dienstausweis"], entry: ["Ausbildung", "Studium"],
  },
  {
    bereich: "Land", role: "Soldat/in Heer",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Spezialisierung", text: "Deine Fachausbildung in der Truppengattung." }, { title: "In der Einheit", text: "Übungen im Gelände, im Team." }, { title: "Aufstieg", text: "Unteroffizier/in oder Feldwebel." }], perks: "military", image: "/characters/land.webp",
    desc: "Draußen, im Team, im Gelände. Jeder Tag fordert dich anders — körperlich und mental.",
    stats: [2, 5, 5, 4], loadout: ["Rucksack", "Kompass", "Funkgerät"], entry: ["Ausbildung", "Wehrdienst"],
  },
  {
    bereich: "Luft", role: "Pilot/in",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Offizierlaufbahn", text: "Studium an der Uni der Bundeswehr." }, { title: "Flugausbildung", text: "Vom Simulator ins Cockpit." }, { title: "Im Geschwader", text: "Pilot/in auf Jet, Hubschrauber oder Transporter." }], perks: "study", image: "/characters/luft.webp",
    desc: "Jet, Hubschrauber oder Transporter — dein Arbeitsplatz ist der Himmel über Europa.",
    stats: [5, 4, 3, 5], loadout: ["Fliegerhelm", "Checkliste", "Navigations-Tablet"], entry: ["Studium", "Offizierlaufbahn"],
  },
  {
    bereich: "See", role: "Bootsmann / Bootsfrau",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Marine." }, { title: "Fachausbildung", text: "Navigation, Technik, Seemannschaft." }, { title: "Auf See", text: "Fahrt mit der Crew auf Nord- und Ostsee." }, { title: "Aufstieg", text: "Feldwebellaufbahn der Marine." }], perks: "military", image: "/characters/see.webp",
    desc: "An Bord: Navigation, Technik und Einsätze auf Nord- und Ostsee und weltweit.",
    stats: [4, 5, 4, 4], loadout: ["Rettungsweste", "Fernglas", "Funkgerät"], entry: ["Ausbildung", "Quereinstieg"],
  },
  {
    bereich: "Spezialkräfte", role: "Kampfschwimmer/in",
    path: [{ title: "Auswahlverfahren", text: "Körperlich und mental an die Grenze." }, { title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Kampfschwimmerausbildung", text: "Tauchen, Fallschirm, Nahkampf." }, { title: "Spezialkräfte Marine", text: "Kleinste Teams, höchste Verantwortung." }], perks: "military", image: "/characters/spezialkraefte.webp",
    desc: "Höchste Anforderungen, kleinste Teams. Nur für die, die mehr wollen als den Standard.",
    stats: [4, 5, 5, 5], loadout: ["Tauchausrüstung", "Nachtsichtgerät", "Kompass"], entry: ["Auswahlverfahren"],
  },
  {
    bereich: "Führung", role: "Offizier/in",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Offizierlehrgang", text: "Führen lernen — von Anfang an." }, { title: "Studium", text: "Bachelor und Master an der Uni der Bundeswehr." }, { title: "Führung", text: "Verantwortung für dein eigenes Team." }], perks: "study", image: "/characters/fuehrung.webp",
    desc: "Du übernimmst Verantwortung für Menschen — mit Studium an einer Bundeswehr-Universität.",
    stats: [3, 4, 3, 5], loadout: ["Lagekarte", "Tablet", "Dein Team"], entry: ["Studium", "Offizierlaufbahn"],
  },
  {
    bereich: "Logistik", role: "Logistiker/in",
    path: [{ title: "Grundausbildung", text: "Fit werden, Teamgeist, Basics der Truppe." }, { title: "Ausbildung", text: "Fachkraft für Lagerlogistik oder Berufskraftfahrer/in." }, { title: "Im Verband", text: "Material und Fahrzeuge dahin, wo sie gebraucht werden." }, { title: "Aufstieg", text: "Feldwebel oder Meister/in." }], perks: "military", image: "/characters/logistik.webp",
    desc: "Alles am richtigen Ort, zur richtigen Zeit. Ohne dich bewegt sich nichts.",
    stats: [3, 4, 3, 4], loadout: ["Scanner", "Frachtpapiere", "Lkw-Führerschein"], entry: ["Ausbildung", "Quereinstieg"],
  },
];
