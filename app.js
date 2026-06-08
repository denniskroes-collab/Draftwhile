var lang="nl-NL",listening=false,rec=null,currentDraft=null,savedText="";


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
  currentDraft=null;savedText="";
  document.getElementById("tbox").innerHTML='<span class="placeholder" id="ph">Your words will appear here...</span>';
  go("main");
