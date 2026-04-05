import React,{useState,useEffect,useRef,Component} from "react";

class ErrorBoundary extends Component{
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(e){return{err:e};}
  render(){if(this.state.err)return<div style={{background:"#0c0e12",minHeight:"100vh",color:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:40,fontFamily:"sans-serif"}}><div style={{fontSize:40,marginBottom:16}}>😵</div><div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Something went wrong</div><div style={{fontSize:14,color:"#94a3b8",marginBottom:20}}>{this.state.err?.message}</div><button onClick={()=>{this.setState({err:false});window.location.reload();}} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontWeight:700}}>Reload</button></div>;return this.props.children;}
}

const API_URL="https://ufl-pool-production.up.railway.app";
const TEAMS={"Arlington Renegades":{abbr:"ARL",color:"#E31937"},"Birmingham Stallions":{abbr:"BHM",color:"#FFB81C"},"D.C. Defenders":{abbr:"DC",color:"#C8102E"},"Houston Roughnecks":{abbr:"HOU",color:"#003D79"},"Memphis Showboats":{abbr:"MEM",color:"#00B2A9"},"Michigan Panthers":{abbr:"MICH",color:"#003DA5"},"San Antonio Brahmas":{abbr:"SA",color:"#2D2926"},"St. Louis Battlehawks":{abbr:"STL",color:"#003B7B"},"Orlando Storm":{abbr:"ORL",color:"#005EB8"},"Columbus Aviators":{abbr:"CLB",color:"#6F263D"}};

function useTm(espn){return function(n){if(!n)return{abbr:"?",color:"#666",logo:null};const e=espn.find(function(t){return t.name===n||t.abbr===n||n.includes(t.nickname)||n.includes(t.abbr);});if(e)return{abbr:e.abbr,color:e.color,logo:e.logo,record:e.record,id:e.id,name:e.name};const f=TEAMS[n];if(f)return{...f,logo:null};return{abbr:n?.substring(0,3)?.toUpperCase()||"?",color:"#666",logo:null};};}

function TmLogo({team,size}){const s=size||20;if(team?.logo)return <img src={team.logo} alt={team.abbr} style={{width:s,height:s,objectFit:"contain"}}/>;return <div style={{width:s,height:s,borderRadius:"50%",background:team?.color||"#666"}}/>;}

function calcPayout(w,odds){if(!w||w<=0)return 0;const o=odds==null?-110:typeof odds==="string"?parseInt(odds):odds;return o<0?Math.round(w*(100/Math.abs(o))):Math.round(w*(o/100));}
function fmtOdds(odds){if(odds==null)return"-110";const o=typeof odds==="string"?parseInt(odds):odds;return o>0?"+"+o:""+o;}
function calcParlayPayout(legs,w){if(!w||w<=0||legs.length<2)return 0;let m=1;for(const l of legs){const rawOdds=l.odds||(l.betType==="moneyline"?l.odds:null);const o=rawOdds!=null?(typeof rawOdds==="string"?parseInt(rawOdds):rawOdds):-110;m*=o<0?1+100/Math.abs(o):1+o/100;}return Math.round(w*m)-w;}
function getToken(){try{return localStorage.getItem("ufl_token");}catch(e){return null;}}
function setToken(t){try{localStorage.setItem("ufl_token",t);}catch(e){}}
function removeToken(){try{localStorage.removeItem("ufl_token");}catch(e){}}
async function api(path,opt={}){const t=getToken(),h={"Content-Type":"application/json"};if(t)h.Authorization="Bearer "+t;const r=await fetch(API_URL+path,{...opt,headers:h});const d=await r.json();if(!r.ok)throw new Error(d.error||"Failed");return d;}

function groupBetsByParlay(betsList){
  var grouped=[],pm={};
  for(var i=0;i<betsList.length;i++){
    var b=betsList[i];
    if(b.parlay_group){
      var k=b.parlay_group;
      if(!pm[k]){pm[k]={parlay_group:b.parlay_group,isParlay:true,legs:[b],wager:b.wager,result:b.result,created_at:b.created_at,display_name:b.display_name,username:b.username,is_own:b.is_own};grouped.push(pm[k]);}
      else{pm[k].legs.push(b);}
    }else grouped.push({...b,isParlay:false});
  }
  Object.values(pm).forEach(function(p){
    var hasLoss=p.legs.some(function(l){return l.result==="loss";});
    var allWon=p.legs.every(function(l){return l.result==="win";});
    var allSettled=p.legs.every(function(l){return l.result==="win"||l.result==="loss"||l.result==="push";});
    if(hasLoss)p.result="loss";else if(allWon)p.result="win";else if(allSettled)p.result="push";else p.result="pending";
  });
  return grouped;
}

function hasKickedOff(ct){if(!ct)return false;return new Date(ct).getTime()<=Date.now();}

const C={bg:"#0c0e12",card:"#151820",cardB:"#1c2030",border:"#252a38",blue:"#3b82f6",green:"#22c55e",red:"#ef4444",amber:"#f59e0b",purple:"#8b5cf6",muted:"#6b7280",text:"#e5e7eb",dim:"#94a3b8"};

function Card({children,style,onClick}){return <div onClick={onClick} style={{background:C.card,borderRadius:12,padding:16,marginBottom:10,border:"1px solid "+C.border,...style}}>{children}</div>;}
function Btn({children,bg,full,small,disabled,onClick,style}){return <button disabled={disabled} onClick={onClick} style={{background:disabled?C.muted:(bg||C.blue),color:"#fff",border:"none",borderRadius:8,padding:small?"6px 14px":"11px 22px",cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:small?12:14,width:full?"100%":"auto",opacity:disabled?0.5:1,...style}}>{children}</button>;}
function Input(p){return <input {...p} style={{background:"#0c0e14",border:"1px solid "+C.border,borderRadius:8,padding:"11px 14px",color:"#fff",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",...p.style}}/>;}
function Badge({text,color}){return <span style={{background:color+"22",color:color,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase"}}>{text}</span>;}
function Spinner(){return <div style={{width:20,height:20,border:"3px solid "+C.blue+"33",borderTop:"3px solid "+C.blue,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;}
function LoadingCard({text}){return <Card style={{textAlign:"center",padding:30,color:C.muted}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/><span>{text||"Loading..."}</span></div></Card>;}

function ConfirmModal({title,message,details,onConfirm,onCancel,confirmText,confirmColor}){
  return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}><div style={{background:C.card,borderRadius:12,padding:24,maxWidth:400,width:"100%",border:"1px solid "+C.border}}><div style={{fontWeight:700,fontSize:17,marginBottom:8}}>{title}</div><div style={{fontSize:14,color:C.dim,marginBottom:12}}>{message}</div>{details&&<div style={{background:C.cardB,borderRadius:8,padding:12,marginBottom:16,fontSize:13}}>{details}</div>}<div style={{display:"flex",gap:8}}><Btn full bg={confirmColor||C.blue} onClick={onConfirm}>{confirmText||"Confirm"}</Btn><Btn full bg="#374151" onClick={onCancel}>Cancel</Btn></div></div></div>);
}

function BetBtn({label,sub,odds,isParlay,onBet,onParlay,disabled,disabledMsg,gameTime}){
  const[open,setOpen]=useState(false);const[wager,setWager]=useState("");
  const profit=calcPayout(parseInt(wager)||0,odds);const oddsStr=fmtOdds(odds);
  const locked=gameTime&&(new Date(gameTime).getTime()-300000)<=Date.now();
  if(locked)return(<button disabled style={{background:"#1a1f2b",border:"1px solid #252a38",borderRadius:8,padding:"8px 4px",color:"#4b5563",cursor:"not-allowed",textAlign:"center",width:"100%",opacity:0.5}}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:9}}>Locked</div></button>);
  if(disabled&&isParlay)return(<button disabled style={{background:"#1a1f2b",border:"1px solid #252a38",borderRadius:8,padding:"8px 4px",color:"#4b5563",cursor:"not-allowed",textAlign:"center",width:"100%",opacity:0.5}}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:9}}>{disabledMsg}</div></button>);
  if(isParlay)return(<button onClick={onParlay} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"8px 4px",color:"#e5e7eb",cursor:"pointer",textAlign:"center",width:"100%"}} onMouseEnter={function(e){e.currentTarget.style.borderColor="#f59e0b";}} onMouseLeave={function(e){e.currentTarget.style.borderColor="#334155";}}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:10,color:C.amber}}>{oddsStr}</div></button>);
  if(!open)return(<button onClick={function(){setOpen(true);}} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"8px 4px",color:"#e5e7eb",cursor:"pointer",textAlign:"center",width:"100%"}} onMouseEnter={function(e){e.currentTarget.style.borderColor="#3b82f6";}} onMouseLeave={function(e){e.currentTarget.style.borderColor="#334155";}}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:10,color:C.dim}}>{sub} • {oddsStr}</div></button>);
  return(<div style={{background:"#1e293b",border:"1px solid #3b82f6",borderRadius:8,padding:6}}><div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{label}</div><div style={{fontSize:10,color:C.dim,marginBottom:4}}>Odds: {oddsStr}</div><input type="number" placeholder="Wager" value={wager} onChange={function(e){setWager(e.target.value);}} autoFocus onKeyDown={function(e){if(e.key==="Enter"&&wager){onBet(parseInt(wager));setOpen(false);setWager("");}}} style={{background:"#0c0e14",border:"1px solid #2a2d35",borderRadius:6,padding:"5px 8px",color:"#fff",fontSize:12,width:"100%",textAlign:"center",outline:"none",boxSizing:"border-box"}}/>{wager&&parseInt(wager)>0&&(<div style={{marginTop:4,padding:"4px 6px",background:"#052e16",borderRadius:4,textAlign:"center"}}><span style={{fontSize:11,color:C.green}}>Win: +{profit} → <strong>{parseInt(wager)+profit}</strong></span></div>)}<div style={{display:"flex",gap:4,marginTop:4}}><button onClick={function(){if(wager){onBet(parseInt(wager));setOpen(false);setWager("");}}} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:4,padding:"4px 0",cursor:"pointer",fontWeight:600,fontSize:11,flex:1}}>Place Bet</button><button onClick={function(){setOpen(false);setWager("");}} style={{background:"#374151",color:"#94a3b8",border:"none",borderRadius:4,padding:"4px 6px",cursor:"pointer",fontSize:11}}>✕</button></div></div>);
}

function LineHistoryPanel({data}){
  if(!data?.history?.length)return <div style={{fontSize:12,color:C.muted}}>No line changes recorded</div>;
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr",gap:4,marginBottom:6}}><div style={{fontSize:10,color:C.dim,fontWeight:700}}>Date</div><div style={{fontSize:10,color:C.dim,fontWeight:700}}>Spread</div><div style={{fontSize:10,color:C.dim,fontWeight:700}}>Total</div><div style={{fontSize:10,color:C.dim,fontWeight:700}}>ML (H/A)</div></div>
    {data.history.map(function(h,i){const p=i>0?data.history[i-1]:null;const sc=p&&p.spread_home!==h.spread_home;const tc=p&&p.total!==h.total;const mc=p&&p.moneyline_home!==h.moneyline_home;const sd=p&&h.spread_home!=null&&p.spread_home!=null?(h.spread_home<p.spread_home?"↓":"↑"):"";const td=p&&h.total!=null&&p.total!=null?(h.total>p.total?"↑":"↓"):"";return(<div key={h.id} style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr",gap:4,padding:"3px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}><div style={{color:C.dim}}>{i===0?"Opening":new Date(h.recorded_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric"})}</div><div style={{color:sc?C.amber:C.text}}>{h.spread_home!=null?(h.spread_home>0?"+":"")+h.spread_home:"—"} {sd}</div><div style={{color:tc?C.amber:C.text}}>{h.total||"—"} {td}</div><div style={{color:mc?C.amber:C.text}}>{h.moneyline_home||"—"}/{h.moneyline_away||"—"}</div></div>);})}
    {data.current&&(<div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr",gap:4,padding:"4px 0",fontSize:12,borderTop:"1px solid "+C.blue+"44",marginTop:4}}><div style={{color:C.blue,fontWeight:700}}>Current</div><div style={{color:C.blue,fontWeight:700}}>{data.current.spread_home!=null?(data.current.spread_home>0?"+":"")+data.current.spread_home:"—"}</div><div style={{color:C.blue,fontWeight:700}}>{data.current.total||"—"}</div><div style={{color:C.blue,fontWeight:700}}>{data.current.moneyline_home||"—"}/{data.current.moneyline_away||"—"}</div></div>)}
  </div>);
}

function ParlayBetCard({parlay,tm,betDesc,allGames,showUser}){
  var borderCol=parlay.result==="win"?C.green+"44":parlay.result==="loss"?C.red+"44":C.border;
  var mt=1;
  for(var i=0;i<parlay.legs.length;i++){var l=parlay.legs[i];var rawOdds=l.odds!=null?(typeof l.odds==="string"?parseInt(l.odds):l.odds):-110;mt*=rawOdds<0?1+100/Math.abs(rawOdds):1+rawOdds/100;}
  var totalPayout=Math.round(parlay.wager*mt);var profit=totalPayout-parlay.wager;
  var backendPayout=0;for(var j=0;j<parlay.legs.length;j++){if(parlay.legs[j].payout>0)backendPayout=parlay.legs[j].payout;}
  if(parlay.result==="win"&&backendPayout>0){totalPayout=backendPayout;profit=totalPayout-parlay.wager;}
  return(
    <Card style={{borderColor:borderCol}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>{showUser&&<span style={{fontWeight:700,fontSize:14}}>{parlay.display_name}</span>}{parlay.is_own&&<Badge text="You" color={C.blue}/>}<Badge text={"Parlay • "+parlay.legs.length+" legs"} color={C.purple}/></div>
        <Badge text={parlay.result} color={parlay.result==="win"?C.green:parlay.result==="loss"?C.red:parlay.result==="push"?"#a3a3a3":C.blue}/>
      </div>
      {parlay.legs.map(function(leg,j){
        var gameKicked=leg.revealed||hasKickedOff(leg.commence_time);
        if(!gameKicked&&allGames){var gm=allGames.find(function(g){return g.id===leg.game_id;});if(gm)gameKicked=hasKickedOff(gm.commence_time);}
        var legResult=leg.result||"pending";var legCol=legResult==="win"?C.green:legResult==="loss"?C.red:C.text;
        var legOdds=leg.odds!=null?(typeof leg.odds==="string"?parseInt(leg.odds):leg.odds):-110;var legOddsStr=legOdds>0?"+"+legOdds:""+legOdds;
        return(<div key={j} style={{fontSize:13,padding:"4px 0",borderBottom:j<parlay.legs.length-1?"1px solid "+C.border+"44":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>{gameKicked?(<span><span style={{color:C.dim}}>{tm(leg.away_team).abbr}@{tm(leg.home_team).abbr}: </span><strong style={{color:legCol}}>{betDesc(leg.bet_type,leg.pick,leg.line,leg.odds)}</strong><span style={{color:C.dim,fontSize:11}}> ({legOddsStr})</span></span>):(<span style={{color:C.amber}}>🔒 Hidden until kickoff</span>)}{legResult!=="pending"&&<Badge text={legResult} color={legResult==="win"?C.green:legResult==="loss"?C.red:"#a3a3a3"}/>}</div>);
      })}
      <div style={{marginTop:8,padding:"8px 10px",background:C.cardB,borderRadius:6}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><div><span style={{color:C.dim}}>Wager: </span><span style={{fontWeight:700}}>{parlay.wager} pts</span></div><div><span style={{color:C.dim}}>Odds: </span><span style={{fontWeight:600}}>{mt.toFixed(2)}x</span></div></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
          {parlay.result==="pending"&&<div><span style={{color:C.dim}}>To win: </span><span style={{fontWeight:700,color:C.green}}>+{profit} pts</span></div>}
          {parlay.result==="pending"&&<div><span style={{color:C.dim}}>Payout: </span><span style={{fontWeight:700}}>{totalPayout} pts</span></div>}
          {parlay.result==="win"&&<div style={{color:C.green,fontWeight:700}}>Won +{profit} pts (Payout: {totalPayout})</div>}
          {parlay.result==="loss"&&<div style={{color:C.red,fontWeight:700}}>Lost {parlay.wager} pts</div>}
          {parlay.result==="push"&&<div style={{color:"#a3a3a3",fontWeight:700}}>Returned {parlay.wager} pts</div>}
        </div>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:4}}>{new Date(parlay.created_at).toLocaleString()}</div>
    </Card>
  );
}

function AppInner(){
  const[user,setUser]=useState(null);
  const[authView,setAuthView]=useState("login");
  const[authForm,setAuthForm]=useState({username:"",email:"",password:"",displayName:""});
  const[authLoading,setAuthLoading]=useState(false);
  const[forgotMode,setForgotMode]=useState(false);
  const[forgotEmail,setForgotEmail]=useState("");
  const[resetToken,setResetToken]=useState(null);
  const[resetForm,setResetForm]=useState({password:"",confirm:""});
  const[screen,setScreen]=useState("pools");
  const[pools,setPools]=useState([]);
  const[activePool,setActivePool]=useState(null);
  const[games,setGames]=useState([]);
  const[bets,setBets]=useState([]);
  const[leaderboard,setLeaderboard]=useState([]);
  const[members,setMembers]=useState([]);
  const[balance,setBalance]=useState(1000);
  const[myRole,setMyRole]=useState("member");
  const[parlayLegs,setParlayLegs]=useState([]);
  const[parlayWager,setParlayWager]=useState("");
  const[msg,setMsg]=useState(null);
  const[createForm,setCreateForm]=useState({name:"",balance:1000,approval:true});
  const[joinCode,setJoinCode]=useState("");
  const[adminTab,setAdminTab]=useState("pending");
  const[activity,setActivity]=useState([]);
  const[messages,setMessages]=useState([]);
  const[msgInput,setMsgInput]=useState("");
  const[liveData,setLiveData]=useState([]);
  const[adjustModal,setAdjustModal]=useState(null);
  const[adjustAmt,setAdjustAmt]=useState("");
  const[adjustReason,setAdjustReason]=useState("");
  const[expandedGame,setExpandedGame]=useState(null);
  const[lineHistory,setLineHistory]=useState(null);
  const[schedule,setSchedule]=useState([]);
  const[scheduleWeek,setScheduleWeek]=useState(null);
  const[schedExpanded,setSchedExpanded]=useState(null);
  const[schedLineHist,setSchedLineHist]=useState(null);
  const[espnTeams,setEspnTeams]=useState([]);
  const[news,setNews]=useState([]);
  const[gameSummary,setGameSummary]=useState(null);
  const[summaryLoading,setSummaryLoading]=useState(false);
  const[profile,setProfile]=useState(null);
  const[recapWeek,setRecapWeek]=useState(null);
  const[recapData,setRecapData]=useState(null);
  const[betConfirm,setBetConfirm]=useState(null);
  const[loading,setLoading]=useState(false);
  const[leaveConfirm,setLeaveConfirm]=useState(false);
  const[viewingPlayer,setViewingPlayer]=useState(null);
  const[viewingPlayerData,setViewingPlayerData]=useState(null);
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[section,setSection]=useState("bet");
  const[subTab,setSubTab]=useState("board");
  const[liveRefreshing,setLiveRefreshing]=useState(false);
  const chatEndRef=useRef(null);

  const showMsg=function(t,type){setMsg({t:t,type:type||"info"});setTimeout(function(){setMsg(null);},4000);};
  const tm=useTm(espnTeams);

  var downloadCSV=function(path){
    var t=getToken();
    var url=API_URL+path+(path.includes("?")?"&":"?")+"token="+encodeURIComponent(t);
    window.open(url,"_blank");
  };

  var refreshLive=async function(){if(!activePool)return;setLiveRefreshing(true);try{setLiveData(await api("/api/pools/"+activePool.id+"/live"));}catch(e){}finally{setLiveRefreshing(false);}};

  useEffect(function(){const s=document.createElement("style");s.textContent="@keyframes spin{to{transform:rotate(360deg)}}";document.head.appendChild(s);return function(){document.head.removeChild(s);};},[]);
  useEffect(function(){const p=new URLSearchParams(window.location.search);const t=p.get("reset");if(t)api("/api/auth/verify-reset/"+t).then(function(){setResetToken(t);}).catch(function(){showMsg("Invalid reset link","error");window.history.replaceState({},"",window.location.pathname);});},[]);
  useEffect(function(){const t=getToken();if(t&&API_URL)api("/api/auth/me").then(function(u){setUser({id:u.id,username:u.username,displayName:u.display_name});}).catch(function(){removeToken();});},[]);
  useEffect(function(){if(user)api("/api/my-pools").then(setPools).catch(function(){});},[user]);
  useEffect(function(){if(user)api("/api/espn/teams").then(setEspnTeams).catch(function(){});},[user]);
  useEffect(function(){if(subTab==="news")api("/api/espn/news").then(function(d){setNews(d.articles||[]);}).catch(function(){});},[subTab]);
  useEffect(function(){if(subTab==="profile"&&activePool){setProfile(null);api("/api/pools/"+activePool.id+"/profile").then(setProfile).catch(function(){});}},[subTab,activePool]);
  useEffect(function(){if(subTab==="recap"&&activePool&&recapWeek){setRecapData(null);api("/api/pools/"+activePool.id+"/recap/"+recapWeek).then(setRecapData).catch(function(){});}},[subTab,recapWeek,activePool]);
  useEffect(function(){if(subTab!=="live"||!activePool)return;var ld=function(){api("/api/pools/"+activePool.id+"/live").then(setLiveData).catch(function(){});};ld();var iv=setInterval(ld,30000);return function(){clearInterval(iv);};},[subTab,activePool]);
  useEffect(function(){if(subTab!=="chat"||!activePool)return;var ld=function(){api("/api/pools/"+activePool.id+"/messages").then(setMessages).catch(function(){});};ld();var iv=setInterval(ld,10000);return function(){clearInterval(iv);};},[subTab,activePool]);
  useEffect(function(){if(subTab==="schedule"&&activePool)api("/api/schedule").then(function(s){setSchedule(s);if(!scheduleWeek&&s.length)setScheduleWeek(s[s.length-1].week);}).catch(function(){});},[subTab,activePool]);
  useEffect(function(){chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  var handleAuth=async function(){
    setAuthLoading(true);
    try{
      if(forgotMode){if(!forgotEmail){showMsg("Enter email","error");return;}await api("/api/auth/forgot-password",{method:"POST",body:JSON.stringify({email:forgotEmail})});showMsg("Check your inbox!");setForgotMode(false);setForgotEmail("");return;}
      if(resetToken){if(!resetForm.password||!resetForm.confirm){showMsg("Fill both fields","error");return;}if(resetForm.password!==resetForm.confirm){showMsg("No match","error");return;}var d=await api("/api/auth/reset-password",{method:"POST",body:JSON.stringify({token:resetToken,newPassword:resetForm.password})});setToken(d.token);setUser(d.user);setResetToken(null);window.history.replaceState({},"",window.location.pathname);showMsg("Password reset!");return;}
      if(authView==="register"){if(!authForm.username||!authForm.email||!authForm.password){showMsg("All fields required","error");return;}var d2=await api("/api/auth/register",{method:"POST",body:JSON.stringify({username:authForm.username,email:authForm.email,password:authForm.password,displayName:authForm.displayName||authForm.username})});setToken(d2.token);setUser(d2.user);showMsg("Account created!");}
      else{if(!authForm.username||!authForm.password){showMsg("Enter credentials","error");return;}var d3=await api("/api/auth/login",{method:"POST",body:JSON.stringify({username:authForm.username,password:authForm.password})});setToken(d3.token);setUser(d3.user);showMsg("Logged in!");}
      setPools([]);
    }catch(e){showMsg(e.message,"error");}finally{setAuthLoading(false);}
  };

  var logout=function(){removeToken();setUser(null);setScreen("pools");setActivePool(null);};

  var createPool=async function(){if(!createForm.name)return showMsg("Enter name","error");try{var d=await api("/api/pools",{method:"POST",body:JSON.stringify({name:createForm.name,startingBalance:createForm.balance,requireApproval:createForm.approval})});showMsg("Created! Code: "+d.joinCode);setPools(await api("/api/my-pools"));setCreateForm({name:"",balance:1000,approval:true});}catch(e){showMsg(e.message,"error");}};
  var joinPool=async function(){if(!joinCode)return showMsg("Enter code","error");try{var d=await api("/api/pools/"+joinCode+"/join",{method:"POST"});showMsg(d.status==="pending"?"Request sent!":"Joined!");setPools(await api("/api/my-pools"));setJoinCode("");}catch(e){showMsg(e.message,"error");}};

  var enterPool=async function(p){
    if(p.status==="pending")return showMsg("Waiting for approval","error");
    setActivePool(p);setBalance(p.balance||1000);setMyRole(p.role);setScreen("pool");setSubTab("board");setSection("bet");setLoading(true);
    try{var results=await Promise.all([api("/api/games/upcoming"),api("/api/pools/"+p.id+"/leaderboard")]);setGames(results[0]);setLeaderboard(results[1].map(function(x){return{...x,isYou:x.username===user.username};}));if(p.role==="admin")setMembers(await api("/api/pools/"+p.id+"/members"));setBets(await api("/api/pools/"+p.id+"/my-bets"));try{setActivity(await api("/api/pools/"+p.id+"/activity"));}catch(e){}try{setMessages(await api("/api/pools/"+p.id+"/messages"));}catch(e){}}catch(e){showMsg("Failed to load","error");}finally{setLoading(false);}
  };

  var LOCK_MS=300000;
  var isLocked=function(t){return t&&(new Date(t).getTime()-LOCK_MS)<=Date.now();};

  var placeBetDirect=async function(gid,bt,pick,line,odds,wager){try{var d=await api("/api/bet",{method:"POST",body:JSON.stringify({pool_id:activePool.id,game_id:gid,bet_type:bt,pick:pick,line:line,odds:odds,wager:wager})});setBalance(d.newBalance);setBets(function(prev){return[{id:"b_"+Date.now(),game_id:gid,bet_type:bt,pick:pick,line:line,odds:odds,wager:wager,result:"pending",potential_profit:calcPayout(wager,odds)},...prev];});showMsg("Bet: "+wager+" pts to win "+calcPayout(wager,odds));}catch(e){showMsg(e.message,"error");}};

  var placeBet=async function(gid,bt,pick,line,odds,wager){
    if(!wager||wager<=0)return showMsg("Enter wager","error");if(wager>balance)return showMsg("Not enough!","error");
    var g=games.find(function(x){return x.id===gid;});if(isLocked(g?.commence_time))return showMsg("Betting closed","error");
    if(wager>balance*0.25){setBetConfirm({gid:gid,bt:bt,pick:pick,line:line,odds:odds,wager:wager,pickLabel:bt==="spread"?tm(pick).abbr+" "+(line>0?"+":"")+line:bt==="over"?"Over "+line:bt==="under"?"Under "+line:tm(pick).abbr+" ML ("+fmtOdds(odds)+")",profit:calcPayout(wager,odds)});return;}
    await placeBetDirect(gid,bt,pick,line,odds,wager);
  };

  var isParlayConflict=function(gid,bt,pick){for(var i=0;i<parlayLegs.length;i++){var l=parlayLegs[i];if(l.gameId!==gid)continue;if((l.betType==="spread"||l.betType==="moneyline")&&(bt==="spread"||bt==="moneyline")&&l.pick===pick)return"Can't parlay spread+ML";if(l.betType===bt&&l.pick===pick)return"Already added";}return null;};
  var addParlayLeg=function(gid,bt,pick,line,odds,gl){var c=isParlayConflict(gid,bt,pick);if(c)return showMsg(c,"error");setParlayLegs(function(prev){return[...prev,{gameId:gid,betType:bt,pick:pick,line:line,odds:odds,gameLabel:gl}];});};

  var placeParlay=async function(){
    var w=parseInt(parlayWager);if(!w||w<=0||parlayLegs.length<2)return showMsg("Need 2+ legs and wager","error");if(w>balance)return showMsg("Not enough!","error");
    try{var pg="parlay_"+Date.now();for(var i=0;i<parlayLegs.length;i++){var l=parlayLegs[i];await api("/api/bet",{method:"POST",body:JSON.stringify({pool_id:activePool.id,game_id:l.gameId,bet_type:l.betType,pick:l.pick,line:l.line,odds:l.odds,wager:w,parlay_group:pg,parlay_leg_index:i})});}
    setBalance(function(b){return b-w;});setBets(function(prev){return[{id:"b_"+Date.now(),bet_type:"parlay",parlay_group:pg,legs:parlayLegs.map(function(l){return{...l,bet_type:l.betType,result:"pending"};}),wager:w,result:"pending",potential_profit:calcParlayPayout(parlayLegs,w),created_at:new Date().toISOString()},...prev];});
    setParlayLegs([]);setParlayWager("");setSubTab("board");showMsg("Parlay: "+w+" to win "+calcParlayPayout(parlayLegs,w)+"!");}catch(e){showMsg(e.message,"error");}
  };

  var updateMember=async function(mid,action){try{await api("/api/pools/"+activePool.id+"/members/"+mid+"/"+action,{method:"POST"});setMembers(await api("/api/pools/"+activePool.id+"/members"));showMsg("Member "+action+"d!");}catch(e){showMsg(e.message,"error");}};
  var adjustBalance=async function(){if(!adjustAmt)return;try{await api("/api/pools/"+activePool.id+"/members/"+adjustModal.id+"/adjust-balance",{method:"POST",body:JSON.stringify({amount:parseInt(adjustAmt),reason:adjustReason})});setMembers(await api("/api/pools/"+activePool.id+"/members"));setAdjustModal(null);setAdjustAmt("");setAdjustReason("");showMsg("Adjusted!");}catch(e){showMsg(e.message,"error");}};
  var sendMessage=async function(){if(!msgInput.trim())return;try{var m=await api("/api/pools/"+activePool.id+"/messages",{method:"POST",body:JSON.stringify({content:msgInput})});setMessages(function(prev){return[...prev,m];});setMsgInput("");}catch(e){showMsg(e.message,"error");}};

  var loadLineHistory=async function(gameId,target){
    if(target==="board"){if(expandedGame===gameId){setExpandedGame(null);setLineHistory(null);return;}setExpandedGame(gameId);try{setLineHistory(await api("/api/games/"+gameId+"/line-history"));}catch(e){}}
    else{if(schedExpanded===gameId){setSchedExpanded(null);setSchedLineHist(null);setGameSummary(null);return;}setSchedExpanded(gameId);setGameSummary(null);try{setSchedLineHist(await api("/api/games/"+gameId+"/line-history"));}catch(e){}}
  };

  var loadGameSummary=async function(eid,gameAbbr){
    if(!eid&&!gameAbbr)return;setSummaryLoading(true);
    try{var data;if(eid){data=await api("/api/espn/summary/"+eid);}if((!data||(!data.boxscore?.teams?.length&&!data.scoringPlays?.length))&&gameAbbr){try{data=await api("/api/espn/summary-by-team/"+gameAbbr);}catch(e2){}}if(data)setGameSummary(data);}catch(e){}finally{setSummaryLoading(false);}
  };

  var viewPlayer=async function(username){setViewingPlayer(username);setViewingPlayerData(null);try{setViewingPlayerData(await api("/api/pools/"+activePool.id+"/profile/"+username));}catch(e){showMsg("Couldn't load profile","error");setViewingPlayer(null);}};

  var refreshPool=async function(){if(!activePool)return;try{var results=await Promise.all([api("/api/games/upcoming"),api("/api/pools/"+activePool.id+"/leaderboard"),api("/api/pools/"+activePool.id+"/my-bets")]);setGames(results[0]);setLeaderboard(results[1].map(function(x){return{...x,isYou:x.username===user.username};}));setBets(results[2]);try{setActivity(await api("/api/pools/"+activePool.id+"/activity"));}catch(e){}}catch(e){}};

  var betDesc=function(bt,pick,line,odds){if(bt==="spread")return tm(pick).abbr+" "+(line>0?"+":"")+line;if(bt==="over")return "Over "+line;if(bt==="under")return "Under "+line;return tm(pick).abbr+" ML";};

  // ═══ AUTH ═══
  if(!user){
    return(
      <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{maxWidth:400,margin:"0 auto",padding:"60px 20px"}}>
          <div style={{textAlign:"center",marginBottom:40}}><div style={{fontSize:44,fontWeight:900,letterSpacing:2,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>UFL POOL</div><div style={{color:C.dim,fontSize:14,marginTop:4}}>Fantasy Sportsbook for Your Crew</div></div>
          {msg&&<div style={{background:msg.type==="error"?"#2c0b0e":"#1e293b",border:"1px solid "+(msg.type==="error"?C.red:C.blue),borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13}}>{msg.t}</div>}
          {resetToken?(
            <Card><div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:18,fontWeight:700}}>Set New Password</div></div><div style={{marginBottom:12}}><label style={{fontSize:12,color:C.dim,display:"block",marginBottom:4}}>New Password</label><Input type="password" value={resetForm.password} onChange={function(e){setResetForm({...resetForm,password:e.target.value});}}/></div><div style={{marginBottom:20}}><label style={{fontSize:12,color:C.dim,display:"block",marginBottom:4}}>Confirm</label><Input type="password" value={resetForm.confirm} onChange={function(e){setResetForm({...resetForm,confirm:e.target.value});}} onKeyDown={function(e){if(e.key==="Enter")handleAuth();}}/></div><Btn full onClick={handleAuth} disabled={authLoading}>{authLoading?"...":"Reset Password"}</Btn></Card>
          ):forgotMode?(
            <Card><div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:18,fontWeight:700}}>Forgot Password</div></div><div style={{marginBottom:20}}><Input type="email" value={forgotEmail} onChange={function(e){setForgotEmail(e.target.value);}} placeholder="your@email.com" onKeyDown={function(e){if(e.key==="Enter")handleAuth();}}/></div><Btn full onClick={handleAuth} disabled={authLoading}>{authLoading?"...":"Send Reset Link"}</Btn><div style={{textAlign:"center",marginTop:12}}><button onClick={function(){setForgotMode(false);}} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:13}}>← Back</button></div></Card>
          ):(
            <Card>
              <div style={{display:"flex",marginBottom:20,borderRadius:8,overflow:"hidden",border:"1px solid "+C.border}}>{["login","register"].map(function(v){return <button key={v} onClick={function(){setAuthView(v);}} style={{flex:1,padding:"10px 0",background:authView===v?C.blue:"transparent",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14}}>{v==="login"?"Sign In":"Sign Up"}</button>;})}</div>
              {authView==="register"&&<div style={{marginBottom:12}}><label style={{fontSize:12,color:C.dim,display:"block",marginBottom:4}}>Display Name</label><Input value={authForm.displayName} onChange={function(e){setAuthForm({...authForm,displayName:e.target.value});}}/></div>}
              <div style={{marginBottom:12}}><label style={{fontSize:12,color:C.dim,display:"block",marginBottom:4}}>{authView==="login"?"Username or Email":"Username"}</label><Input value={authForm.username} onChange={function(e){setAuthForm({...authForm,username:e.target.value});}}/></div>
              {authView==="register"&&<div style={{marginBottom:12}}><label style={{fontSize:12,color:C.dim,display:"block",marginBottom:4}}>Email</label><Input type="email" value={authForm.email} onChange={function(e){setAuthForm({...authForm,email:e.target.value});}}/></div>}
              <div style={{marginBottom:authView==="login"?8:20}}><label style={{fontSize:12,color:C.dim,display:"block",marginBottom:4}}>Password</label><Input type="password" value={authForm.password} onChange={function(e){setAuthForm({...authForm,password:e.target.value});}} onKeyDown={function(e){if(e.key==="Enter")handleAuth();}}/></div>
              {authView==="login"&&<div style={{textAlign:"right",marginBottom:16}}><button onClick={function(){setForgotMode(true);}} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12}}>Forgot password?</button></div>}
              <Btn full onClick={handleAuth} disabled={authLoading}>{authLoading?"...":authView==="login"?"Sign In":"Create Account"}</Btn>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ═══ POOLS LIST ═══
  if(screen==="pools"){
    return(
      <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#0f172a)",padding:"16px 20px",borderBottom:"2px solid "+C.blue}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:600,margin:"0 auto"}}><div><div style={{fontSize:22,fontWeight:800,letterSpacing:1}}>UFL POOL</div><div style={{fontSize:12,color:C.dim}}>Welcome, {user.displayName}</div></div><Btn small bg="#374151" onClick={logout}>Sign Out</Btn></div></div>
        <div style={{maxWidth:600,margin:"0 auto",padding:"16px 20px"}}>
          {msg&&<div style={{background:msg.type==="error"?"#2c0b0e":"#1e293b",border:"1px solid "+(msg.type==="error"?C.red:C.blue),borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13}}>{msg.t}</div>}
          <div style={{fontSize:17,fontWeight:700,marginBottom:12}}>My Pools</div>
          {pools.length===0&&<Card style={{textAlign:"center",padding:30,color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>🏈</div><div style={{fontWeight:600}}>No pools yet</div></Card>}
          {pools.map(function(p){return(<Card key={p.id} onClick={function(){enterPool(p);}} style={{cursor:p.status==="pending"?"default":"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>{p.name}<Badge text={p.role} color={p.role==="admin"?C.purple:C.blue}/>{p.status==="pending"&&<Badge text="Pending" color={C.amber}/>}</div><div style={{fontSize:12,color:C.dim,marginTop:3}}>Code: {p.join_code} • {p.member_count||1} members</div></div>{p.status==="active"&&<div style={{fontWeight:800,fontSize:18,color:(p.balance||1000)>=1000?C.green:C.red}}>{(p.balance||1000).toLocaleString()}</div>}</Card>);})}
          <div style={{fontSize:15,fontWeight:700,margin:"24px 0 10px"}}>Create a Pool</div>
          <Card><Input placeholder="Pool Name" value={createForm.name} onChange={function(e){setCreateForm({...createForm,name:e.target.value});}} style={{marginBottom:10}}/><div style={{display:"flex",gap:10,marginBottom:12}}><div style={{flex:1}}><label style={{fontSize:12,color:C.dim}}>Starting Balance</label><Input type="number" value={createForm.balance} onChange={function(e){setCreateForm({...createForm,balance:parseInt(e.target.value)||1000});}}/></div><div style={{flex:1}}><label style={{fontSize:12,color:C.dim}}>Require Approval</label><div style={{marginTop:6}}><button onClick={function(){setCreateForm({...createForm,approval:!createForm.approval});}} style={{background:createForm.approval?C.green+"33":C.muted+"33",border:"1px solid "+(createForm.approval?C.green:C.muted),borderRadius:20,padding:"6px 16px",color:createForm.approval?C.green:C.muted,cursor:"pointer",fontWeight:600,fontSize:13}}>{createForm.approval?"Yes":"No"}</button></div></div></div><Btn full onClick={createPool}>Create Pool</Btn></Card>
          <div style={{fontSize:15,fontWeight:700,margin:"24px 0 10px"}}>Join a Pool</div>
          <Card><div style={{display:"flex",gap:8}}><Input placeholder="Join code" value={joinCode} onChange={function(e){setJoinCode(e.target.value.toUpperCase());}} onKeyDown={function(e){if(e.key==="Enter")joinPool();}} style={{flex:1}}/><Btn bg={C.purple} onClick={joinPool}>Join</Btn></div></Card>
        </div>
      </div>
    );
  }

  // ═══ POOL VIEW ═══
  var pc=members.filter(function(m){return m.status==="pending";}).length;
  var tab=subTab;
  var navItems=[
    {id:"bet",label:"Bet",icon:"🎯",subs:[["board","Board"],["parlay","Parlay"+(parlayLegs.length?" ("+parlayLegs.length+")":"")]]},
    {id:"games",label:"Games",icon:"🏈",subs:[["live","Live"],["schedule","Schedule"],["recap","Recap"]]},
    {id:"pool",label:"Pool",icon:"👥",subs:[["activity","Activity"],["chat","Chat"],["leaderboard","Standings"]]},
    {id:"me",label:"Me",icon:"📊",subs:[["profile","Profile"],["bets","My Bets"]]},
    {id:"news",label:"News",icon:"📰",subs:[["news","News"]]}
  ];
  if(myRole==="admin")navItems.push({id:"admin",label:"Admin"+(pc?" ("+pc+")":""),icon:"⚙️",subs:[["admin","Admin"]]});
  var switchSection=function(sid){setSection(sid);var nav=navItems.find(function(n){return n.id===sid;});if(nav?.subs?.[0])setSubTab(nav.subs[0][0]);setSidebarOpen(false);};
  var currentNav=navItems.find(function(n){return n.id===section;});

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {sidebarOpen&&<div onClick={function(){setSidebarOpen(false);}} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,left:sidebarOpen?0:-280,width:270,height:"100vh",background:"#0f1318",borderRight:"1px solid "+C.border,zIndex:300,transition:"left 0.25s ease",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid "+C.border}}><div style={{fontSize:22,fontWeight:900,letterSpacing:1,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>UFL POOL</div><div style={{fontSize:12,color:C.dim,marginTop:4}}>{activePool?.name}</div></div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>{navItems.map(function(nav){return(<button key={nav.id} onClick={function(){switchSection(nav.id);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"14px 20px",background:section===nav.id?C.blue+"22":"transparent",border:"none",borderLeft:section===nav.id?"3px solid "+C.blue:"3px solid transparent",color:section===nav.id?C.text:C.dim,cursor:"pointer",fontSize:15,fontWeight:section===nav.id?700:500,textAlign:"left"}}><span style={{fontSize:20}}>{nav.icon}</span><span>{nav.label}</span></button>);})}</div>
        <div style={{padding:"12px 16px",borderTop:"1px solid "+C.border}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><div style={{fontSize:13,fontWeight:600}}>{user.displayName}</div><div style={{fontSize:11,color:C.dim}}>@{user.username}</div></div><div style={{fontWeight:800,fontSize:16,color:balance>=1000?C.green:C.red}}>{balance.toLocaleString()}</div></div><button onClick={function(){setSidebarOpen(false);setLeaveConfirm(true);}} style={{width:"100%",padding:"8px 0",background:"#1e293b",border:"1px solid "+C.border,borderRadius:8,color:C.dim,cursor:"pointer",fontSize:12,fontWeight:600}}>← Back to Pools</button></div>
      </div>

      <div style={{background:"linear-gradient(135deg,#1e3a5f,#0f172a)",padding:"12px 16px",borderBottom:"2px solid "+C.blue,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={function(){setSidebarOpen(true);}} style={{background:"none",border:"none",color:C.text,cursor:"pointer",fontSize:22,padding:0,lineHeight:1}}>☰</button><div><div style={{fontSize:16,fontWeight:800}}>{activePool?.name}</div><div style={{fontSize:11,color:C.dim}}>{currentNav?.icon} {currentNav?.label}</div></div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:balance>=1000?C.green:balance>=500?C.amber:C.red}}>{balance.toLocaleString()}</div><div style={{fontSize:10,color:C.dim}}>pts</div></div>
        </div>
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"12px 16px"}}>
        {currentNav?.subs?.length>1&&(<div style={{display:"flex",gap:4,marginBottom:14}}>{currentNav.subs.map(function(s){return <button key={s[0]} onClick={function(){setSubTab(s[0]);}} style={{background:subTab===s[0]?C.blue:C.card,color:"#fff",border:subTab===s[0]?"none":"1px solid "+C.border,borderRadius:8,flex:1,padding:"9px 4px",cursor:"pointer",fontWeight:600,fontSize:13}}>{s[1]}</button>;})}</div>)}
        {msg&&<div style={{background:msg.type==="error"?"#2c0b0e":"#1e293b",border:"1px solid "+(msg.type==="error"?C.red:C.blue),borderRadius:8,padding:"8px 14px",marginBottom:12,fontSize:13,display:"flex",justifyContent:"space-between"}}><span>{msg.t}</span><button onClick={function(){setMsg(null);}} style={{background:"none",border:"none",color:C.dim,cursor:"pointer"}}>✕</button></div>}
        {leaveConfirm&&<ConfirmModal title="Leave Pool?" message="Go back to pools list?" onConfirm={function(){setLeaveConfirm(false);setScreen("pools");setActivePool(null);}} onCancel={function(){setLeaveConfirm(false);}} confirmText="Leave" confirmColor="#374151"/>}
        {betConfirm&&(<ConfirmModal title="Confirm Large Wager" message={"This is "+Math.round(betConfirm.wager/balance*100)+"% of your balance."} details={<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.dim}}>Pick:</span><strong>{betConfirm.pickLabel}</strong></div><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.dim}}>Wager:</span><strong>{betConfirm.wager} pts</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>To win:</span><strong style={{color:C.green}}>+{betConfirm.profit}</strong></div></div>} onConfirm={async function(){var bc={...betConfirm};setBetConfirm(null);await placeBetDirect(bc.gid,bc.bt,bc.pick,bc.line,bc.odds,bc.wager);}} onCancel={function(){setBetConfirm(null);}} confirmText="Place Bet" confirmColor={C.green}/>)}
        {loading&&<LoadingCard text="Loading pool..."/>}

        {/* BOARD / PARLAY */}
        {(tab==="board"||tab==="parlay")&&(<div>
          {games.filter(function(g){return g.status==="upcoming";}).length===0&&<Card style={{textAlign:"center",padding:30,color:C.muted}}>No upcoming games</Card>}
          {games.filter(function(g){return g.status==="upcoming";}).map(function(game){
            var aw=tm(game.away_team),hm=tm(game.home_team),isP=tab==="parlay";var time=new Date(game.commence_time),locked=isLocked(game.commence_time);
            var cSA=isP?isParlayConflict(game.id,"spread",game.away_team):null,cSH=isP?isParlayConflict(game.id,"spread",game.home_team):null,cMA=isP?isParlayConflict(game.id,"moneyline",game.away_team):null,cMH=isP?isParlayConflict(game.id,"moneyline",game.home_team):null;
            return(<Card key={game.id} style={locked?{opacity:0.5}:{}}>
              <div onClick={function(){loadLineHistory(game.id,"board");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:8}}><TmLogo team={aw} size={24}/><span style={{fontWeight:700,fontSize:15}}>{aw.abbr}</span><span style={{color:C.muted}}>@</span><span style={{fontWeight:700,fontSize:15}}>{hm.abbr}</span><TmLogo team={hm} size={24}/></div><div style={{textAlign:"right"}}><div style={{fontSize:11,color:locked?C.red:C.muted}}>{locked?"LOCKED":time.toLocaleDateString("en-US",{weekday:"short"})+" "+time.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div><div style={{fontSize:10,color:C.blue}}>{expandedGame===game.id?"▲ Hide":"▼ Lines"}</div></div></div>
              {expandedGame===game.id&&lineHistory&&(<div style={{marginBottom:10,padding:10,background:C.cardB,borderRadius:8}}><div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.amber}}>Line Movement</div><LineHistoryPanel data={lineHistory}/></div>)}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:4}}><div style={{fontSize:10,color:C.muted,textAlign:"center",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Spread</div><div style={{fontSize:10,color:C.muted,textAlign:"center",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Total</div><div style={{fontSize:10,color:C.muted,textAlign:"center",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>ML</div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                <BetBtn label={aw.abbr+" "+(game.spread_away>0?"+":"")+game.spread_away} sub="Spread" odds={-110} isParlay={isP} disabled={!!cSA} disabledMsg={cSA} gameTime={game.commence_time} onBet={function(w){placeBet(game.id,"spread",game.away_team,game.spread_away,-110,w);}} onParlay={function(){addParlayLeg(game.id,"spread",game.away_team,game.spread_away,-110,aw.abbr+"@"+hm.abbr);}}/>
                <BetBtn label={"O "+game.total} sub="Total" odds={-110} isParlay={isP} gameTime={game.commence_time} onBet={function(w){placeBet(game.id,"over","Over",game.total,-110,w);}} onParlay={function(){addParlayLeg(game.id,"over","Over",game.total,-110,aw.abbr+"@"+hm.abbr);}}/>
                <BetBtn label={aw.abbr+" "+(game.moneyline_away>0?"+":"")+game.moneyline_away} sub="ML" odds={game.moneyline_away} isParlay={isP} disabled={!!cMA} disabledMsg={cMA} gameTime={game.commence_time} onBet={function(w){placeBet(game.id,"moneyline",game.away_team,null,game.moneyline_away,w);}} onParlay={function(){addParlayLeg(game.id,"moneyline",game.away_team,null,game.moneyline_away,aw.abbr+"@"+hm.abbr);}}/>
                <BetBtn label={hm.abbr+" "+(game.spread_home>0?"+":"")+game.spread_home} sub="Spread" odds={-110} isParlay={isP} disabled={!!cSH} disabledMsg={cSH} gameTime={game.commence_time} onBet={function(w){placeBet(game.id,"spread",game.home_team,game.spread_home,-110,w);}} onParlay={function(){addParlayLeg(game.id,"spread",game.home_team,game.spread_home,-110,aw.abbr+"@"+hm.abbr);}}/>
                <BetBtn label={"U "+game.total} sub="Total" odds={-110} isParlay={isP} gameTime={game.commence_time} onBet={function(w){placeBet(game.id,"under","Under",game.total,-110,w);}} onParlay={function(){addParlayLeg(game.id,"under","Under",game.total,-110,aw.abbr+"@"+hm.abbr);}}/>
                <BetBtn label={hm.abbr+" "+(game.moneyline_home>0?"+":"")+game.moneyline_home} sub="ML" odds={game.moneyline_home} isParlay={isP} disabled={!!cMH} disabledMsg={cMH} gameTime={game.commence_time} onBet={function(w){placeBet(game.id,"moneyline",game.home_team,null,game.moneyline_home,w);}} onParlay={function(){addParlayLeg(game.id,"moneyline",game.home_team,null,game.moneyline_home,aw.abbr+"@"+hm.abbr);}}/>
              </div>
            </Card>);
          })}
        </div>)}

        {/* PARLAY SLIP */}
        {tab==="parlay"&&parlayLegs.length>0&&(<Card style={{border:"1px solid "+C.amber,position:"sticky",bottom:10,zIndex:10}}>
          <div style={{fontWeight:700,marginBottom:8,color:C.amber,fontSize:15}}>Parlay — {parlayLegs.length} Legs</div>
          {parlayLegs.map(function(l,i){var t=tm(l.pick);var d=l.betType==="spread"?t.abbr+" "+(l.line>0?"+":"")+l.line:l.betType==="over"?"Over "+l.line:l.betType==="under"?"Under "+l.line:t.abbr+" ML ("+fmtOdds(l.odds)+")";return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,borderBottom:i<parlayLegs.length-1?"1px solid "+C.border:"none"}}><span>{l.gameLabel}: <strong>{d}</strong></span><button onClick={function(){setParlayLegs(parlayLegs.filter(function(_,j){return j!==i;}));}} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontWeight:700}}>×</button></div>);})}
          <div style={{display:"flex",gap:8,marginTop:10}}><Input type="number" placeholder="Wager" value={parlayWager} onChange={function(e){setParlayWager(e.target.value);}} style={{flex:1}}/><Btn bg={C.amber} onClick={placeParlay}>Place</Btn></div>
          {parlayWager&&parseInt(parlayWager)>0&&(<div style={{marginTop:8,padding:"6px 10px",background:"#052e16",borderRadius:6,textAlign:"center"}}><span style={{fontSize:13,color:C.green,fontWeight:600}}>Win: +{calcParlayPayout(parlayLegs,parseInt(parlayWager))}</span></div>)}
        </Card>)}

        {/* LIVE */}
        {tab==="live"&&(<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.green}}><div style={{width:8,height:8,borderRadius:"50%",background:C.green}}/> Auto-refresh 30s</div><Btn small bg="#374151" onClick={refreshLive} disabled={liveRefreshing}>{liveRefreshing?"Refreshing...":"↻ Refresh Now"}</Btn></div>
          {liveData.length===0&&<Card style={{textAlign:"center",padding:30,color:C.muted}}>No games in progress</Card>}
          {liveData.map(function(g){
            var aw=tm(g.away_team),hm=tm(g.home_team),fin=g.status==="final";
            var ed=g.espn_detail||null;var isLiveGame=ed&&ed.state==="in";
            var gameBets=g.pool_bets||[];var groupedGameBets=groupBetsByParlay(gameBets);
            return(<Card key={g.id} style={{borderColor:fin?C.muted+"44":isLiveGame?C.green+"44":C.border}}>
              <div style={{background:"#111",borderRadius:8,padding:"12px 8px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:6}}>
                  <div style={{textAlign:"center",flex:1}}>{ed?.away_logo?<img src={ed.away_logo} alt="" style={{width:36,height:36,objectFit:"contain"}}/>:<TmLogo team={aw} size={36}/>}<div style={{fontSize:13,fontWeight:700,marginTop:4}}>{ed?.away_abbr||aw.abbr}</div>{ed?.away_record&&<div style={{fontSize:10,color:C.muted}}>({ed.away_record})</div>}<div style={{fontSize:32,fontWeight:800,marginTop:2}}>{g.away_score??ed?.away_score??"-"}</div></div>
                  <div style={{alignSelf:"center",textAlign:"center"}}>{fin?<Badge text="Final" color={C.muted}/>:isLiveGame?<div><Badge text="Live" color={C.green}/><div style={{fontSize:18,fontWeight:800,color:C.green,marginTop:4}}>{ed.detail||("Q"+ed.period)}</div><div style={{fontSize:14,color:C.text,fontWeight:600}}>{ed.clock}</div></div>:ed?.state==="pre"?<div><Badge text="Pre" color={C.amber}/><div style={{fontSize:11,color:C.dim,marginTop:4}}>{ed.detail||""}</div></div>:<Badge text={g.status||"—"} color={C.muted}/>}</div>
                  <div style={{textAlign:"center",flex:1}}>{ed?.home_logo?<img src={ed.home_logo} alt="" style={{width:36,height:36,objectFit:"contain"}}/>:<TmLogo team={hm} size={36}/>}<div style={{fontSize:13,fontWeight:700,marginTop:4}}>{ed?.home_abbr||hm.abbr}</div>{ed?.home_record&&<div style={{fontSize:10,color:C.muted}}>({ed.home_record})</div>}<div style={{fontSize:32,fontWeight:800,marginTop:2}}>{g.home_score??ed?.home_score??"-"}</div></div>
                </div>
                {ed?.linescores&&(<div style={{display:"grid",gridTemplateColumns:"60px repeat("+(ed.linescores.home.length||4)+", 1fr) 40px",gap:2,fontSize:11,marginTop:8,padding:"4px 8px",background:"#0a0c10",borderRadius:6}}><div style={{color:C.dim,fontWeight:600}}></div>{(ed.linescores.home||[]).map(function(_,qi){return <div key={qi} style={{textAlign:"center",color:C.dim,fontWeight:600}}>{"Q"+(qi+1)}</div>;})}<div style={{textAlign:"center",color:C.dim,fontWeight:700}}>T</div><div style={{fontWeight:600}}>{ed.away_abbr}</div>{(ed.linescores.away||[]).map(function(v,qi){return <div key={qi} style={{textAlign:"center"}}>{v!=null?v:"-"}</div>;})}<div style={{textAlign:"center",fontWeight:800}}>{g.away_score??"-"}</div><div style={{fontWeight:600}}>{ed.home_abbr}</div>{(ed.linescores.home||[]).map(function(v,qi){return <div key={qi} style={{textAlign:"center"}}>{v!=null?v:"-"}</div>;})}<div style={{textAlign:"center",fontWeight:800}}>{g.home_score??"-"}</div></div>)}
              </div>
              {isLiveGame&&ed?.situation&&(<div style={{background:ed.situation.isRedZone?"#7f1d1d33":C.cardB,border:ed.situation.isRedZone?"1px solid "+C.red+"44":"1px solid "+C.border,borderRadius:8,padding:"8px 12px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:14,color:ed.situation.isRedZone?C.red:C.text}}>{ed.situation.isRedZone?"🔴 ":""}{ed.situation.downDistanceText||""}</div>{ed.situation.possessionText&&<div style={{fontSize:12,color:C.dim,marginTop:2}}>Ball: {ed.situation.possessionText}</div>}</div><div style={{display:"flex",gap:12,fontSize:11}}><span style={{color:C.dim}}>TO: {ed.away_abbr} {ed.situation.awayTimeouts??"-"}</span><span style={{color:C.dim}}>{ed.home_abbr} {ed.situation.homeTimeouts??"-"}</span></div></div>{ed.lastPlay&&<div style={{fontSize:12,color:C.dim,marginTop:6,fontStyle:"italic",borderTop:"1px solid "+C.border+"44",paddingTop:6}}>Last: {ed.lastPlay.text}</div>}</div>)}
              {ed?.leaders&&ed.leaders.length>0&&!fin&&(<div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:4,textTransform:"uppercase"}}>Game Leaders</div><div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(ed.leaders.length,3)+", 1fr)",gap:6}}>{ed.leaders.slice(0,3).map(function(ld,li){return(<div key={li} style={{background:C.cardB,borderRadius:6,padding:"6px 8px"}}><div style={{fontSize:10,color:C.amber,fontWeight:700,marginBottom:3,textTransform:"uppercase"}}>{ld.shortName||ld.name}</div>{ld.athletes.map(function(a,ai){return <div key={ai} style={{fontSize:11,display:"flex",justifyContent:"space-between",padding:"1px 0"}}><span style={{fontWeight:600}}>{a.name}</span><span style={{color:C.dim}}>{a.value}</span></div>;})}</div>);})}</div></div>)}
              {groupedGameBets.length>0?(<div>
                <div style={{fontSize:12,fontWeight:700,color:C.dim,marginBottom:6,textTransform:"uppercase"}}>Pool Bets</div>
                {groupedGameBets.map(function(item,i){
                  if(item.isParlay){return(<div key={item.parlay_group||i} style={{background:C.cardB,borderRadius:8,padding:10,marginBottom:6,border:"1px solid "+C.purple+"33"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,fontSize:13}}>{item.display_name}</span><Badge text={"Parlay • "+item.legs.length+" legs"} color={C.purple}/></div><span style={{fontWeight:600,fontSize:13}}>{item.wager} pts</span></div>{item.legs.map(function(leg,j){var isThisGame=leg.game_id===g.id;var legKicked=leg.revealed||isThisGame||hasKickedOff(leg.commence_time);if(!legKicked&&games){var gm2=games.find(function(gx){return gx.id===leg.game_id;});if(gm2)legKicked=hasKickedOff(gm2.commence_time);}var legCol=leg.result==="win"?C.green:leg.result==="loss"?C.red:C.text;return(<div key={j} style={{fontSize:12,padding:"3px 0",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:j<item.legs.length-1?"1px solid "+C.border+"33":"none"}}>{legKicked?(<span><span style={{color:C.dim}}>{tm(leg.away_team).abbr}@{tm(leg.home_team).abbr}: </span><strong style={{color:legCol}}>{betDesc(leg.bet_type,leg.pick,leg.line,leg.odds)}</strong></span>):(<span style={{color:C.amber}}>🔒 Hidden until kickoff</span>)}{leg.result&&leg.result!=="pending"&&<Badge text={leg.result} color={leg.result==="win"?C.green:leg.result==="loss"?C.red:"#a3a3a3"}/>}</div>);})}</div>);}
                  var col=item.result==="win"?C.green:item.result==="loss"?C.red:C.text;
                  return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,borderBottom:i<groupedGameBets.length-1?"1px solid "+C.border:"none",color:col}}><span>{item.display_name}: {betDesc(item.bet_type,item.pick,item.line,item.odds)}</span><span style={{fontWeight:600}}>{item.wager} pts</span></div>);
                })}
              </div>):(<div style={{fontSize:12,color:C.muted,textAlign:"center"}}>No pool bets</div>)}
            </Card>);
          })}
        </div>)}

        {/* SCHEDULE */}
        {tab==="schedule"&&(<div>
          {schedule.length===0&&<LoadingCard text="Loading schedule..."/>}
          {schedule.length>0&&(<div>
            <div style={{display:"flex",gap:4,marginBottom:12,overflowX:"auto",paddingBottom:4}}>{schedule.map(function(w){return <button key={w.week} onClick={function(){setScheduleWeek(w.week);setSchedExpanded(null);setSchedLineHist(null);setGameSummary(null);}} style={{background:scheduleWeek===w.week?C.blue:C.card,color:"#fff",border:scheduleWeek===w.week?"none":"1px solid "+C.border,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>Wk {w.week}</button>;})}</div>
            {schedule.filter(function(w){return w.week===scheduleWeek;}).map(function(wk){
              return wk.games.map(function(g,gi){
                var aw=tm(g.away_team),hm=tm(g.home_team),fin=g.status==="final"||g.status==="STATUS_FINAL";
                var time=new Date(g.date||g.commence_time),gk=g.odds_game_id||g.id||gi,isExp=schedExpanded===gk;
                return(<Card key={gk}>
                  <div onClick={function(){if(isExp){setSchedExpanded(null);setSchedLineHist(null);setGameSummary(null);return;}setSchedExpanded(gk);setSchedLineHist(null);setGameSummary(null);if(g.odds_game_id)api("/api/games/"+g.odds_game_id+"/line-history").then(setSchedLineHist).catch(function(){});loadGameSummary(g.espn_id,g.home_abbr||hm.abbr);}} style={{cursor:"pointer"}}>
                    {fin?(<div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:8,padding:"8px 0",background:"#111",borderRadius:6}}><div style={{textAlign:"center"}}><TmLogo team={aw} size={28}/><div style={{fontSize:12,color:C.dim,marginTop:2}}>{g.away_abbr||aw.abbr}</div>{g.away_record&&<div style={{fontSize:10,color:C.muted}}>({g.away_record})</div>}<div style={{fontSize:22,fontWeight:800,color:g.away_score>g.home_score?C.green:C.text}}>{g.away_score}</div></div><div style={{alignSelf:"center"}}><Badge text="Final" color={C.muted}/></div><div style={{textAlign:"center"}}><TmLogo team={hm} size={28}/><div style={{fontSize:12,color:C.dim,marginTop:2}}>{g.home_abbr||hm.abbr}</div>{g.home_record&&<div style={{fontSize:10,color:C.muted}}>({g.home_record})</div>}<div style={{fontSize:22,fontWeight:800,color:g.home_score>g.away_score?C.green:C.text}}>{g.home_score}</div></div></div>)
                    :(<div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8,padding:"8px 0",background:"#111",borderRadius:6}}><div style={{textAlign:"center"}}><TmLogo team={aw} size={28}/><div style={{fontWeight:700,fontSize:15,marginTop:4}}>{g.away_abbr||aw.abbr}</div>{g.away_record&&<div style={{fontSize:10,color:C.muted}}>({g.away_record})</div>}</div><div style={{alignSelf:"center",fontSize:12,color:C.dim}}>vs</div><div style={{textAlign:"center"}}><TmLogo team={hm} size={28}/><div style={{fontWeight:700,fontSize:15,marginTop:4}}>{g.home_abbr||hm.abbr}</div>{g.home_record&&<div style={{fontSize:10,color:C.muted}}>({g.home_record})</div>}</div></div>)}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:12,color:C.dim}}>{time.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} • {time.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}{g.tv&&<span style={{color:C.amber}}> • 📺 {g.tv}</span>}{g.venue&&<span> • {g.venue}</span>}</div><div style={{fontSize:10,color:C.blue}}>{isExp?"▲ Hide":"▼ Details"}</div></div>
                    {!isExp&&g.spread_home!=null&&(<div style={{display:"flex",gap:12,marginTop:6,fontSize:12,color:C.dim}}>{g.spread_home!=null&&<span>Spd: {g.spread_home>0?"+":""}{g.spread_home}</span>}{g.total!=null&&<span>O/U: {g.total}</span>}{g.moneyline_home!=null&&<span>ML: {g.moneyline_home}/{g.moneyline_away}</span>}</div>)}
                  </div>
                  {isExp&&(<div style={{marginTop:10}}>
                    {g.spread_home!=null&&(<div style={{padding:10,background:C.cardB,borderRadius:8,marginBottom:8}}><div style={{fontWeight:700,fontSize:13,marginBottom:6}}>{fin?"Closing":"Current"} Lines</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,fontSize:13}}><div><div style={{fontSize:10,color:C.dim}}>Spread</div><div style={{fontWeight:600}}>{hm.abbr} {g.spread_home>0?"+":""}{g.spread_home}</div></div><div><div style={{fontSize:10,color:C.dim}}>Total</div><div style={{fontWeight:600}}>{g.total||"—"}</div></div><div><div style={{fontSize:10,color:C.dim}}>ML</div><div style={{fontWeight:600}}>{g.moneyline_home||"—"}/{g.moneyline_away||"—"}</div></div></div></div>)}
                    {schedLineHist&&schedExpanded===gk&&(<div style={{padding:10,background:C.cardB,borderRadius:8,marginBottom:8}}><div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.amber}}>Line Movement</div><LineHistoryPanel data={schedLineHist}/></div>)}
                    {gameSummary&&schedExpanded===gk&&(<div style={{padding:10,background:C.cardB,borderRadius:8,marginBottom:8}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.green}}>Game Stats</div>
                      {gameSummary.leaders?.length>0&&(<div style={{marginBottom:10}}><div style={{fontSize:11,color:C.dim,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Leaders</div><div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(gameSummary.leaders.length,3)+", 1fr)",gap:6}}>{gameSummary.leaders.slice(0,3).map(function(ld,li){return(<div key={li} style={{background:C.bg,borderRadius:6,padding:"6px 8px"}}><div style={{fontSize:10,color:C.amber,fontWeight:700,marginBottom:3,textTransform:"uppercase"}}>{ld.shortDisplayName||ld.displayName||ld.name||""}</div>{(ld.leaders||[]).slice(0,2).map(function(a,ai){return <div key={ai} style={{fontSize:11,display:"flex",justifyContent:"space-between",padding:"1px 0"}}><span style={{fontWeight:600}}>{a.athlete?.displayName||a.displayName||""}</span><span style={{color:C.dim}}>{a.displayValue||a.value||""}</span></div>;})}</div>);})}</div></div>)}
                      {gameSummary.scoringPlays?.length>0&&(<div style={{marginBottom:10}}><div style={{fontSize:11,color:C.dim,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Scoring</div>{gameSummary.scoringPlays.map(function(sp,si){var st=espnTeams.find(function(t){return t.id===sp.team?.id?.toString()||t.id===(sp.team?.id);});return(<div key={si} style={{fontSize:12,padding:"4px 0",borderBottom:"1px solid "+C.border+"22",display:"flex",gap:8,alignItems:"center"}}>{st&&<TmLogo team={{logo:st.logo,color:st.color}} size={14}/>}<span style={{color:C.dim,minWidth:30}}>{sp.clock?.displayValue||sp.clock||""}</span><span style={{flex:1}}>{(sp.text||sp.shortText||"").substring(0,80)}</span><span style={{fontWeight:700}}>{sp.awayScore}-{sp.homeScore}</span></div>);})}</div>)}
                      {gameSummary.boxscore?.teams?.length>0&&(<div><div style={{fontSize:11,color:C.dim,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Team Stats</div>{gameSummary.boxscore.teams.map(function(t,ti){var ti2=espnTeams.find(function(x){return x.id===t.team?.id?.toString()||x.id===(t.team?.id);});var stats=t.statistics||t.stats||[];if(!stats.length)return null;return(<div key={ti} style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{ti2&&<TmLogo team={{logo:ti2.logo,color:ti2.color}} size={16}/>}<span style={{fontWeight:700,fontSize:13}}>{t.team?.displayName||t.team?.abbreviation||""}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4}}>{stats.slice(0,8).map(function(s,si){return <div key={si} style={{fontSize:11,padding:"3px 4px",background:C.bg,borderRadius:4}}><div style={{color:C.dim,fontSize:9}}>{s.label||s.name||s.displayName||""}</div><div style={{fontWeight:600}}>{s.displayValue||s.value||"—"}</div></div>;})}</div></div>);})}</div>)}
                      {gameSummary.boxscore?.players?.length>0&&(<div style={{marginTop:8}}><div style={{fontSize:11,color:C.dim,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Key Players</div>{gameSummary.boxscore.players.map(function(pt,pti){var ti3=espnTeams.find(function(x){return x.id===pt.team?.id?.toString()||x.id===(pt.team?.id);});var statGroups=pt.statistics||pt.stats||[];if(!statGroups.length)return null;return(<div key={pti} style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4,fontSize:12,fontWeight:700}}>{ti3&&<TmLogo team={{logo:ti3.logo,color:ti3.color}} size={14}/>}{pt.team?.displayName||""}</div>{statGroups.slice(0,3).map(function(sg,sgi){var athletes=sg.athletes||sg.leaders||[];if(!athletes.length)return null;return(<div key={sgi} style={{marginBottom:4}}><div style={{fontSize:10,color:C.amber,fontWeight:600}}>{sg.name||sg.displayName||""}</div>{athletes.slice(0,2).map(function(a,ai){var name=a.athlete?.displayName||a.displayName||a.name||"";var statLine=Array.isArray(a.stats)?a.stats.join(", "):(a.displayValue||a.value||"");return <div key={ai} style={{fontSize:12,display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span>{name}</span><span style={{color:C.dim}}>{statLine}</span></div>;})}</div>);})}</div>);})}</div>)}
                      {!gameSummary.boxscore?.teams?.length&&!gameSummary.scoringPlays?.length&&!gameSummary.leaders?.length&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:10}}>No detailed stats available</div>}
                    </div>)}
                    {summaryLoading&&schedExpanded===gk&&<div style={{textAlign:"center",padding:10}}><Spinner/></div>}
                  </div>)}
                </Card>);
              });
            })}
          </div>)}
        </div>)}

        {/* RECAP */}
        {tab==="recap"&&(<div>
          {schedule.length===0&&(<div style={{marginBottom:12}}><Btn full onClick={function(){api("/api/schedule").then(function(s){setSchedule(s);if(s.length)setRecapWeek(s[s.length-1].week);}).catch(function(){});}}>Load Weeks</Btn></div>)}
          {schedule.length>0&&(<div style={{display:"flex",gap:4,marginBottom:12,overflowX:"auto"}}>{schedule.map(function(w){return <button key={w.week} onClick={function(){setRecapWeek(w.week);}} style={{background:recapWeek===w.week?C.blue:C.card,color:"#fff",border:recapWeek===w.week?"none":"1px solid "+C.border,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>Wk {w.week}</button>;})}</div>)}
          {recapWeek&&!recapData&&<LoadingCard text="Loading recap..."/>}
          {recapData&&(<div>
            <Card style={{borderColor:C.amber+"44"}}><div style={{fontWeight:800,fontSize:18,color:C.amber,marginBottom:12}}>Week {recapData.week} Recap</div><div style={{fontSize:12,fontWeight:700,color:C.dim,marginBottom:6,textTransform:"uppercase"}}>Results</div>{recapData.games?.map(function(g,i){var aw2=tm(g.away_team),hm2=tm(g.home_team);return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+C.border+"22"}}><div style={{display:"flex",alignItems:"center",gap:6}}><TmLogo team={aw2} size={18}/><span style={{fontWeight:g.away_score>g.home_score?700:400,color:g.away_score>g.home_score?C.green:C.text}}>{aw2.abbr} {g.away_score}</span></div><span style={{color:C.muted,fontSize:11}}>vs</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:g.home_score>g.away_score?700:400,color:g.home_score>g.away_score?C.green:C.text}}>{hm2.abbr} {g.home_score}</span><TmLogo team={hm2} size={18}/></div></div>);})}</Card>
            {recapData.playerSummaries?.length>0&&(<Card><div style={{fontWeight:700,fontSize:15,marginBottom:10}}>Player Performance</div>{recapData.playerSummaries.map(function(p,i){var pr=parseInt(p.week_profit);return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<recapData.playerSummaries.length-1?"1px solid "+C.border:"none"}}><div><span style={{fontWeight:700}}>{i===0?"🏆 ":""}{p.display_name}</span><div style={{fontSize:11,color:C.dim}}>{p.wins}W-{p.losses}L</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:pr>=0?C.green:C.red}}>{pr>=0?"+":""}{pr} pts</div></div></div>);})}</Card>)}
            <Card><div style={{fontWeight:700,fontSize:15,marginBottom:10}}>Highlights</div>{recapData.bigWin&&(<div style={{padding:10,background:"#052e1633",borderRadius:8,marginBottom:8}}><div style={{fontSize:12,color:C.green,fontWeight:700,marginBottom:4}}>💰 Biggest Win</div><div style={{fontSize:14}}><strong>{recapData.bigWin.display_name}</strong> won <strong style={{color:C.green}}>+{recapData.bigWin.payout-recapData.bigWin.wager}</strong> on {tm(recapData.bigWin.pick).abbr} ({recapData.bigWin.wager} wager)</div></div>)}{recapData.bigLoss&&(<div style={{padding:10,background:"#2c0b0e33",borderRadius:8}}><div style={{fontSize:12,color:C.red,fontWeight:700,marginBottom:4}}>😤 Biggest Loss</div><div style={{fontSize:14}}><strong>{recapData.bigLoss.display_name}</strong> lost <strong style={{color:C.red}}>{recapData.bigLoss.wager}</strong> on {tm(recapData.bigLoss.pick).abbr}</div></div>)}{!recapData.bigWin&&!recapData.bigLoss&&<div style={{color:C.muted,textAlign:"center",padding:10}}>No graded bets yet</div>}</Card>
          </div>)}
        </div>)}

        {/* ACTIVITY */}
        {tab==="activity"&&(<div>
          {activity.length===0&&<Card style={{textAlign:"center",color:C.muted,padding:30}}>No bets yet</Card>}
          {(function(){var grouped=groupBetsByParlay(activity);return grouped.map(function(it,i){
            if(it.isParlay)return <ParlayBetCard key={it.parlay_group||i} parlay={it} tm={tm} betDesc={betDesc} allGames={games} showUser={true}/>;
            return(<Card key={i} style={{borderColor:it.result==="win"?C.green+"44":it.result==="loss"?C.red+"44":C.border}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,fontSize:14}}>{it.display_name}</span>{it.is_own&&<Badge text="You" color={C.blue}/>}</div><Badge text={it.result} color={it.result==="win"?C.green:it.result==="loss"?C.red:it.result==="push"?"#a3a3a3":C.blue}/></div><div style={{fontSize:14}}>{it.revealed||hasKickedOff(it.commence_time)?(<span><span style={{color:C.dim,fontSize:12}}>{tm(it.away_team).abbr}@{tm(it.home_team).abbr}: </span><strong>{betDesc(it.bet_type,it.pick,it.line,it.odds)}</strong><span style={{color:C.dim,fontSize:12}}> • {it.wager} pts</span></span>):(<span style={{color:C.amber}}>🔒 {it.wager} pts — Hidden until kickoff</span>)}</div>{it.result==="win"&&it.payout>0&&<div style={{fontSize:12,color:C.green,marginTop:4}}>Won +{it.payout-it.wager}</div>}<div style={{fontSize:11,color:C.muted,marginTop:4}}>{new Date(it.created_at).toLocaleString()}</div></Card>);
          });})()}
        </div>)}

        {/* CHAT */}
        {tab==="chat"&&(<Card style={{padding:0,display:"flex",flexDirection:"column",height:500}}><div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontWeight:700}}>League Chat</div><div style={{flex:1,overflowY:"auto",padding:"8px 16px"}}>{messages.length===0&&<div style={{textAlign:"center",color:C.muted,padding:40,fontSize:13}}>Start the trash talk!</div>}{messages.map(function(m,i){var me=m.username===user.username;var sys=m.content.startsWith("[ADMIN]");return(<div key={m.id||i} style={{marginBottom:8,textAlign:me?"right":"left"}}>{sys?(<div style={{background:C.purple+"22",border:"1px solid "+C.purple+"33",borderRadius:8,padding:"6px 10px",fontSize:12,color:C.purple,textAlign:"center"}}>{m.content}</div>):(<div><div style={{fontSize:11,color:C.dim,marginBottom:2}}>{me?"You":m.display_name}</div><div style={{display:"inline-block",background:me?C.blue+"33":"#1e293b",borderRadius:12,padding:"8px 12px",fontSize:14,maxWidth:"80%",textAlign:"left"}}>{m.content}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{new Date(m.created_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div></div>)}</div>);})}<div ref={chatEndRef}/></div><div style={{display:"flex",gap:8,padding:"8px 12px",borderTop:"1px solid "+C.border}}><Input placeholder="Type a message..." value={msgInput} onChange={function(e){setMsgInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")sendMessage();}} style={{flex:1}}/><Btn small onClick={sendMessage}>Send</Btn></div></Card>)}

        {/* NEWS */}
        {tab==="news"&&(<div><div style={{fontSize:17,fontWeight:700,marginBottom:12}}>UFL News</div>{news.length===0&&<LoadingCard text="Loading news..."/>}{news.map(function(a,i){return(<Card key={i} onClick={function(){if(a.links?.web?.href)window.open(a.links.web.href,"_blank");}} style={{cursor:"pointer"}}>{a.images?.[0]&&<img src={a.images[0].url} alt="" style={{width:"100%",height:160,objectFit:"cover",borderRadius:8,marginBottom:10}}/>}<div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{a.headline}</div><div style={{fontSize:13,color:C.dim,lineHeight:1.5,marginBottom:6}}>{a.description?.substring(0,200)}{a.description?.length>200?"...":""}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}><span>{a.byline||"ESPN"}</span><span>{new Date(a.published).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span></div></Card>);})}</div>)}

        {/* PROFILE */}
        {tab==="profile"&&(<div>{!profile&&<LoadingCard text="Loading profile..."/>}{profile&&(<div>
          <Card style={{textAlign:"center",padding:20}}><div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{profile.display_name}</div><div style={{fontSize:13,color:C.dim}}>@{profile.username}</div><div style={{fontSize:32,fontWeight:800,color:profile.balance>=1000?C.green:C.red,marginTop:8}}>{profile.balance?.toLocaleString()} pts</div>{profile.streak?.count>0&&<div style={{marginTop:6}}><Badge text={profile.streak.count+" "+profile.streak.type+" streak"} color={profile.streak.type==="win"?C.green:C.red}/></div>}</Card>
          <Card><div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Stats</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}><div style={{textAlign:"center",padding:10,background:C.cardB,borderRadius:8}}><div style={{fontSize:20,fontWeight:800,color:C.green}}>{profile.stats?.win_rate||0}%</div><div style={{fontSize:10,color:C.dim}}>Win Rate</div></div><div style={{textAlign:"center",padding:10,background:C.cardB,borderRadius:8}}><div style={{fontSize:20,fontWeight:800,color:parseFloat(profile.stats?.roi||0)>=0?C.green:C.red}}>{profile.stats?.roi||0}%</div><div style={{fontSize:10,color:C.dim}}>ROI</div></div><div style={{textAlign:"center",padding:10,background:C.cardB,borderRadius:8}}><div style={{fontSize:20,fontWeight:800}}>{parseInt(profile.stats?.total_bets||0)}</div><div style={{fontSize:10,color:C.dim}}>Bets</div></div></div></Card>
          <Card><div style={{fontWeight:700,fontSize:15,marginBottom:8}}>P&L</div><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border}}><span style={{color:C.dim,fontSize:13}}>Total Wagered</span><span style={{fontWeight:600}}>{parseInt(profile.stats?.total_wagered||0).toLocaleString()}</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}><span style={{color:C.dim,fontSize:13}}>Net Profit</span><span style={{fontWeight:700,color:parseInt(profile.stats?.net_profit||0)>=0?C.green:C.red}}>{parseInt(profile.stats?.net_profit||0)>=0?"+":""}{parseInt(profile.stats?.net_profit||0).toLocaleString()}</span></div></Card>
          {profile.byType?.length>0&&(<Card><div style={{fontWeight:700,fontSize:15,marginBottom:8}}>By Type</div>{profile.byType.map(function(bt,i){var wr=parseInt(bt.total)>0?Math.round((parseInt(bt.wins)/(parseInt(bt.wins)+parseInt(bt.losses)))*100):0;return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<profile.byType.length-1?"1px solid "+C.border:"none"}}><span style={{fontWeight:600,textTransform:"capitalize"}}>{bt.bet_type}</span><div style={{display:"flex",gap:12,fontSize:13}}><span style={{color:C.green}}>{bt.wins}W</span><span style={{color:C.red}}>{bt.losses}L</span><span style={{color:C.dim}}>{wr}%</span></div></div>);})}</Card>)}
        </div>)}</div>)}

        {/* MY BETS */}
        {tab==="bets"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:700,fontSize:17}}>My Bets</div><Btn small bg="#374151" onClick={function(){downloadCSV("/api/pools/"+activePool.id+"/export/bets");}}>CSV</Btn></div>
          {bets.length===0&&<Card style={{textAlign:"center",color:C.muted,padding:30}}>No bets yet</Card>}
          {(function(){var grouped=groupBetsByParlay(bets);return grouped.map(function(item,i){
            if(item.isParlay)return <ParlayBetCard key={item.parlay_group||i} parlay={item} tm={tm} betDesc={betDesc} allGames={games} showUser={false}/>;
            var b=item;var isPend=b.result==="pending";
            return(<Card key={b.id||i} style={{borderColor:b.result==="win"?C.green+"44":b.result==="loss"?C.red+"44":C.border}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:C.dim,textTransform:"uppercase",fontWeight:600}}>{b.bet_type}</span><Badge text={b.result} color={b.result==="win"?C.green:b.result==="loss"?C.red:b.result==="push"?"#a3a3a3":C.blue}/></div><div style={{fontWeight:600,fontSize:14,marginTop:6}}><span>{tm(b.pick).abbr||b.pick} {b.line?(b.bet_type==="over"?"O "+b.line:b.bet_type==="under"?"U "+b.line:(b.line>0?"+":"")+b.line):"ML"} ({fmtOdds(b.odds)})</span></div><div style={{marginTop:8,padding:"6px 10px",background:C.cardB,borderRadius:6,display:"flex",justifyContent:"space-between",fontSize:12}}><div><span style={{color:C.dim}}>Wager: </span><span style={{fontWeight:700}}>{b.wager}</span></div>{isPend&&<div><span style={{color:C.dim}}>To win: </span><span style={{fontWeight:700,color:C.green}}>+{b.potential_profit||calcPayout(b.wager,b.odds)}</span></div>}{b.result==="win"&&<div style={{color:C.green,fontWeight:700}}>+{(b.payout||0)-b.wager}</div>}{b.result==="loss"&&<div style={{color:C.red,fontWeight:700}}>-{b.wager}</div>}{b.result==="push"&&<div style={{color:"#a3a3a3",fontWeight:700}}>Returned</div>}</div></Card>);
          });})()}
        </div>)}

        {/* LEADERBOARD */}
        {tab==="leaderboard"&&(<Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontWeight:700,fontSize:17}}>Standings</div><Btn small bg="#374151" onClick={function(){downloadCSV("/api/pools/"+activePool.id+"/export/standings");}}>CSV</Btn></div>
          {[...leaderboard].sort(function(a,b){return(parseInt(b.display_balance)||b.balance)-(parseInt(a.display_balance)||a.balance);}).map(function(p,i){var bal=parseInt(p.display_balance||p.balance);var pend=parseInt(p.pending_amount||0);return(<div key={i} onClick={function(){viewPlayer(p.username);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",borderRadius:10,marginBottom:4,background:i===0?"linear-gradient(135deg,#1e3a5f,#0f172a)":p.isYou?"#1a2332":"transparent",border:p.isYou?"1px solid "+C.blue:"1px solid transparent",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontWeight:900,fontSize:20,color:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7f32":"#4b5563",width:28}}>{i+1}</span><div><span style={{fontWeight:600}}>{p.display_name}{p.isYou?" (You)":""}</span><div style={{fontSize:11,color:C.muted}}>{p.wins||0}W-{p.losses||0}L{p.pushes?"-"+p.pushes+"P":""} • <span style={{color:C.blue}}>View</span></div></div></div><div style={{textAlign:"right"}}><span style={{fontWeight:700,fontSize:18,color:bal>=1000?C.green:bal>=500?C.amber:C.red}}>{bal.toLocaleString()}</span>{pend>0&&<div style={{fontSize:11,color:C.amber}}>{pend.toLocaleString()} at risk</div>}</div></div>);})}
        </Card>)}

        {/* PLAYER PROFILE MODAL */}
        {viewingPlayer&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px",overflowY:"auto"}} onClick={function(){setViewingPlayer(null);setViewingPlayerData(null);}}>
          <div style={{background:C.bg,borderRadius:16,maxWidth:500,width:"100%",border:"1px solid "+C.border,maxHeight:"85vh",overflowY:"auto"}} onClick={function(e){e.stopPropagation();}}>
            {!viewingPlayerData&&<div style={{padding:40,textAlign:"center"}}><Spinner/><div style={{marginTop:8,color:C.muted}}>Loading...</div></div>}
            {viewingPlayerData&&(<div>
              <div style={{padding:"20px 20px 16px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:20,fontWeight:800}}>{viewingPlayerData.display_name}</div><div style={{fontSize:13,color:C.dim}}>@{viewingPlayerData.username} • {viewingPlayerData.role}</div></div><button onClick={function(){setViewingPlayer(null);setViewingPlayerData(null);}} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:22}}>✕</button></div>
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-around",marginBottom:16,padding:"12px 0",background:C.card,borderRadius:10}}><div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.green}}>{viewingPlayerData.stats?.win_rate||0}%</div><div style={{fontSize:10,color:C.dim}}>Win Rate</div></div><div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:parseFloat(viewingPlayerData.stats?.roi||0)>=0?C.green:C.red}}>{viewingPlayerData.stats?.roi||0}%</div><div style={{fontSize:10,color:C.dim}}>ROI</div></div><div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800}}>{parseInt(viewingPlayerData.stats?.total_bets||0)}</div><div style={{fontSize:10,color:C.dim}}>Bets</div></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}><div style={{textAlign:"center",padding:8,background:C.card,borderRadius:8}}><div style={{fontSize:16,fontWeight:700,color:C.green}}>{parseInt(viewingPlayerData.stats?.wins||0)}</div><div style={{fontSize:10,color:C.dim}}>W</div></div><div style={{textAlign:"center",padding:8,background:C.card,borderRadius:8}}><div style={{fontSize:16,fontWeight:700,color:C.red}}>{parseInt(viewingPlayerData.stats?.losses||0)}</div><div style={{fontSize:10,color:C.dim}}>L</div></div><div style={{textAlign:"center",padding:8,background:C.card,borderRadius:8}}><div style={{fontSize:16,fontWeight:700,color:"#a3a3a3"}}>{parseInt(viewingPlayerData.stats?.pushes||0)}</div><div style={{fontSize:10,color:C.dim}}>P</div></div><div style={{textAlign:"center",padding:8,background:C.card,borderRadius:8}}><div style={{fontSize:16,fontWeight:700,color:parseInt(viewingPlayerData.stats?.net_profit||0)>=0?C.green:C.red}}>{parseInt(viewingPlayerData.stats?.net_profit||0)>=0?"+":""}{parseInt(viewingPlayerData.stats?.net_profit||0)}</div><div style={{fontSize:10,color:C.dim}}>Net</div></div></div>
                {viewingPlayerData.streak?.count>0&&<div style={{marginBottom:16,textAlign:"center"}}><Badge text={viewingPlayerData.streak.count+" "+viewingPlayerData.streak.type+" streak"} color={viewingPlayerData.streak.type==="win"?C.green:C.red}/></div>}
                {viewingPlayerData.byType?.length>0&&(<div style={{marginBottom:16}}><div style={{fontWeight:700,fontSize:14,marginBottom:8}}>By Bet Type</div>{viewingPlayerData.byType.map(function(bt,i){var wr=parseInt(bt.total)>0?Math.round((parseInt(bt.wins)/(parseInt(bt.wins)+parseInt(bt.losses)))*100):0;return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<viewingPlayerData.byType.length-1?"1px solid "+C.border:"none"}}><span style={{fontWeight:600,textTransform:"capitalize"}}>{bt.bet_type}</span><div style={{display:"flex",gap:12,fontSize:13}}><span style={{color:C.green}}>{bt.wins}W</span><span style={{color:C.red}}>{bt.losses}L</span><span style={{color:C.dim}}>{wr}%</span></div></div>);})}</div>)}
                {viewingPlayerData.recentBets?.length>0&&(<div><div style={{fontWeight:700,fontSize:14,marginBottom:8}}>Recent Bets</div>{viewingPlayerData.recentBets.map(function(b,i){var col=b.result==="win"?C.green:b.result==="loss"?C.red:"#a3a3a3";return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<viewingPlayerData.recentBets.length-1?"1px solid "+C.border:"none"}}><div><div style={{fontSize:13}}><span style={{color:C.dim}}>{tm(b.away_team).abbr}@{tm(b.home_team).abbr}: </span><strong>{betDesc(b.bet_type,b.pick,b.line,b.odds)}</strong></div><div style={{fontSize:11,color:C.dim}}>{new Date(b.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:col}}>{b.result==="win"?"+"+(b.payout-b.wager):b.result==="loss"?"-"+b.wager:"Push"}</div><div style={{fontSize:11,color:C.dim}}>{b.wager} wagered</div></div></div>);})}</div>)}
                {(!viewingPlayerData.recentBets||!viewingPlayerData.recentBets.length)&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:10}}>No graded bets yet</div>}
              </div>
            </div>)}
          </div>
        </div>)}

        {/* ADMIN */}
        {tab==="admin"&&myRole==="admin"&&(<div>
          <Card style={{borderColor:C.purple+"44"}}>
            <div style={{fontWeight:700,fontSize:17,marginBottom:4,color:C.purple}}>Admin</div>
            <div style={{display:"flex",gap:0,marginBottom:16,marginTop:12,borderRadius:8,overflow:"hidden",border:"1px solid "+C.border}}>{[["pending","Pending ("+members.filter(function(m){return m.status==="pending";}).length+")"],["active","Active"],["deactivated","Off"]].map(function(item){return <button key={item[0]} onClick={function(){setAdminTab(item[0]);}} style={{flex:1,padding:"8px 0",background:adminTab===item[0]?C.purple:"transparent",color:"#fff",border:"none",cursor:"pointer",fontWeight:600,fontSize:12}}>{item[1]}</button>;})}</div>
            {adminTab==="pending"&&(members.filter(function(m){return m.status==="pending";}).length===0?<div style={{textAlign:"center",padding:20,color:C.muted}}>None</div>:members.filter(function(m){return m.status==="pending";}).map(function(m){return(<div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:10,marginBottom:6,background:C.cardB}}><div><div style={{fontWeight:700}}>{m.display_name}</div><div style={{fontSize:12,color:C.dim}}>@{m.username}</div></div><div style={{display:"flex",gap:6}}><Btn small bg={C.green} onClick={function(){updateMember(m.id,"approve");}}>Approve</Btn><Btn small bg={C.red} onClick={function(){updateMember(m.id,"deactivate");}}>Deny</Btn></div></div>);}))}
            {adminTab==="active"&&members.filter(function(m){return m.status==="active";}).map(function(m){return(<div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:10,marginBottom:6,background:C.cardB}}><div><div style={{fontWeight:700,display:"flex",alignItems:"center",gap:6}}>{m.display_name}{m.role==="admin"&&<Badge text="Admin" color={C.purple}/>}</div><div style={{fontSize:12,color:C.dim}}>@{m.username} • {m.balance?.toLocaleString()} pts</div></div><div style={{display:"flex",gap:6}}>{m.role!=="admin"&&<Btn small bg={C.red} onClick={function(){updateMember(m.id,"deactivate");}}>Off</Btn>}<Btn small bg={C.amber} onClick={function(){setAdjustModal(m);}}>Adjust</Btn></div></div>);})}
            {adminTab==="deactivated"&&(members.filter(function(m){return m.status==="deactivated";}).length===0?<div style={{textAlign:"center",padding:20,color:C.muted}}>None</div>:members.filter(function(m){return m.status==="deactivated";}).map(function(m){return(<div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:10,marginBottom:6,background:C.cardB,opacity:0.7}}><div><div style={{fontWeight:700}}>{m.display_name}</div></div><Btn small bg={C.green} onClick={function(){updateMember(m.id,"reactivate");}}>Reactivate</Btn></div>);}))}
          </Card>
          {adjustModal&&(<Card style={{border:"1px solid "+C.amber}}><div style={{fontWeight:700,marginBottom:8}}>Adjust: {adjustModal.display_name}</div><div style={{fontSize:13,color:C.dim,marginBottom:10}}>Current: {adjustModal.balance} pts</div><Input type="number" placeholder="Amount (+100 or -50)" value={adjustAmt} onChange={function(e){setAdjustAmt(e.target.value);}} style={{marginBottom:8}}/><Input placeholder="Reason (optional)" value={adjustReason} onChange={function(e){setAdjustReason(e.target.value);}} style={{marginBottom:10}}/><div style={{display:"flex",gap:8}}><Btn bg={C.amber} onClick={adjustBalance}>Apply</Btn><Btn bg="#374151" onClick={function(){setAdjustModal(null);setAdjustAmt("");setAdjustReason("");}}>Cancel</Btn></div></Card>)}
          <Card style={{borderColor:C.amber+"44"}}><div style={{fontWeight:700,fontSize:15,marginBottom:4,color:C.amber}}>Scores</div><div style={{fontSize:12,color:C.dim,marginBottom:12}}>Manual refresh from Odds API</div><div style={{display:"flex",gap:8}}><Btn small bg={C.amber} onClick={async function(){try{await api("/api/admin/refresh-scores",{method:"POST"});showMsg("Scores refreshed!");await refreshPool();}catch(e){showMsg(e.message,"error");}}}>Refresh Scores</Btn><Btn small bg={C.blue} onClick={async function(){try{var d=await api("/api/admin/refresh-odds",{method:"POST"});showMsg("Odds: "+d.gamesUpdated+" games");setGames(await api("/api/games/upcoming"));}catch(e){showMsg(e.message,"error");}}}>Refresh Odds</Btn></div></Card>
          <Card><div style={{fontWeight:700,fontSize:15,marginBottom:10}}>Settings</div><div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+C.border}}><span style={{fontSize:13}}>Join Code</span><span style={{fontWeight:700,letterSpacing:2}}>{activePool?.join_code}</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:13}}>Starting Balance</span><span style={{fontWeight:600}}>{activePool?.starting_balance||1000} pts</span></div></Card>
          <Card style={{borderColor:C.green+"44"}}><div style={{fontWeight:700,fontSize:15,marginBottom:4,color:C.green}}>Export Data</div><div style={{fontSize:12,color:C.dim,marginBottom:12}}>Download spreadsheets for record keeping and balance correction</div><div style={{display:"flex",flexDirection:"column",gap:8}}><Btn full bg={C.green} onClick={function(){downloadCSV("/api/pools/"+activePool.id+"/export/all-activity");}}>Download All Bet Activity (Admin)</Btn><div style={{fontSize:11,color:C.dim,padding:"0 4px"}}>Every bet by every member, parlay groupings, game results, and a member summary with expected vs actual balances.</div><div style={{display:"flex",gap:8}}><Btn full bg="#374151" onClick={function(){downloadCSV("/api/pools/"+activePool.id+"/export/standings");}}>Standings CSV</Btn><Btn full bg="#374151" onClick={function(){downloadCSV("/api/pools/"+activePool.id+"/export/bets");}}>My Bets CSV</Btn></div></div></Card>
        </div>)}
      </div>
    </div>
  );
}

export default function App(){return <ErrorBoundary><AppInner/></ErrorBoundary>;}
