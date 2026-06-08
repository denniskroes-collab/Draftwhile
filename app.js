var lang="nl-NL",listening=false,rec=null,currentDraft=null;

function go(id){
  var s=document.querySelectorAll(".screen");
  for(var i=0;i<s.length;i++) s[i].classList.remove("active");
  document.getElementById(id).classList.add("active");
  if(id==="settings") loadSettings();
}

function showToast(msg){
  var t=document.getElementById("toast");
  t.textContent=msg;t.classList.add("show");
  setTimeout(function(){t.classList.remove("show");},2000);
}

function loadSettings(){
  document.getElementById("inp-key").value=(localStorage.getItem("dw_key")||localStorage.getItem("dw_api_key"))||"";
  document.getElementById("inp-name").value=(localStorage.getItem("dw_name")||localStorage.getItem("dw_user_name"))||"";
  document.getElementById("inp-style").value=localStorage.getItem("dw_style")||"";
}

document.getElementById("open-settings").addEventListener("click",function(){go("settings");});
document.getElementById("close-settings").addEventListener("click",function(){go("main");});
document.getElementById("close-draft").addEventListener("click",function(){go("main");});
document.getElementById("btn-nl").addEventListener("click",function(){lang="nl-NL";document.getElementById("btn-nl").classList.add("active");document.getElementById("btn-en").classList.remove("active");});
document.getElementById("btn-en").addEventListener("click",function(){lang="en-US";document.getElementById("btn-en").classList.add("active");document.getElementById("btn-nl").classList.remove("active");});
document.getElementById("btn-save").addEventListener("click",function(){
  localStorage.setItem("dw_key",document.getElementById("inp-key").value.trim());
  localStorage.setItem("dw_name",document.getElementById("inp-name").value.trim());
  localStorage.setItem("dw_style",document.getElementById("inp-style").value.trim());
  showToast("Saved!");setTimeout(function(){go("main");},800);
});
document.getElementById("start-over").addEventListener("click",function(){
  currentDraft=null;
  document.getElementById("tbox").innerHTML='<span class="placeholder" id="ph">Your words will appear here...</span>';
  go("main");
});
document.getElementById("open-mail").addEventListener("click",function(){
  if(!currentDraft)return;
  window.location.href="mailto:?subject="+encodeURIComponent(currentDraft.subject)+"&body="+encodeURIComponent(currentDraft.body);
});
document.getElementById("mic-btn").addEventListener("click",function(){
  if(listening){stopMic();}else{startMic();}
});

function startMic(){
  var key=(localStorage.getItem("dw_key")||localStorage.getItem("dw_api_key"));
  if(!key){showToast("Add API key in Settings");go("settings");return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){showToast("Speech not supported");return;}
  listening=true;
  document.getElementById("mic-btn").classList.add("on");
  document.getElementById("mic-icon").textContent="⏹";
  document.getElementById("status-label").textContent="Listening...";
  document.getElementById("mic-hint").textContent="TAP TO STOP";
  var ph=document.getElementById("ph");if(ph)ph.remove();
  var box=document.getElementById("tbox");
  box.innerHTML="";box.classList.add("on");

  function startRec(){
    if(!listening)return;
    rec=new SR();
    rec.lang=lang;
    rec.continuous=false;
    rec.interimResults=true;
    rec.onresult=function(e){
      var full="";
      for(var i=0;i<e.results.length;i++){
        full+=e.results[i][0].transcript+" ";
      }
      box.textContent=full.trim();
    };
    rec.onerror=function(e){
      if(e.error==="no-speech"&&listening){setTimeout(startRec,200);return;}
      stopMic();showToast("Mic error: "+e.error);
    };
    rec.onend=function(){
      if(listening){setTimeout(startRec,200);}
    };
    try{rec.start();}catch(e){}
  }
  startRec();
}

function stopMic(){
  listening=false;
  if(rec){try{rec.abort();}catch(e){}rec=null;}
  document.getElementById("mic-btn").classList.remove("on");
  document.getElementById("tbox").classList.remove("on");
  document.getElementById("status-label").textContent="Tap to speak";
  document.getElementById("mic-hint").textContent="TAP TO RECORD";
  // Read directly from the box - works regardless of isFinal in Safari
  var t=document.getElementById("tbox").textContent.trim();
  if(t.length>3){
    makeDraft(t);
  } else {
    document.getElementById("mic-icon").textContent="🎙";
    document.getElementById("tbox").innerHTML='<span class="placeholder" id="ph">Your words will appear here...</span>';
  }
}

function makeDraft(text){
  var key=(localStorage.getItem("dw_key")||localStorage.getItem("dw_api_key"));
  var name=(localStorage.getItem("dw_name")||localStorage.getItem("dw_user_name"))||"";
  var style=localStorage.getItem("dw_style")||"";
  var btn=document.getElementById("mic-btn");
  btn.classList.add("busy");
  document.getElementById("mic-icon").textContent="⏳";
  document.getElementById("status-label").textContent="Drafting...";
  var sys="You are a bilingual email drafting assistant (Dutch and English).";
  if(name)sys+=" The user is: "+name+".";
  if(style)sys+=" Match this writing style:\n"+style;
  sys+="\nDetect if the user spoke Dutch or English and write the email in that language. Return ONLY a raw JSON object with no markdown: {\"subject\":\"...\",\"body\":\"...\"}";
  fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1000,system:sys,messages:[{role:"user",content:text}]})
  })
  .then(function(r){return r.json();})
  .then(function(data){
    if(data.error)throw new Error(data.error.message+" ("+data.error.type+")");
    var raw=data.content[0].text.trim().replace(/```json|```/g,"").trim();
    var d=JSON.parse(raw);
    currentDraft={subject:d.subject,body:d.body};
    document.getElementById("subj-val").textContent=d.subject;
    document.getElementById("body-val").textContent=d.body;
    go("draft");
  })
  .catch(function(err){
    document.getElementById("tbox").innerHTML='<div class="err">'+err.message+'</div>';
  })
  .finally(function(){
    btn.classList.remove("busy");
    document.getElementById("mic-icon").textContent="🎙";
    document.getElementById("status-label").textContent="Tap to speak";
  });
}
