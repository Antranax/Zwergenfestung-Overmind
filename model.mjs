import {AREA_DEFAULTS,AREA_IDS,upgradeProject,canonicalArea} from './catalog.mjs';
export const STATUSES = Object.freeze({idea:'Idee',planned:'Geplant','in-development':'In Entwicklung',implemented:'Implementiert',tested:'Getestet',completed:'Abgeschlossen',blocked:'Blockiert'});
export const PRIORITIES = Object.freeze({high:'Hoch',normal:'Normal',low:'Niedrig'});
export const CATEGORIES = Object.freeze({...Object.fromEntries(AREA_DEFAULTS.map(a=>[a.id,a.title])),sonstiges:'Sonstiges',grafikgalerie:'Grafik & Atmosphäre (ältere Datei)'});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const text=(value,min,max,label)=>assert(typeof value==='string'&&value.trim().length>=min&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value),label+' ist ungültig.');
const keys=(value,allowed)=>{assert(value&&typeof value==='object'&&!Array.isArray(value),'Objekt erwartet.');assert(Object.keys(value).every(k=>allowed.includes(k)),'Unbekannte Datenfelder.');};
const id=value=>assert(typeof value==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(value),'Ungültige ID.');
export function validateProposal(value){
 keys(value,['schemaVersion','kind','id','title','description','category','displayName','createdAt','status']);
 assert(value.schemaVersion===1&&value.kind==='overmind-proposal','Keine unterstützte Vorschlagsdatei.');id(value.id);
 text(value.title,5,100,'Titel');text(value.description,20,3000,'Beschreibung');text(value.displayName,0,40,'Anzeigename');
 assert(Object.hasOwn(CATEGORIES,value.category),'Unbekannte Kategorie.');assert(value.status==='pending','Neue Vorschläge müssen ungeprüft sein.');
 assert(typeof value.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value.createdAt)&&Number.isFinite(Date.parse(value.createdAt)),'Ungültiges Erstellungsdatum.');
 return value;
}
export function makeProposal(form,now=new Date(),uuid=crypto.randomUUID()){
 return validateProposal({schemaVersion:1,kind:'overmind-proposal',id:uuid,title:form.title.trim(),description:form.description.trim(),category:form.category,displayName:form.displayName.trim(),createdAt:now.toISOString(),status:'pending'});
}
export function validateProject(data){
 data=upgradeProject(data);
 keys(data,['schemaVersion','project','areas','features','versions','gallery','community','privacy','ideas','orders']);assert(data.schemaVersion===2,'Unbekannte Projektversion.');
 keys(data.project,['name','gameVersion','asOf','tagline','description','engine','facts','focus','lastPublication','plannedUrl']);
 for(const name of ['name','tagline','description','engine'])text(data.project[name],1,500,name);
 assert(/^\d+\.\d+\.\d+$/.test(data.project.gameVersion),'Ungültige Spielversion.');assert(validDate(data.project.asOf),'Ungültiger Stand.');
 assert(Array.isArray(data.project.facts)&&data.project.facts.length<=10,'Ungültige Eckdaten.');
 for(const fact of data.project.facts){keys(fact,['label','value']);text(fact.label,1,60,'Kennzahl');assert(Number.isSafeInteger(fact.value)&&fact.value>=0,'Keine erfundenen Prozentangaben.');}
 assert(Array.isArray(data.areas)&&data.areas.length===10,'Zehn öffentliche Entwicklungsbereiche erwartet.');
 assert(data.project.lastPublication===null||validDate(data.project.lastPublication),'Ungültiges Veröffentlichungsdatum.');
 assert(data.project.plannedUrl==='https://antranax.github.io/Zwergenfestung-Overmind/','Unbekannte geplante Websiteadresse.');
 const areas=new Set();for(const area of data.areas){keys(area,['id','title','headline','description','icon','problems','orders']);id(area.id);assert(AREA_IDS.includes(area.id)&&!areas.has(area.id),'Ungültiger Bereich.');areas.add(area.id);for(const name of ['title','headline','description','icon'])text(area[name],1,500,name);assert(Array.isArray(area.problems)&&area.problems.length<=20,'Ungültige Problemliste.');for(const note of area.problems)text(note,1,1000,'Problem');assert(Array.isArray(area.orders)&&area.orders.length<=30,'Ungültige Auftragsliste.');}
 assert(Array.isArray(data.features)&&data.features.length<=200,'Ungültige Funktionsliste.');const ids=new Set();
 for(const feature of data.features){keys(feature,['id','area','title','status','summary','details','priority','version','updatedAt','pullRequest']);id(feature.id);assert(!ids.has(feature.id),'Doppelte Funktions-ID.');ids.add(feature.id);assert(areas.has(feature.area),'Unbekannter Bereich.');text(feature.title,1,100,'Funktion');text(feature.summary,1,500,'Zusammenfassung');assert(Object.hasOwn(STATUSES,feature.status)&&Object.hasOwn(PRIORITIES,feature.priority),'Ungültiger Status oder Priorität.');assert(feature.version===null||/^\d+\.\d+\.\d+$/.test(feature.version),'Ungültige Funktionsversion.');assert(Array.isArray(feature.details)&&feature.details.length<=12,'Ungültige Details.');for(const detail of feature.details)text(detail,1,1000,'Detail');validateMetadata(feature);}
 validateIdeas(data.ideas,areas);
 assert(Array.isArray(data.orders)&&data.orders.length<=60,'Ungültige Codex-Aufträge.');const orderIds=new Set();for(const order of data.orders){keys(order,['id','title','status','version','updatedAt','pullRequest']);id(order.id);assert(!orderIds.has(order.id),'Doppelter Auftrag.');orderIds.add(order.id);text(order.title,1,150,'Auftrag');assert(Object.hasOwn(STATUSES,order.status),'Ungültiger Auftragsstatus.');validateMetadata(order);}
 for(const area of data.areas)assert(area.orders.every(id=>orderIds.has(id)),'Auftragsreferenz fehlt.');
 assert(ids.has(data.project.focus),'Fokus fehlt.');assert(Array.isArray(data.versions)&&data.versions.length<=60,'Ungültige Historie.');
 for(const entry of data.versions){keys(entry,['version','title','summary','changes']);assert(/^\d+\.\d+\.\d+$/.test(entry.version),'Ungültige Versionsnummer.');text(entry.title,1,100,'Versionstitel');text(entry.summary,1,500,'Versionsbeschreibung');assert(Array.isArray(entry.changes)&&entry.changes.length<=12,'Ungültige Änderungen.');for(const change of entry.changes)text(change,1,600,'Änderung');}
 assert(Array.isArray(data.gallery)&&data.gallery.length<=60,'Ungültige Galerie.');const images=new Set();
 for(const entry of data.gallery){keys(entry,['id','title','caption','area','approved']);id(entry.id);assert(!images.has(entry.id),'Doppelte Bild-ID.');images.add(entry.id);text(entry.title,1,100,'Bildtitel');text(entry.caption,1,500,'Bildbeschreibung');assert(areas.has(entry.area)&&typeof entry.approved==='boolean','Ungültige Bildfreigabe.');}
 assert(Array.isArray(data.community)&&data.community.length<=200,'Ungültige öffentliche Ideenliste.');const ideas=new Set();
 for(const entry of data.community){keys(entry,['id','title','description','category','displayName','createdAt','status','approved','comment','priority','updatedAt']);id(entry.id);assert(!ideas.has(entry.id),'Doppelte Ideen-ID.');ideas.add(entry.id);assert(entry.approved===true,'Ungeprüfte Idee darf nicht öffentlich werden.');text(entry.title,5,100,'Ideentitel');text(entry.description,20,3000,'Idee');text(entry.displayName,0,40,'Name');text(entry.comment,0,1000,'Öffentlicher Kommentar');assert(Object.hasOwn(CATEGORIES,entry.category)&&Object.hasOwn(STATUSES,entry.status),'Ungültiger Ideenstatus.');assert(Number.isFinite(Date.parse(entry.createdAt)),'Ungültiges Datum.');assert(entry.priority==null||Object.hasOwn(PRIORITIES,entry.priority),'Ungültige Ideenpriorität.');validateMetadata(entry);}
 keys(data.privacy,['mode','message']);assert(data.privacy.mode==='local-file','Kein öffentlicher Einreichungsweg freigegeben.');text(data.privacy.message,1,500,'Datenschutzhinweis');
 return data;
}
export function searchFeatures(data,query='',status='all',area='all'){
 return filterEntries(data.features,query,status,area);
}
export function filterEntries(entries,query='',status='all',area='all',priority='all'){
 const words=query.toLocaleLowerCase('de').trim().split(/\s+/).filter(Boolean);
 return entries.filter(f=>(priority==='all'||f.priority===priority)&&(status==='all'||f.status===status)&&(area==='all'||f.area===area)&&words.every(word=>[f.title,f.summary,...f.details].join(' ').toLocaleLowerCase('de').includes(word)));
}
export function counts(data){return Object.fromEntries(Object.keys(STATUSES).map(status=>[status,data.features.filter(f=>f.status===status).length]));}
export function downloadJson(value,name){const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function h(tag,attrs={},...children){const node=document.createElement(tag);for(const [key,value]of Object.entries(attrs)){if(key==='class')node.className=value;else if(key==='text')node.textContent=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2),value);else if(value!==false&&value!=null)node.setAttribute(key,value===true?'':String(value));}for(const child of children.flat(Infinity)){if(child!=null)node.append(child instanceof Node?child:document.createTextNode(String(child)));}return node;}

export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function safePullRequest(value){if(value==null)return true;try{const url=new URL(value);return url.origin==='https://github.com'&&!url.username&&!url.password&&!url.search&&!url.hash&&/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*$/.test(url.pathname);}catch{return false;}}
function validateMetadata(item){assert(item.updatedAt==null||validDate(item.updatedAt),'Ungültige letzte Aktualisierung.');assert(safePullRequest(item.pullRequest),'Nur sichere GitHub-PR-Links erlaubt.');assert(item.version==null||/^\d+\.\d+\.\d+$/.test(item.version),'Ungültige Bezugs-/Zielversion.');}
function validateIdeas(ideas,areas){assert(Array.isArray(ideas)&&ideas.length<=200,'Ungültige Ideensammlung.');const seen=new Set();for(const idea of ideas){keys(idea,['id','area','title','status','summary','details','priority','version','updatedAt','pullRequest']);id(idea.id);assert(!seen.has(idea.id),'Doppelte Ideen-ID.');seen.add(idea.id);assert(areas.has(idea.area),'Unbekannter Ideenbereich.');text(idea.title,5,100,'Ideentitel');text(idea.summary,20,500,'Ideenbeschreibung');assert(Object.hasOwn(STATUSES,idea.status)&&Object.hasOwn(PRIORITIES,idea.priority),'Ungültiger Ideenstatus.');assert(Array.isArray(idea.details)&&idea.details.length<=12,'Ungültige Ideendetails.');for(const detail of idea.details)text(detail,1,1000,'Ideendetail');validateMetadata(idea);}}
