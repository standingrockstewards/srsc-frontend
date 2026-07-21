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
  function addNavLink(label,hash){
    var nav=document.querySelector('nav')||document.querySelector('[class*="nav"]');
    if(!nav)return null;
    if(document.getElementById('srsc-nav-'+hash))return null;
    var link=el('a',{href:'#/'+hash,id:'srsc-nav-'+hash,style:'display:block;padding:8px 12px;color:inherit;text-decoration:none;cursor:pointer;'},label);
    link.addEventListener('click',function(ev){ev.preventDefault();window.location.hash='#/'+hash;renderPatchView(hash);});
    nav.appendChild(link);
    return link;
  }
  function ensureContainer(){
    var c=document.getElementById('srsc-patch-view');
    if(!c){
      c=el('div',{id:'srsc-patch-view',style:'display:none;padding:24px;'});
      var root=document.getElementById('root');
      if(root&&root.parentNode)root.parentNode.appendChild(c);
    }
    return c;
  }
  function showPatchView(show){
    var c=ensureContainer();
    c.style.display=show?'block':'none';
    var root=document.getElementById('root');
  }
  function renderPatchView(view){
    var c=ensureContainer();
    showPatchView(true);
    c.innerHTML='<p>Loading...</p>';
    if(view==='calendar'){
      authFetch('/api/calendar').then(function(d){
        var html='<h2 style="font-size:20px;font-weight:600;margin-bottom:16px;">Calendar</h2>';
        html+='<h3>Visits</h3><ul>'+(d.visits||[]).map(function(v){return '<li>'+(v.date||'')+' - '+(v.type||'')+' - '+(v.status||'')+'</li>';}).join('')+'</ul>';
        html+='<h3>Launch Crew Tasks</h3><ul>'+(d.tasks||[]).map(function(v){return '<li>'+(v.date||'')+' - '+(v.type||'')+' - '+(v.status||'')+'</li>';}).join('')+'</ul>';
        html+='<h3>Weather Alerts</h3><ul>'+(d.alerts||[]).map(function(v){return '<li>'+(v.date||'')+' - '+(v.type||'')+' - '+(v.notes||'')+'</li>';}).join('')+'</ul>';
        c.innerHTML=html;
      }).catch(function(e){c.innerHTML='<p>Error loading calendar: '+e.message+'</p>';});
    }else if(view==='scheduled-visits'){
      authFetch('/api/scheduled-visits').then(function(rows){
        var html='<h2 style="font-size:20px;font-weight:600;margin-bottom:16px;">Scheduled Visits</h2><ul>';
        html+=(rows||[]).map(function(v){return '<li>'+(v.property_name||'Property #'+v.property_id)+' - '+v.scheduled_date+' - '+v.status+'</li>';}).join('');
        html+='</ul>';
        c.innerHTML=html;
      }).catch(function(e){c.innerHTML='<p>Error loading visits: '+e.message+'</p>';});
    }else if(view==='launch-crew'){
      authFetch('/api/launch-crew-tasks').then(function(rows){
        var html='<h2 style="font-size:20px;font-weight:600;margin-bottom:16px;">Launch Crew Tasks</h2><ul>';
        html+=(rows||[]).map(function(v){return '<li>'+(v.property_name||'Property #'+v.property_id)+' - '+v.task_type+' - '+v.status+' (due '+v.due_date+')</li>';}).join('');
        html+='</ul>';
        c.innerHTML=html;
      }).catch(function(e){c.innerHTML='<p>Error loading tasks: '+e.message+'</p>';});
    }
  }
  function watchHash(){
    var h=window.location.hash.replace('#/','');
    if(h==='calendar'||h==='scheduled-visits'||h==='launch-crew'){
      renderPatchView(h);
    }else{
      showPatchView(false);
    }
  }
  function init(){
    addNavLink('Calendar','calendar');
    addNavLink('Scheduled Visits','scheduled-visits');
    addNavLink('Launch Crew','launch-crew');
    window.addEventListener('hashchange',watchHash);
    watchHash();
  }
  function waitForNav(tries){
    var nav=document.querySelector('nav')||document.querySelector('[class*="nav"]');
    if(nav){init();}
    else if(tries<40){setTimeout(function(){waitForNav(tries+1);},250);}
  }
  document.addEventListener('DOMContentLoaded',function(){waitForNav(0);});
  if(document.readyState==='complete'||document.readyState==='interactive'){waitForNav(0);}
})();
