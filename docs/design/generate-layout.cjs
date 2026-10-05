const fs = require('node:fs');
const assert = require('node:assert/strict');
const elements = [];
const C = { ink:'#263445', muted:'#667588', line:'#cbd3dc', panel:'#f3f5f8', white:'#ffffff', blue:'#e7f0ff', blueInk:'#24569b', green:'#e5f3ec', greenInk:'#27634d', red:'#fbe9e8', redInk:'#a03f3b', amber:'#fff4d6' };
function base(type,x,y,width,height,extra={}) {
  const n=elements.length+1;
  const e={id:`layout-${n}`,type,x,y,width,height,angle:0,strokeColor:C.line,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0.5,opacity:100,groupIds:[],frameId:null,roundness:null,seed:n*7919,version:1,versionNonce:n*3571,isDeleted:false,boundElements:null,updated:1,link:null,locked:false,...extra};
  elements.push(e); return e;
}
function box(x,y,w,h,fill=C.white,stroke=C.line) {return base('rectangle',x,y,w,h,{backgroundColor:fill,strokeColor:stroke});}
function text(x,y,s,size=18,color=C.ink,group=null) {
  const lines=s.split('\n');
  return base('text',x,y,Math.max(...lines.map(l=>l.length))*size*0.55,lines.length*size*1.25,{text:s,originalText:s,fontSize:size,fontFamily:5,textAlign:'left',verticalAlign:'top',containerId:null,autoResize:true,lineHeight:1.25,strokeColor:color,groupIds:group?[group]:[]});
}
function line(x,y,w,h=0) {return base('line',x,y,w,h,{points:[[0,0],[w,h]],startBinding:null,endBinding:null,startArrowhead:null,endArrowhead:null});}
function button(x,y,w,label,fill=C.white,color=C.ink,h=34) {
  const group=`control-${elements.length}`;
  const r=box(x,y,w,h,fill);r.roundness={type:3};r.groupIds=[group];
  const t=text(x+8,y+(h-20)/2,label,16,color,group);
  assert(t.width<=w-12,`Button too narrow: ${label}`);
}
function heading(x,y,title,subtitle) {text(x,y,title,28);text(x,y+42,subtitle,18,C.muted);}
function check(x,y,on=false) {box(x,y,18,18,on?C.blue:C.white,on?C.blueInk:C.line);if(on)text(x+3,y-1,'x',16,C.blueInk);}
function note(x,y,w,title,body,fill=C.panel) {box(x,y,w,122,fill);text(x+18,y+15,title,20);text(x+18,y+48,body,17,C.muted);}

heading(60,30,'Mado Mail / desktop layout draft','Rust + GPUI   |   Existing triage layout   |   Synthetic messages   |   Light wireframe, not a theme decision');
text(60,130,'01  Inbox and staging',24);
text(1790,130,'02  Message reader / separate window',24);

// Main window. The staging rail stays at the right, as in the existing app.
box(60,180,1640,810);
box(60,180,1640,42,C.panel);
text(78,190,'Mado Mail',18);text(1480,191,'Min   Max   Close',16,C.muted);
box(60,222,1640,64,C.panel);
button(76,236,174,'Filter messages...',C.white,C.muted);
button(260,236,110,'Run query');
button(380,236,74,'Rules');
button(464,236,92,'Refresh');
text(570,242,'6 senders / 32 undecided',16,C.muted);
text(825,242,'8 selected',16,C.blueInk);
button(944,236,90,'Archive',C.green,C.greenInk);
button(1044,236,82,'Delete',C.red,C.redInk);
button(1136,236,68,'Clear');
check(1370,243);text(1399,242,'Auto-apply',16,C.muted);
button(1544,236,138,'Theme: Light');

box(60,286,1240,42,C.panel);
text(158,297,'FROM',16,C.muted);text(440,297,'SUBJECT',16,C.muted);
text(850,297,'DATE',16,C.muted);text(993,297,'THIS / ALWAYS',16,C.muted);
function row(y,{sender='',subject='',date='Today',count='',selected=false,expanded=false,child=false,actions=false}) {
  box(60,y,1240,58,selected?C.blue:child?C.white:C.panel);
  if(!expanded)check(80,y+20,selected);
  if(count || expanded)text(116,y+16,expanded?'v':'>',18,C.muted);
  text(158,y+16,child?'    message':sender,18,child?C.muted:C.ink);
  if(count)text(365,y+18,count,16,C.muted);
  text(440,y+17,subject,16,expanded?C.muted:C.ink);
  if(child)button(752,y+12,62,'Open',C.white,C.blueInk);
  text(847,y+18,date,16,C.muted);
  if(actions){
    button(985,y+12,34,'A',C.green,C.greenInk);
    button(1025,y+12,34,'D',C.red,C.redInk);
    if(!child){button(1069,y+12,98,'Always A');button(1177,y+12,98,'Always D');}
  }
}
row(328,{sender:'Studio updates',count:'12',subject:'12 messages / Weekly notes'});
row(386,{sender:'Build service',count:'8',subject:'8 messages / Build completed',selected:true,actions:true});
row(444,{sender:'Calendar',count:'4',subject:'4 messages / Event reminder'});
row(502,{sender:'Ada Chen',count:'3',subject:'Expanded / select messages below',expanded:true,date:''});
row(560,{child:true,subject:'Review notes',date:'10:30',actions:true});
row(618,{child:true,subject:'Updated schedule',date:'Yesterday'});
row(676,{child:true,subject:'Project handover',date:'Mon'});
row(734,{sender:'Reports',count:'3',subject:'3 messages / Monthly summary'});
row(792,{sender:'Travel',count:'2',subject:'2 messages / Itinerary update'});
text(83,878,'Grouped by sender / largest groups first',17,C.muted);
text(83,906,'A = Archive     D = Delete     Row actions appear on hover or keyboard focus',16,C.muted);
box(60,948,1240,42,C.panel);
text(80,961,'Left: select     Right: range     Middle: fill / clear',16,C.muted);
text(858,961,'50 loaded / 400-message cap',16,C.muted);

box(1300,286,400,662,C.panel);
text(1320,301,'STAGING / 18 pending',18);
button(1567,295,116,'Empty both',C.white,C.muted);
box(1300,344,400,42,C.green);
text(1320,355,'TO ARCHIVE',18,C.greenInk);text(1648,355,'12',18,C.greenInk);
function staged(y,name,n,rule,fill,color,barWidth) {
  box(1318,y+12,barWidth,12,fill,fill);
  text(1378,y+7,name,17);text(1515,y+8,rule?'RULE':'',16,C.muted);
  text(1570,y+8,String(n),16);
  button(1600,y,84,'Put back',C.white,color);
}
staged(402,'Digest',9,true,C.greenInk,C.greenInk,44);
staged(450,'Receipts',3,false,C.greenInk,C.greenInk,16);
text(1320,524,'Hover to peek / click to pin',17,C.muted);
text(1320,553,'Put back removes a pending mark.',16,C.muted);
box(1300,618,400,42,C.red);
text(1320,629,'TO DELETE',18,C.redInk);text(1656,629,'6',18,C.redInk);
staged(680,'Offers',6,true,C.redInk,C.redInk,32);
text(1320,748,'Delete moves messages to Trash.',16,C.muted);
text(1320,776,'Unread status is preserved.',16,C.muted);
text(1320,855,'Nothing submitted yet.',18,C.muted);
text(1320,886,'Auto-apply is off in this example.',16,C.muted);
box(1300,948,400,42,C.green);
text(1320,961,'Apply / 12 Archive, 6 Delete',18,C.greenInk);

// Reader retains its own window rather than taking space from the triage table.
box(1790,180,740,810);
box(1790,180,740,42,C.panel);
text(1808,190,'Mado Mail / reader',18);text(2310,191,'Min   Max   Close',16,C.muted);
text(1816,248,'Review notes',28);
text(1816,296,'Ada Chen <ada@example.test>',18);
text(1816,331,'To: me@example.test     Today, 10:30',17,C.muted);
text(1816,368,'Read-only preview / does not mark as read',17,C.muted);
box(1790,410,740,62,C.amber);
text(1814,429,'Remote images blocked for this message',17);
button(2358,423,154,'Allow images',C.white,C.ink);
box(1812,492,690,466,C.white);
text(1838,516,'Project review',28);
text(1838,569,'Hi,\n\nHere are the notes for our next review.\nThe revised schedule is included below.',20);
box(1838,695,610,106,C.blue,C.blueInk);
text(1870,717,'Embedded image',23,C.blueInk);
text(1870,757,'Rendered with the message',17,C.blueInk);
text(1838,829,'Friday / 10:00\nPlease review the updated timeline.',19);
line(2490,503,0,438);box(2486,520,8,148,C.line,C.line);
text(1816,967,'HTML body scrolls independently',16,C.muted);

// Rules is another view in the main window, not an additional sidebar.
heading(60,1070,'03  Rules view','Replaces the Inbox and staging area. Main toolbar stays; Rules becomes Inbox.');
box(60,1160,1000,398);
box(60,1160,1000,58,C.panel);
button(78,1172,310,'Filter sender rules...',C.white,C.muted);
button(940,1172,100,'Inbox');
box(60,1218,1000,42,C.panel);
text(82,1228,'FROM MATCH',16,C.muted);text(615,1228,'MARK',16,C.muted);text(829,1228,'ACTION',16,C.muted);
const rules=[['digest@example.test','Archive'],['offers@example.test','Delete'],['receipts@example.test','Archive']];
rules.forEach(([match,action],i)=>{
 const y=1260+i*62;line(60,y+62,1000);text(82,y+20,match,18);
 text(615,y+20,action,18,action==='Archive'?C.greenInk:C.redInk);
 button(830,y+14,80,'Edit');button(926,y+14,110,'Drop rule',C.white,C.redInk);
});
text(82,1470,'Always A / Always D saves a sender rule and acts on that sender.',18,C.muted);
text(82,1510,'Edit opens: From match / Archive or Delete / Cancel / Save.',18,C.muted);

heading(1130,1070,'Interaction notes','Existing behavior stays unless a proposal is explicitly marked.');
note(1130,1160,660,'Selection and opening a message','Keep all three mouse selection gestures.\nProposal: Open on individual rows, plus a keyboard action.\nExpand a sender before opening one of its messages.');
note(1820,1160,710,'Review before applying','Marks stay local until Apply when auto-apply is off.\nAuto-apply on submits row actions immediately.\nPut back / Empty both cannot undo a Gmail operation.');
note(1130,1304,660,'Rules and preferences','Keep rule order, first-match behavior, and saved preferences.\nRun query fetches Inbox and stages matching sender rules.\nAll controls need keyboard access and visible focus.');
note(1820,1304,710,'Write status / proposed feedback placement','Show progress or errors beneath the toolbar when needed.\nKeep failed and unknown results visible, not marked done.\nReconcile unknown outcomes before offering a retry.',C.amber);
text(1130,1460,'Scope: Inbox triage, rules, preferences, read-only previews.',19);
text(1130,1500,'No compose, reply, forward, attachment browser, or mailbox sidebar.',18,C.muted);
text(60,1620,'Draft for layout discussion. Counts and messages are synthetic; controls are editable Excalidraw shapes and text.',18,C.muted);

const file={type:'excalidraw',version:2,source:'https://excalidraw.com',elements,appState:{viewBackgroundColor:'#ffffff',gridSize:null},files:{}};
assert.equal(new Set(elements.map(e=>e.id)).size,elements.length);
for(const e of elements){assert(e.width>=0 && e.height>=0);assert(Number.isFinite(e.x)&&Number.isFinite(e.y));if(e.type==='text'){assert.equal(e.fontFamily,5);assert(e.fontSize>=16);}}
fs.mkdirSync('docs/design',{recursive:true});
const path='docs/design/mado-mail-layout.excalidraw';
fs.writeFileSync(path,JSON.stringify(file,null,2)+'\n');
assert.equal(JSON.parse(fs.readFileSync(path)).elements.length,elements.length);
console.log(`${path}: ${elements.length} editable elements; JSON, IDs, dimensions and text checks passed.`);
