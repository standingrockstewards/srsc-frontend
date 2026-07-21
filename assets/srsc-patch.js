(function(){
  var API='https://srsc-backend.onrender.com';
  function getToken(){
    var keys=['token','srsc_token','authToken','jwt'];
    for(var i=0;i<keys.length;i++){
      var v=localStorage.getItem(keys[i])||sessionStorage.getItem(keys[i]);
      if(v&&v.split('.').length===3)return v;
    }
    try{
      for(var s=0;s<localStorage.length;s++){
        var k=localStorage.key(s);var val=localStorage.getItem(k);
        if(val&&val.split&&val.split('.').length===3&&val.length>20)return val;
        if(val){try{var parsed=JSON.parse(val);if(parsed&&parsed.token)return parsed.token;}catch(e){}}
      }
    }catch(e){}
    return null;
  }
  function authFetch(path){
    var t=getToken();
    return fetch(API+path,{headers:t?{'Authorization':'Bearer '+t}:{}}).then(function(r){return r.json();});
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
  function showCalendar(){
    var body=openOverlay('Calendar',"<p>Loading...</p>");
    authFetch('/api/calendar').then(function(d){
      var html='<h3 style="margin-top:12px;">Visits</h3><ul>'+(d.visits||[]).map(function(v){return '<li>'+(v.date||'')+' \u2014 '+(v.type||'')+' \u2014 '+(v.status||'')+'</li>';}).join('')+'</ul>';
      html+='<h3 style="margin-top:12px;">Launch Crew Tasks</h3><ul>'+(d.tasks||[]).map(function(v){return '<li>'+(v.date||'')+' \u2014 '+(v.type||'')+' \u2014 '+(v.status||'')+'</li>';}).join('')+'</ul>';
      html+='<h3 style="margin-top:12px;">Weather Alerts</h3><ul>'+(d.alerts||[]).map(function(v){return '<li>'+(v.date||'')+' \u2014 '+(v.type||'')+' \u2014 '+(v.notes||'')+'</li>';}).join('')+'</ul>';
      if(body)body.innerHTML=html;
    }).catch(function(e){if(body)body.innerHTML='<p>Error loading calendar: '+e.message+'</p>';});
  }
  function showVisits(){
    var body=openOverlay('Scheduled Visits','<p>Loading...</p>');
    authFetch('/api/scheduled-visits').then(function(rows){
      var html='<ul>'+(rows||[]).map(function(v){return '<li>'+(v.property_name||'Property #'+v.property_id)+' \u2014 '+v.scheduled_date+' \u2014 '+v.status+'</li>';}).join('')+'</ul>';
      if(!rows||!rows.length)html='<p>No scheduled visits yet.</p>';
      if(body)body.innerHTML=html;
    }).catch(function(e){if(body)body.innerHTML='<p>Error loading visits: '+e.message+'</p>';});
  }
  function showLaunchCrew(){
    var body=openOverlay('Launch Crew Tasks','<p>Loading...</p>');
    authFetch('/api/launch-crew-tasks').then(function(rows){
      var html='<ul>'+(rows||[]).map(function(v){return '<li>'+(v.property_name||'Property #'+v.property_id)+' \u2014 '+v.task_type+' \u2014 '+v.status+' (due '+v.due_date+')</li>';}).join('')+'</ul>';
      if(!rows||!rows.length)html='<p>No launch crew tasks yet.</p>';
      if(body)body.innerHTML=html;
    }).catch(function(e){if(body)body.innerHTML='<p>Error loading tasks: '+e.message+'</p>';});
  }
  function addFab(){
    if(document.getElementById('srsc-fab'))return;
    var fab=el('div',{id:'srsc-fab',style:'position:fixed;bottom:24px;right:24px;z-index:9998;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:sans-serif;'});
    var menu=el('div',{id:'srsc-fab-menu',style:'display:none;flex-direction:column;gap:6px;margin-bottom:8px;'});
    function mkBtn(label,fn){
      var b=el('button',{style:'background:#C05A43;color:#fff;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;'},label);
      b.addEventListener('click',function(){fn();menu.style.display='none';});
      return b;
    }
    menu.appendChild(mkBtn('Calendar',showCalendar));
    menu.appendChild(mkBtn('Scheduled Visits',showVisits));
    menu.appendChild(mkBtn('Launch Crew Tasks',showLaunchCrew));
    var toggle=el('button',{style:'background:#1C1C1C;color:#fff;border:none;width:56px;height:56px;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 2px 8px rgba(0,0,0,0.3);'},'+');
    toggle.addEventListener('click',function(){menu.style.display=menu.style.display==='none'?'flex':'none';});
    fab.appendChild(menu);
    fab.appendChild(toggle);
    document.body.appendChild(fab);
  }
  function init(){addFab();}
  if(document.readyState==='complete'||document.readyState==='interactive'){init();}
  else{document.addEventListener('DOMContentLoaded',init);}
  setTimeout(init,1000);
})();
