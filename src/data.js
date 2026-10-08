// The 10 Bereiche from bundeswehrkarriere.de, presented like Marathon's runner select.
// Photos are the stage images from each Bereich page; focus = horizontal crop centre (0–1).
// Stats are illustrative profile values for the concept (1–5).

export const STAT_LABELS = ["Technik", "Teamgeist", "Draußen", "Verantwortung"];

// Bundeswehr palette: navy + gold, plus the olive/khaki from the camo header bar
export const THEMES = {
  navy: { paper: "#002437", ink: "#f9b600" },
  gold: { paper: "#f9b600", ink: "#002437" },
  olive: { paper: "#303a21", ink: "#d4d672" },
};

export const BEREICHE = [
  { name: "Technik", photo: "/photos/technik.jpg", focus: 0.42, theme: "navy", shape: "blocks", stats: [5, 3, 3, 3], desc: "Schrauben, warten, entwickeln — an Fahrzeugen, Flugzeugen und Schiffen." },
  { name: "IT", photo: "/photos/it.jpg", focus: 0.38, theme: "gold", shape: "blocks", stats: [5, 3, 1, 4], desc: "Netze, Cyber, Software. Du schützt Systeme, auf die sich ein ganzes Land verlässt." },
  { name: "Sanität", photo: "/photos/sanitaet.jpg", focus: 0.45, theme: "olive", shape: "dunes", stats: [3, 4, 2, 5], desc: "Medizin, Pflege, Rettung — für Menschen, die sich auf dich verlassen." },
  { name: "Zivil", photo: "/photos/zivil.jpg", focus: 0.8, theme: "navy", shape: "dunes", stats: [3, 3, 1, 3], desc: "Verwaltung, Ingenieurwesen, Beschaffung — Karriere ohne Uniform." },
  { name: "Land", photo: "/photos/land.jpg", focus: 0.5, theme: "olive", shape: "ridges", stats: [2, 5, 5, 4], desc: "Draußen, im Team, im Gelände. Jeder Tag fordert dich anders." },
  { name: "Luft", photo: "/photos/luft.jpg", focus: 0.5, theme: "gold", shape: "peaks", stats: [5, 4, 3, 4], desc: "Pilotin, Fluglotse, Technikerin — dein Arbeitsplatz ist der Himmel." },
  { name: "See", photo: "/photos/see.jpg", focus: 0.42, theme: "navy", shape: "waves", stats: [4, 5, 4, 4], desc: "An Bord: Navigation, Technik und Einsätze auf allen Meeren." },
  { name: "Spezialkräfte", photo: "/photos/spezialkraefte.jpg", focus: 0.45, theme: "olive", shape: "peaks", stats: [4, 5, 5, 5], desc: "Höchste Anforderungen. Kleinste Teams. Nur für die, die mehr wollen." },
  { name: "Führung", photo: "/photos/fuehrung.jpg", focus: 0.4, theme: "gold", shape: "ridges", stats: [2, 4, 3, 5], desc: "Verantwortung für Menschen übernehmen — als Offizierin oder Offizier." },
  { name: "Logistik", photo: "/photos/logistik.jpg", focus: 0.55, theme: "navy", shape: "blocks", stats: [3, 4, 3, 4], desc: "Alles am richtigen Ort, zur richtigen Zeit. Ohne dich bewegt sich nichts." },
];
