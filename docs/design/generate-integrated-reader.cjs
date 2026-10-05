const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = [];
const C = { ink:'#263445', muted:'#667588', line:'#cbd3dc', panel:'#f3f5f8', white:'#ffffff', blue:'#e7f0ff', blueInk:'#24569b', green:'#e5f3ec', greenInk:'#27634d', red:'#fbe9e8', redInk:'#a03f3b', amber:'#fff4d6' };
function base(type,x,y,width,height,extra={}) {
  const n=elements.length+1;
  const e={id:`integrated-${n}`,type,x,y,width,height,angle:0,strokeColor:C.line,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0.5,opacity:100,groupIds:[],frameId:null,roundness:null,seed:n*7919,version:1,versionNonce:n*3571,isDeleted:false,boundElements:null,updated:1,link:null,locked:false,...extra};
  elements.push(e); return e;
}
function box(x,y,w,h,fill=C.white,stroke=C.line) {return base('rectangle',x,y,w,h,{backgroundColor:fill,strokeColor:stroke});}
function text(x,y,s,size=18,color=C.ink) {
  const lines=s.split('\n');
  // ponytail: conservative text estimates, not font shaping. Use Excalidraw font metrics for pixel-exact exports.
  return base('text',x,y,Math.max(...lines.map(l=>l.length))*size*0.6,lines.length*size*1.25,{text:s,originalText:s,fontSize:size,fontFamily:5,textAlign:'left',verticalAlign:'top',containerId:null,autoResize:true,lineHeight:1.25,strokeColor:color});
}
function label(x,y,w,h,s,size=18,color=C.ink) {
  const e=text(x,y,s,size,color);
  assert(e.width<=w,`Text too wide: ${s}`);assert(e.height<=h,`Text too tall: ${s}`);return e;
}
function button(x,y,w,s,fill=C.white,color=C.ink) {
  const group=`control-${elements.length}`;
  const r=box(x,y,w,34,fill);r.roundness={type:3};r.groupIds=[group];
  const t=label(x+10,y+7,w-20,22,s,16,color);t.groupIds=[group];
}
function check(x,y,on=false,mixed=false) {
  box(x,y,18,18,on||mixed?C.greenInk:C.white);
  if(on||mixed)text(x+3,y-1,mixed?'-':'x',16,C.white);
}
function dockToggle(x,y,pane,on) {
  const start=elements.length, color=on?C.blueInk:C.muted;
  const control=box(x,y,pane==='reader'?42:58,32,on?C.blue:C.white);
  control.customData={role:'dock-toggle',pane,active:on,tooltip:`${on?'Hide':'Show'} ${pane}`};
  if(pane==='reader'){
    box(x+13,y+7,16,18,C.white,color);
    box(x+16,y+11,10,2,color,color);box(x+16,y+16,10,2,color,color);
  }else{
    box(x+9,y+7,18,7,C.white,color);box(x+9,y+18,18,7,C.white,color);
    box(x+34,y+7,18,18,C.green);text(x+38,y+6,'3',16,C.greenInk);
  }
  for(const e of elements.slice(start))e.groupIds=[`dock-${control.id}`];
}
function section(x,y,title,subtitle) {text(x,y,title,26);text(x,y+38,subtitle,18,C.muted);}
function card(x,y,w,h,title,body,fill=C.panel) {
  box(x,y,w,h,fill);label(x+20,y+16,w-40,30,title,22);label(x+20,y+60,w-40,h-76,body,18,C.muted);
}

section(60,30,'Mado Mail / integrated reader proposal','Separate design draft. Original reference unchanged. Synthetic mail. No application changes.');
text(60,130,'01  List + collapsible reader + collapsible staging',26);
box(60,180,1960,772);
box(60,180,1960,42,C.panel);text(80,191,'Mado Mail',18);text(1790,192,'Min   Max   Close',16,C.muted);
box(60,222,1960,64,C.panel);
button(80,237,220,'Filter messages...',C.white,C.muted);
button(314,237,110,'Run query');button(438,237,80,'Rules');button(532,237,96,'Refresh');
text(660,245,'2 checked',18,C.greenInk);
button(786,237,116,'Archive 2',C.green,C.greenInk);button(916,237,106,'Delete 2',C.red,C.redInk);button(1036,237,76,'Clear');
text(1570,245,'Auto-apply: off',18,C.muted);button(1810,237,188,'Theme: Light');
box(60,286,1960,44,C.panel);
text(80,298,'Preview preserves unread status. Pending actions stay local until Apply. Write progress and errors stay visible here.',18,C.muted);

// Row clicks read; only the checkbox gutter marks bulk targets. Row A/D is row-local.
box(60,330,940,44,C.panel);
text(160,343,'FROM',16,C.muted);text(340,343,'SUBJECT',16,C.muted);text(574,343,'DATE',16,C.muted);text(688,343,'THIS / ALWAYS',16,C.muted);
const rows=[
  {sender:'Studio updates',subject:'12 / Weekly notes',group:true,date:'Today'},
  {sender:'Ada Chen',subject:'3 messages',group:true,expanded:true,mixed:true,date:''},
  {subject:'Review notes',child:true,active:true,date:'10:30'},
  {subject:'Updated schedule',child:true,checked:true,date:'Yesterday'},
  {subject:'Project handover',child:true,checked:true,date:'Mon'},
  {sender:'Calendar',subject:'4 / Event reminders',group:true,date:'Today'},
  {sender:'Reports',subject:'Monthly summary',date:'Mon'},
  {sender:'Travel',subject:'Itinerary update',date:'Sun'}
];
rows.forEach((r,i)=>{
  const y=374+i*56;
  box(60,y,940,56,r.active?C.blue:C.white);
  if(r.checked||r.mixed)box(60,y,48,56,C.green);
  if(r.active)box(60,y,5,56,C.blueInk,C.blueInk);
  check(80,y+18,r.checked,r.mixed);
  if(r.group)text(116,y+15,r.expanded?'v':'>',18,C.muted);
  text(160,y+16,r.child?(r.active?'Reading':'message'):r.sender,18,r.active?C.blueInk:r.child?C.muted:C.ink);
  label(340,y+17,224,24,r.subject,16);text(574,y+18,r.date,16,C.muted);
  if(r.active||i===0){button(688,y+11,32,'A',C.green,C.greenInk);button(726,y+11,32,'D',C.red,C.redInk);}
  if(i===0){button(766,y+11,110,'Always A');button(882,y+11,110,'Always D');}
});
text(80,836,'Row actions on hover / focus. Always A / D saves a sender rule.',16,C.muted);
box(60,866,940,44,C.panel);text(80,879,'Row: read / expand     Checkbox gutter: mark for bulk actions',16,C.muted);

// Two independent splitters. Reader and staging are siblings, not tabs.
box(1000,330,8,580,C.panel);box(1002,582,4,72,C.line);
box(1008,330,608,580);
box(1008,330,608,44,C.blue);text(1028,342,'READER / 1 message',18,C.blueInk);
text(1032,397,'Review notes',28);text(1032,444,'Ada Chen <ada@example.test>',18);
text(1032,477,'To: me@example.test     Today, 10:30',16,C.muted);
text(1032,510,'Read-only preview / unread unchanged',16,C.muted);
box(1008,548,608,60,C.amber);text(1032,568,'Remote images blocked',18);button(1430,561,164,'Allow images');
text(1040,636,'Project review',24);
text(1040,683,'Hi,\n\nHere are the notes for our next review.\nPlease review the updated timeline.',18);
box(1040,796,536,46,C.panel);text(1056,809,'Message body scrolls independently',18,C.muted);
box(1596,624,6,224,C.panel);box(1596,637,6,76,C.line);
text(1032,875,'Hide keeps the message, scroll position and width.',16,C.muted);
box(1616,330,8,580,C.panel);box(1618,582,4,72,C.line);
box(1624,330,396,580,C.panel);
text(1644,345,'STAGING / 3 pending',18);button(1878,336,126,'Empty both');
box(1624,388,396,42,C.green);text(1644,400,'TO ARCHIVE / 2',18,C.greenInk);
text(1644,452,'Digest / 2',18);button(1890,442,114,'Put back');
text(1644,505,'Peek / pin keeps its current role.',16,C.muted);
text(1644,533,'It does not replace the reader.',16,C.muted);
box(1624,577,396,8,C.white);box(1786,580,72,2,C.line);
box(1624,592,396,42,C.red);text(1644,604,'TO DELETE / 1',18,C.redInk);
text(1644,657,'Offers / 1',18);button(1890,647,114,'Put back');
text(1644,754,'Delete moves messages to Trash.\nPut back cancels a pending action.\nUnread status stays unchanged.',16,C.muted);
button(1644,861,356,'Apply / 2 Archive, 1 Delete',C.green,C.greenInk);
box(60,910,1960,42,C.panel);
text(80,922,'Blue row = displayed message     Green checkbox gutter = bulk targets     Both can coexist',16,C.muted);
text(1680,922,'3 pending',16,C.muted);
dockToggle(1892,915,'reader',true);dockToggle(1948,915,'staging',true);
text(60,972,'Bottom-right dock icons: page = reader, stacked bins = staging. Blue = shown. Badge = pending count, even when hidden.',18,C.muted);

section(60,1010,'02  Independent visibility','Right-docked panes have bottom-right icons in pane order. Left-docked panes would have bottom-left icons.');
function state(x,title,reader,staging) {
  const y=1090,w=460;
  text(x,y,title,20);box(x,y+40,w,170);
  const listWidth=reader?(staging?164:236):(staging?316:460);
  box(x,y+40,listWidth,130);text(x+14,y+92,'Email list',18);
  if(reader){const rw=staging?152:224;box(x+listWidth,y+40,rw,130,C.blue);text(x+listWidth+14,y+92,'Reader',18,C.blueInk);}
  if(staging){box(x+w-144,y+40,144,130,C.green);text(x+w-130,y+92,'Staging',18,C.greenInk);}
  box(x,y+170,w,40,C.panel);
  dockToggle(x+w-128,y+174,'reader',reader);dockToggle(x+w-72,y+174,'staging',staging);
}
state(60,'A  Read and triage',true,true);state(560,'B  More room to read',true,false);
state(1060,'C  Triage only',false,true);state(1560,'D  List only',false,false);
text(60,1330,'Click a message to open its reader. Marking checkboxes never opens it. Icon tooltips say Show / Hide reader or staging.',18,C.muted);

section(60,1400,'03  Updated interaction contract','Focus for this iteration: click a message and read it inline. No Ctrl-based selection, range or fill / clear gestures.');
card(60,1480,950,312,'Reading and bulk selection',
  'Left-click a message row: display it and open the reader.\nReading never checks a message or clears existing checkmarks.\nOnly the checkbox gutter marks items for bulk actions.\nMessage checkbox: toggle that message, leave the reader alone.\nGroup checkbox: toggle its messages; mixed state shows a dash.\nMixed group click checks all; fully checked group click clears all.\nGroup body / chevron expands to expose individual messages.\nCheckboxes, chevrons and action buttons do not trigger reading.');
card(1040,1480,980,312,'Keyboard, visibility and message state',
  'Up / Down moves row focus. Enter reads or expands a group.\nSpace on a focused checkbox toggles it, not the row body.\nTab reaches dock icons and splitters; arrow keys resize.\nHide reader returns focus to the list; icons stay reachable.\nRules hides both panes; Inbox restores their visibility.\nLoading / error / empty states belong inside the reader.\nA later click wins over an older asynchronous message load.\nReading still preserves unread status; no change requested.');

section(60,1850,'04  Action scope, highlights and remembered widths','Updated decisions replace the earlier modifier-based selection proposal. Application implementation is separate.');
card(60,1930,620,270,'1  Keep action targets explicit',
  'Row A/D acts only on that row, never checked mail\nelsewhere. A group row acts on its own messages.\nToolbar Archive N / Delete N acts on checked mail.\nDisable bulk actions when nothing is checked.\nAlways A/D stays sender-wide and saves a rule.\nChecking alone never stages or applies an action.');
card(710,1930,620,270,'2  Displayed and checked can coexist',
  'Displayed: blue row, blue stripe, Reading label.\nChecked: green checkbox and green gutter.\nChecking the displayed message keeps its blue row\nand adds the checkbox state; it does not reopen.\nA partially checked group uses a dash.\nKeyboard focus is a separate thin outline.');
card(1360,1930,660,270,'3  Resize and remember',
  'Drag either divider to resize reader or staging.\nRemember each width independently across launches.\nHiding a pane never saves a zero width.\nRestore the last width on show; list takes the rest.\nClamp to usable sizes if the window is smaller,\nbut retain the saved preferred widths.');
card(60,2220,950,220,'4  A normal reader still needs explicit boundaries',
  'Normal email apps often mark previews read; this app currently does not.\nKeep the unread-preserving rule visible rather than changing it implicitly.\nIf the active message is staged or leaves the list, keep its preview with\nan explicit status, do not silently advance to an unrelated message.\nA staging hover / pin preview must not steal the active reader.');
card(1040,2220,980,220,'5  Integration is more than moving a window',
  'The current HTML reader uses a native WebView2 child in a separate window.\nEmbedding needs verified clipping, bounds, resize and keyboard focus.\nCollapse and Rules view must hide the native child, not just its GPUI frame.\nRestore the reader without refetching or losing scroll where possible.\nKeep remote images blocked and guard against stale asynchronous loads.');
text(60,2480,'Scope: layout and interaction proposal only. No compose, reply, automatic mark-as-read, or new detached-reader mode.',18,C.muted);

const file={type:'excalidraw',version:2,source:'https://excalidraw.com',elements,appState:{viewBackgroundColor:C.white,gridSize:null},files:{}};
assert.equal(new Set(elements.map(e=>e.id)).size,elements.length);
for(const e of elements){assert(e.width>=0&&e.height>=0);assert(Number.isFinite(e.x)&&Number.isFinite(e.y));if(e.type==='text'){assert.equal(e.fontFamily,5);assert(e.fontSize>=16);}}
const texts=elements.filter(e=>e.type==='text');
const toggles=elements.filter(e=>e.customData?.role==='dock-toggle');
assert.equal(toggles.length,10);
assert.equal(toggles.filter(e=>e.customData.pane==='reader').length,5);
assert.equal(toggles.filter(e=>e.customData.active).length,6);
assert(!texts.some(e=>e.text==='Collapse'||e.text.startsWith('Reader: ')));
assert(!texts.some(e=>/Ctrl \+|Ctrl-selection|Shift \+ Space/.test(e.text)));
for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
  const a=texts[i],b=texts[j];
  assert(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),`Overlapping text: ${a.text} / ${b.text}`);
}
const output=path.join(__dirname,'mado-mail-integrated-reader.excalidraw');
fs.writeFileSync(output,JSON.stringify(file,null,2)+'\n');
assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).elements.length,elements.length);
console.log(`${output}: ${elements.length} editable elements; JSON, IDs, dimensions, labels, text overlaps and visibility states checked.`);
