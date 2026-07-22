(function(){
var API='https://srsc-backend.onrender.com';
var TOKEN_KEY='srsc_token';
var USER_KEY='srsc_user';
function saveAuth(token,user){
try{
if(token)sessionStorage.setItem(TOKEN_KEY,token);
if(user)sessionStorage.setItem(USER_KEY,JSON.stringify(user));
}catch(e){}
}
function getToken(){
try{return sessionStorage.getItem(TOKEN_KEY);}catch(e){return null;}
}
function getUser(){
try{var u=sessionStorage.getItem(USER_KEY);return u?JSON.parse(u):null;}catch(e){return null;}
}
function hasAccess(){
var u=getUser();
return !!(u&&(u.role==='admin'||u.role==='field_tech'));
}
var _origFetch=window.fetch;
window.fetch=function(input,init){
var url=typeof input==='string'?input:(input&&input.url)||'';
return _origFetch.apply(this,arguments).then(function(res){
try{
if(url.indexOf('/api/auth/login')!==-1&&res && res.ok){
res.clone().json().then(function(data){
if(data&&data.token){
saveAuth(data.token,data.user);
renderFab();
}
}).catch(function(e){});
}
}catch(e){}
return res;
});
};
function authFetch(path){
var t=getToken();
return fetch(API+path,{headers:t?{'Authorization':'Bearer '+t}:{}}).then(function(r){
return r.json().then(function(j){
if(!r.ok){var msg=(j&&j.error)?j.error:('HTTP '+r.status);throw new Error(msg);}
return j;
});
});
}
function el(tag,attrs,html){
var e=document.createElement(tag);
if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]);
if(html!==undefined)e.innerHTML=html;
return e;
}
var overlay=null;
function closeOverlay(){
if(overlay&&overlay.parentNode){overlay.parentNode.removeChild(overlay);}
overlay=null;
}
function openOverlay(title,bodyHtml){
closeOverlay();
overlay=el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;'});
var panel=el('div',{style:'background:#fff;border-radius:8px;max-width:600px;width:90%;max-height:80vh;overflow:auto;padding:24px;position:relative;font-family:sans-serif;'});
var closeBtn=el('button',{style:'position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;'},'\u00D7');
closeBtn.addEventListener('click',closeOverlay);
panel.appendChild(closeBtn);
panel.appendChild(el('h2',{style:'font-size:20px;font-weight:700;margin-bottom:16px;color:#1C1C1C;'},title));
var body=el('div',{},bodyHtml);
panel.appendChild(body);
overlay.appendChild(panel);
overlay.addEventListener('click',function(ev){if(ev.target===overlay)closeOverlay();});
document.body.appendChild(overlay);
return body;
}
function asArray(x){
if(Array.isArray(x))return x;
if(x&&Array.isArray(x.rows))return x.rows;
if(x&&Array.isArray(x.data))return x.data;
return [];
}
function showDebug(){
var t=getToken();var u=getUser();
var html='<p><b>Token found:</b> '+(t?('yes, len='+t.length):'no')+'</p>';
html+='<p><b>User:</b> '+(u?JSON.stringify(u):'(none)')+'</p>';
openOverlay('Debug Storage',html);
}
function showCalendar(){
var body=openOverlay('Calendar','<p>Loading...</p>');
authFetch('/api/calendar').then(function(d){
var visits=asArray(d.visits),tasks=asArray(d.tasks),alerts=asArray(d.alerts);
var html='<h3 style="margin-top:12px;">Visits</h3><ul>'+visits.map(function(v){return '<li>'+(v.date||'')+' \u2014 '+(v.type||'')+' \u2014 '+(v.status||'')+'</li>';}).join('')+'</ul>';
if(!visits.length)html+='<p style="color:#888;">None</p>';
html+='<h3 style="margin-top:12px;">Launch Crew Tasks</h3><ul>'+tasks.map(function(v){return '<li>'+(v.date||'')+' \u2014 '+(v.type||'')+' \u2014 '+(v.status||'')+'</li>';}).join('')+'</ul>';
if(!tasks.length)html+='<p style="color:#888;">None</p>';
html+='<h3 style="margin-top:12px;">Weather Alerts</h3><ul>'+alerts.map(function(v){return '<li>'+(v.date||'')+' \u2014 '+(v.type||'')+' \u2014 '+(v.notes||'')+'</li>';}).join('')+'</ul>';
if(!alerts.length)html+='<p style="color:#888;">None</p>';
if(body)body.innerHTML=html;
}).catch(function(e){if(body)body.innerHTML='<p>Error loading calendar: '+e.message+'</p>';});
}
function showVisits(){
var body=openOverlay('Scheduled Visits','<p>Loading...</p>');
authFetch('/api/scheduled-visits').then(function(d){
var rows=asArray(d);
var html='<ul>'+rows.map(function(v){return '<li>'+(v.property_name||'Property #'+v.property_id)+' \u2014 '+v.scheduled_date+' \u2014 '+v.status+'</li>';}).join('')+'</ul>';
if(!rows.length)html='<p>No scheduled visits yet.</p>';
if(body)body.innerHTML=html;
}).catch(function(e){if(body)body.innerHTML='<p>Error loading visits: '+e.message+'</p>';});
}
function showLaunchCrew(){
var body=openOverlay('Launch Crew Tasks','<p>Loading...</p>');
authFetch('/api/launch-crew-tasks').then(function(d){
var rows=asArray(d);
var html='<ul>'+rows.map(function(v){return '<li>'+(v.property_name||'Property #'+v.property_id)+' \u2014 '+v.task_type+' \u2014 '+v.status+' (due '+v.due_date+')</li>';}).join('')+'</ul>';
if(!rows.length)html='<p>No launch crew tasks yet.</p>';
if(body)body.innerHTML=html;
}).catch(function(e){if(body)body.innerHTML='<p>Error loading tasks: '+e.message+'</p>';});
}
function showProperties(){
var body=openOverlay('Properties','<p>Loading...</p>');
authFetch('/api/properties').then(function(d){
var rows=asArray(d);
var html='<ul>'+rows.map(function(p){var loc=[p.city,p.state].filter(Boolean).join(', ');var status=(p.active===0||p.active===false)?' [inactive]':'';return '<li><b>'+(p.nickname||'Property #'+p.id)+'</b>'+status+'<br>'+(p.owner_name||'')+' \u2014 '+(p.address||'')+(loc?', '+loc:'')+'<br>Tier: '+(p.service_tier||'n/a')+'</li>';}).join('')+'</ul>';
if(!rows.length)html='<p>No properties found.</p>';
if(body)body.innerHTML=html;
}).catch(function(e){if(body)body.innerHTML='<p>Error loading properties: '+e.message+'</p>';});
}
function removeFab(){
var f=document.getElementById('srsc-fab');
if(f&&f.parentNode)f.parentNode.removeChild(f);
}
function renderFab(){
if(!hasAccess()){removeFab();return;}
if(document.getElementById('srsc-fab'))return;
var fab=el('div',{id:'srsc-fab',style:'position:fixed;bottom:24px;right:24px;z-index:9998;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:sans-serif;'});
var menu=el('div',{id:'srsc-fab-menu',style:'display:none;flex-direction:column;gap:6px;margin-bottom:8px;'});
function mkBtn(label,fn){
var b=el('button',{style:'background:#C05A43;color:#fff;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;'},label);
b.addEventListener('click',function(){fn();menu.style.display='none';});
return b;
}
menu.appendChild(mkBtn('Properties',showProperties));
menu.appendChild(mkBtn('Calendar',showCalendar));
menu.appendChild(mkBtn('Scheduled Visits',showVisits));
menu.appendChild(mkBtn('Launch Crew Tasks',showLaunchCrew));
menu.appendChild(mkBtn('Debug Storage',showDebug));
var toggle=el('button',{style:'background:#1C1C1C;color:#fff;border:none;width:56px;height:56px;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 2px 8px rgba(0,0,0,0.3);'},'+');
toggle.addEventListener('click',function(){menu.style.display=menu.style.display==='none'?'flex':'none';});
fab.appendChild(menu);
fab.appendChild(toggle);
document.body.appendChild(fab);
}
function init(){
renderFab();
setInterval(renderFab,2000);
}
if(document.readyState==='complete'||document.readyState==='interactive'){init();}
else{document.addEventListener('DOMContentLoaded',init);}
setTimeout(init,1000);
})();
