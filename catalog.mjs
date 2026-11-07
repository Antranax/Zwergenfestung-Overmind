// Stable public area IDs; titles may be edited without breaking existing links.
export const AREA_DEFAULTS=[
 ['spielwelt','Spielwelt & Geschichte','Hallen, die wir zurückerobern.','Geschichte, Festungsbereiche und die bestehenden Quests.','castle'],
 ['charaktere','Charaktere & Klassen','Drei Wege. Ein Erbe.','Spielbare Zwergenklassen und die Bewohner der Festung.','shield'],
 ['gegner','Gegner & KI','Die Besatzer der Festung.','Orks, Goblins und Untote mit eigenen Kampfverhalten.','skull'],
 ['kampf','Kampf & Fähigkeiten','Stahl, Bolzen und Runen.','Bestehendes Kampfsystem und klassenabhängige Fähigkeiten.','shield'],
 ['inventar','Inventar & Gegenstände','Was ein Zwerg bei sich trägt.','Beute, Gold, Inventarplätze und Ausrüstungswerte.','grid'],
 ['leveldesigner','Leveldesigner','Stein für Stein gebaut.','Dungeon-Baukasten, Blender-Generator und modulare Bauteile.','grid'],
 ['grafik','Grafik & Animationen','Die Form unserer Welt.','Modelle, Materialien, Animationen und gestalterische Grenzen.','image'],
 ['stadt','Zwergenstadt & Gebäude','Eine Stadt unter dem Berg.','Vorhandene Räume und ausdrücklich gekennzeichnete Zukunftsideen.','castle'],
 ['arena','Arena & Testsystem','Die Werkstatt der Kämpfer.','Getrennte Arena, Animationsinspektion und vorhandene Testwerkzeuge.','shield'],
 ['technik','Technik & Codex','Das Fundament hinter den Hallen.','Technische Entwicklung, Projektorganisation und Codex-Aufträge.','map']
].map(([id,title,headline,description,icon])=>({id,title,headline,description,icon,problems:[],orders:[]}));
export const AREA_IDS=AREA_DEFAULTS.map(a=>a.id);
export const canonicalArea=id=>id==='grafikgalerie'?'grafik':id;
export function upgradeProject(input){
 if(!input||input.schemaVersion!==1)return input;
 const data=structuredClone(input);data.schemaVersion=2;
 data.project.lastPublication??=null;data.project.plannedUrl??='https://antranax.github.io/Zwergenfestung-Overmind/';
 const previous=new Map((data.areas??[]).map(a=>[canonicalArea(a.id),a]));
 data.areas=AREA_DEFAULTS.map(a=>({...a,...(previous.get(a.id)??{}),id:a.id,problems:[],orders:[]}));
 for(const list of [data.features??[],data.gallery??[],data.community??[]])for(const entry of list){if(entry.area)entry.area=canonicalArea(entry.area);if(entry.category)entry.category=canonicalArea(entry.category);}
 data.ideas??=[];data.orders??=[];
 return data;
}
