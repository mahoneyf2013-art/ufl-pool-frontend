import React,{useState,useEffect,useRef,Component} from "react";

class ErrorBoundary extends Component{
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(e){return{err:e};}
  render(){if(this.state.err)return<div style={{background:"#0c0e12",minHeight:"100vh",color:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:40,fontFamily:"sans-serif"}}><div style={{fontSize:40,marginBottom:16}}>😵</div><div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Something went wrong</div><div style={{fontSize:14,color:"#94a3b8",marginBottom:20}}>{this.state.err?.message}</div><button onClick={()=>{this.setState({err:false});window.location.reload();}} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontWeight:700}}>Reload</button></div>;return this.props.children;}
}

const API_URL="https://ufl-pool-production.up.railway.app";
const TEAMS={"Arlington Renegades":{abbr:"ARL",color:"#E31937"},"Birmingham Stallions":{abbr:"BHM",color:"#FFB81C"},"D.C. Defenders":{abbr:"DC",color:"#C8102E"},"Houston Roughnecks":{abbr:"HOU",color:"#003D79"},"Memphis Showboats":{abbr:"MEM",color:"#00B2A9"},"Michigan Panthers":{abbr:"MICH",color:"#003DA5"},"San Antonio Brahmas":{abbr:"SA",color:"#2D2926"},"St. Louis Battlehawks":{abbr:"STL",color:"#003B7B"},"Orlando Storm":{abbr:"ORL",color:"#005EB8"},"Columbus Aviators":{abbr:"CLB",color:"#6F263D"}};
function useTm(espn){return n=>{if(!n)return{abbr:"?",color:"#666",logo:null};const e=espn.find(t=>t.name===n||t.abbr===n||n.includes(t.nickname)||n.includes(t.abbr));if(e)return{abbr:e.abbr,color:e.color,logo:e.logo,record:e.record,id:e.id,name:e.name};const f=TEAMS[n];if(f)return{...f,logo:null};return{abbr:n?.substring(0,3)?.toUpperCase()||"?",color:"#666",logo:null};};}
const TmLogo=({team,size})=>{const s=size||20;if(team?.logo)return<img src={team.logo} alt={team.abbr} style={{width:s,height:s,objectFit:"contain"}}/>;return<div style={{width:s,height:s,borderRadius:"50%",background:team?.color||"#666"}}/>;};
function calcPayout(w,odds){if(!w||w<=0)return 0;const o=odds==null?-110:typeof odds==="string"?parseInt(odds):odds;return o<0?Math.round(w*(100/Math.abs(o))):Math.round(w*(o/100));}
function fmtOdds(odds){if(odds==null)return"-110";const o=typeof odds==="string"?parseInt(odds):odds;return o>0?`+${o}`:`${o}`;}
function calcParlayPayout(legs,w){if(!w||w<=0||legs.length<2)return 0;let m=1;for(const l of legs){if(l.betType==="moneyline"&&l.odds!=null){const o=typeof l.odds==="string"?parseInt(l.odds):l.odds;m*=o<0?1+100/Math.abs(o):1+o/100;}else m*=1.909;}return Math.round(w*m)-w;}
function getToken(){return localStorage.getItem("ufl_token");}
async function api(path,opt={}){const t=getToken(),h={"Content-Type":"application/json"};if(t)h.Authorization=`Bearer ${t}`;const r=await fetch(`${API_URL}${path}`,{...opt,headers:h});const d=await r.json();if(!r.ok)throw new Error(d.error||"Failed");return d;}

const C={bg:"#0c0e12",card:"#151820",cardB:"#1c2030",border:"#252a38",blue:"#3b82f6",green:"#22c55e",red:"#ef4444",amber:"#f59e0b",purple:"#8b5cf6",muted:"#6b7280",text:"#e5e7eb",dim:"#94a3b8"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.card,borderRadius:12,padding:16,marginBottom:10,border:`1px solid ${C.border}`,...style}}>{children}</div>;
const Btn=({children,bg,full,small,disabled,onClick,style})=><button disabled={disabled} onClick={onClick} style={{background:disabled?C.muted:(bg||C.blue),color:"#fff",border:"none",borderRadius:8,padding:small?"6px 14px":"11px 22px",cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:small?12:14,width:full?"100%":"auto",opacity:disabled?0.5:1,...style}}>{children}</button>;
const Input=p=><input {...p} style={{background:"#0c0e14",border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 14px",color:"#fff",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",...p.style}}/>;
const Badge=({text,color})=><span style={{background:`${color}22`,color,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase"}}>{text}</span>;
const Spinner=()=><div style={{width:20,height:20,border:`3px solid ${C.blue}33`,borderTop:`3px solid ${C.blue}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;
const LoadingCard=({text})=><Card style={{textAlign:"center",padding:30,color:C.muted}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/><span>{text||"Loading..."}</span></div></Card>;
const ConfirmModal=({title,message,details,onConfirm,onCancel,confirmText,confirmColor})=><div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}><div style={{background:C.card,borderRadius:12,padding:24,maxWidth:400,width:"100%",border:`1px solid ${C.border}`}}><div style={{fontWeight:700,fontSize:17,marginBottom:8}}>{title}</div><div style={{fontSize:14,color:C.dim,marginBottom:12}}>{message}</div>{details&&<div style={{background:C.cardB,borderRadius:8,padding:12,marginBottom:16,fontSize:13}}>{details}</div>}<div style={{display:"flex",gap:8}}><Btn full bg={confirmColor||C.blue} onClick={onConfirm}>{confirmText||"Confirm"}</Btn><Btn full bg="#374151" onClick={onCancel}>Cancel</Btn></div></div></div>;

function BetBtn({label,sub,odds,isParlay,onBet,onParlay,disabled,disabledMsg,gameTime}){
  const[open,setOpen]=useState(false),[wager,setWager]=useState("");
  const profit=calcPayout(parseInt(wager)||0,odds),oddsStr=fmtOdds(odds);
  const locked=gameTime&&(new Date(gameTime).getTime()-300000)<=Date.now();
  if(locked)return<button disabled style={{background:"#1a1f2b",border:"1px solid #252a38",borderRadius:8,padding:"8px 4px",color:"#4b5563",cursor:"not-allowed",textAlign:"center",width:"100%",opacity:0.5}}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:9}}>Locked</div></button>;
  if(disabled&&isParlay)return<button disabled style={{background:"#1a1f2b",border:"1px solid #252a38",borderRadius:8,padding:"8px 4px",color:"#4b5563",cursor:"not-allowed",textAlign:"center",width:"100%",opacity:0.5}}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:9}}>{disabledMsg}</div></button>;
  if(isParlay)return<button onClick={onParlay} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"8px 4px",color:"#e5e7eb",cursor:"pointer",textAlign:"center",width:"100%"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#f59e0b"} onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:10,color:C.amber}}>{oddsStr}</div></button>;
  if(!open)return<button onClick={()=>setOpen(true)} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"8px 4px",color:"#e5e7eb",cursor:"pointer",textAlign:"center",width:"100%"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#3b82f6"} onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}><div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:10,color:C.dim}}>{sub} • {oddsStr}</div></button>;
  return<div style={{background:"#1e293b",border:"1px solid #3b82f6",borderRadius:8,padding:6}}><div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{label}</div><div style={{fontSize:10,color:C.dim,marginBottom:4}}>Odds: {oddsStr}</div><input type="number" placeholder="Wager" value={wager} onChange={e=>setWager(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&wager){onBet(parseInt(wager));setOpen(false);setWager("");}}} style={{background:"#0c0e14",border:"1px solid #2a2d35",borderRadius:6,padding:"5px 8px",color:"#fff",fontSize:12,width:"100%",textAlign:"center",outline:"none",boxSizing:"border-box"}}/>{wager&&parseInt(wager)>0&&<div style={{marginTop:4,padding:"4px 6px",background:"#052e16",borderRadius:4,textAlign:"center"}}><span style={{fontSize:11,color:C.green}}>Win: +{profit} → <strong>{parseInt(wager)+profit}</strong></span></div>}<div style={{display:"flex",gap:4,marginTop:4}}><button onClick={()=>{if(wager){onBet(parseInt(wager));setOpen(false);setWager("");}}} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:4,padding:"4px 0",cursor:"pointer",fontWeight:600,fontSize:11,flex:1}}>Place Bet</button><button onClick={()=>{setOpen(false);setWager("");}} style={{background:"#374151",color:"#94a3b8",border:"none",borderRadius:4,padding:"4px 6px",cursor:"pointer",fontSize:11}}>✕</button></div></div>;
}

// Line history display component
const LineHistoryPanel=({data})=>{if(!data?.history?.length)return<div style={{fontSize:12,color:C.muted}}>No line changes recorded</div>;
  return<><div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr",gap:4,marginBottom:6}}><div style={{fontSize:10,color:C.dim,fontWeight:700}}>Date</div><div style={{fontSize:10,color:C.dim,fontWeight:700}}>Spread</div><div style={{fontSize:10,color:C.dim,fontWeight:700}}>Total</div><div style={{fontSize:10,color:C.dim,fontWeight:700}}>ML (H/A)</div></div>
  {data.history.map((h,i)=>{const p=i>0?data.history[i-1]:null;const sc=p&&p.spread_home!==h.spread_home,tc=p&&p.total!==h.total,mc=p&&p.moneyline_home!==h.moneyline_home;const sd=p&&h.spread_home!=null&&p.spread_home!=null?(h.spread_home<p.spread_home?"↓":"↑"):"";const td=p&&h.total!=null&&p.total!=null?(h.total>p.total?"↑":"↓"):"";
  return<div key={h.id} style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr",gap:4,padding:"3px 0",borderBottom:`1px solid ${C.border}22`,fontSize:12}}>
    <div style={{color:C.dim}}>{i===0?"Opening":new Date(h.recorded_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric"})}</div>
    <div style={{color:sc?C.amber:C.text}}>{h.spread_home!=null?(h.spread_home>0?"+":"")+h.spread_home:"—"} {sd}</div>
    <div style={{color:tc?C.amber:C.text}}>{h.total||"—"} {td}</div>
    <div style={{color:mc?C.amber:C.text}}>{h.moneyline_home||"—"}/{h.moneyline_away||"—"}</div>
  </div>})}
  {data.current&&<div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr",gap:4,padding:"4px 0",fontSize:12,borderTop:`1px solid ${C.blue}44`,marginTop:4}}>
    <div style={{color:C.blue,fontWeight:700}}>Current</div>
    <div style={{color:C.blue,fontWeight:700}}>{data.current.spread_home!=null?(data.current.spread_home>0?"+":"")+data.current.spread_home:"—"}</div>
    <div style={{color:C.blue,fontWeight:700}}>{data.current.total||"—"}</div>
    <div style={{color:C.blue,fontWeight:700}}>{data.current.moneyline_home||"—"}/{data.current.moneyline_away||"—"}</div>
  </div>}</>;
};
function AppInner() {
  const [user, setUser] = useState(null),
    [authView, setAuthView] = useState("login");
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false),
    [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState(null),
    [resetForm, setResetForm] = useState({ password: "", confirm: "" });
  const [screen, setScreen] = useState("pools"),
    [pools, setPools] = useState([]),
    [activePool, setActivePool] = useState(null);
  const [games, setGames] = useState([]),
    [bets, setBets] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]),
    [members, setMembers] = useState([]);
  const [balance, setBalance] = useState(1000),
    [myRole, setMyRole] = useState("member");
  const [parlayLegs, setParlayLegs] = useState([]),
    [parlayWager, setParlayWager] = useState("");
  const [msg, setMsg] = useState(null),
    [createForm, setCreateForm] = useState({
      name: "",
      balance: 1000,
      approval: true,
    });
  const [joinCode, setJoinCode] = useState(""),
    [adminTab, setAdminTab] = useState("pending");
  const [activity, setActivity] = useState([]),
    [messages, setMessages] = useState([]),
    [msgInput, setMsgInput] = useState("");
  const [liveData, setLiveData] = useState([]),
    [adjustModal, setAdjustModal] = useState(null);
  const [adjustAmt, setAdjustAmt] = useState(""),
    [adjustReason, setAdjustReason] = useState("");
  const [expandedGame, setExpandedGame] = useState(null),
    [lineHistory, setLineHistory] = useState(null);
  const [schedule, setSchedule] = useState([]),
    [scheduleWeek, setScheduleWeek] = useState(null);
  const [schedExpanded, setSchedExpanded] = useState(null),
    [schedLineHist, setSchedLineHist] = useState(null);
  const [espnTeams, setEspnTeams] = useState([]),
    [news, setNews] = useState([]);
  const [gameSummary, setGameSummary] = useState(null),
    [summaryLoading, setSummaryLoading] = useState(false);
  const [profile, setProfile] = useState(null),
    [recapWeek, setRecapWeek] = useState(null),
    [recapData, setRecapData] = useState(null);
  const [betConfirm, setBetConfirm] = useState(null),
    [loading, setLoading] = useState(false),
    [leaveConfirm, setLeaveConfirm] = useState(false);
  const [viewingPlayer, setViewingPlayer] = useState(null),
    [viewingPlayerData, setViewingPlayerData] = useState(null);
  const chatEndRef = useRef(null);

  // Navigation state management
  const [section, setSection] = useState("bet"); // bet|games|pool|me|news|admin
  const [subTab, setSubTab] = useState("board");
  const setTab = (t) => setSubTab(t); // Alias for compatibility
  const tab = subTab; // Alias for compatibility within JSX

  const showMsg = (t, type = "info") => {
    setMsg({ t, type });
    setTimeout(() => setMsg(null), 4000);
  };
  const tm = useTm(espnTeams);

  useEffect(()=>{const s=document.createElement("style");s.textContent="@keyframes spin{to{transform:rotate(360deg)}}";document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  useEffect(()=>{const p=new URLSearchParams(window.location.search);const t=p.get("reset");if(t)api(`/api/auth/verify-reset/${t}`).then(()=>setResetToken(t)).catch(()=>{showMsg("Invalid reset link","error");window.history.replaceState({},"",window.location.pathname);});},[]);

  useEffect(()=>{const t=getToken();if(t&&API_URL)api("/api/auth/me").then(u=>setUser({id:u.id,username:u.username,displayName:u.display_name})).catch(()=>localStorage.removeItem("ufl_token"));},[]);

  useEffect(()=>{if(user)api("/api/my-pools").then(setPools).catch(()=>{});},[user]);

  useEffect(()=>{if(user)api("/api/espn/teams").then(setEspnTeams).catch(()=>{});},[user]);

  // CORRECTED useEffect hooks with proper guards (||) and dependencies
  useEffect(()=>{if(!user || !activePool || subTab!=="news") return; api("/api/espn/news").then(d=>setNews(d.articles||[])).catch(()=>{});},[subTab,activePool,user]);

  useEffect(()=>{if(!user || !activePool || subTab!=="profile") return; setProfile(null);api(`/api/pools/${activePool.id}/profile`).then(setProfile).catch(()=>{});},[subTab,activePool,user]);

  useEffect(()=>{if(!user || !activePool || subTab!=="recap" || !recapWeek) return; setRecapData(null);api(`/api/pools/${activePool.id}/recap/${recapWeek}`).then(setRecapData).catch(()=>{});},[subTab,activePool,user,recapWeek]);

  useEffect(()=>{if(!user || !activePool || subTab!=="live") return; const ld=()=>api(`/api/pools/${activePool.id}/live`).then(setLiveData).catch(()=>{});ld();const iv=setInterval(ld,30000);return()=>clearInterval(iv);},[subTab,activePool,user]);

  useEffect(()=>{if(!user || !activePool || subTab!=="chat") return; const ld=()=>api(`/api/pools/${activePool.id}/messages`).then(setMessages).catch(()=>{});ld();const iv=setInterval(ld,10000);return()=>clearInterval(iv);},[subTab,activePool,user]);

  useEffect(()=>{if(!user || !activePool || subTab!=="schedule") return; api("/api/schedule").then(s=>{setSchedule(s);if(!scheduleWeek&&s.length)setScheduleWeek(s[s.length-1].week);}).catch(()=>{});},[subTab,activePool,user,scheduleWeek]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  
  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      if (forgotMode) {
        if (!forgotEmail) {
          showMsg("Enter email", "error");
          return;
        }
        await api("/api/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: forgotEmail }),
        });
        showMsg("Check your inbox!");
        setForgotMode(false);
        setForgotEmail("");
        return;
      }
      if (resetToken) {
        if (!resetForm.password || !resetForm.confirm) {
          showMsg("Fill both fields", "error");
          return;
        }
        if (resetForm.password !== resetForm.confirm) {
          showMsg("No match", "error");
          return;
        }
        const d = await api("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            token: resetToken,
            newPassword: resetForm.password,
          }),
        });
        localStorage.setItem("ufl_token", d.token);
        setUser(d.user);
        setResetToken(null);
        window.history.replaceState({}, "", window.location.pathname);
        showMsg("Password reset!");
        return;
      }
      if (authView === "register") {
        if (!authForm.username || !authForm.email || !authForm.password) {
          showMsg("All fields required", "error");
          return;
        }
        const d = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
            displayName: authForm.displayName || authForm.username,
          }),
        });
        localStorage.setItem("ufl_token", d.token);
        setUser(d.user);
        showMsg("Account created!");
      } else {
        if (!authForm.username || !authForm.password) {
          showMsg("Enter credentials", "error");
          return;
        }
        const d = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: authForm.username,
            password: authForm.password,
          }),
        });
        localStorage.setItem("ufl_token", d.token);
        setUser(d.user);
        showMsg("Logged in!");
      }
      setPools([]);
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("ufl_token");
    setUser(null);
    setScreen("pools");
    setActivePool(null);
  };
  const createPool = async () => {
    if (!createForm.name) return showMsg("Enter name", "error");
    try {
      const d = await api("/api/pools", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name,
          startingBalance: createForm.balance,
          requireApproval: createForm.approval,
        }),
      });
      showMsg(`Created! Code: ${d.joinCode}`);
      setPools(await api("/api/my-pools"));
      setCreateForm({ name: "", balance: 1000, approval: true });
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const joinPool = async () => {
    if (!joinCode) return showMsg("Enter code", "error");
    try {
      const d = await api(`/api/pools/${joinCode}/join`, { method: "POST" });
      showMsg(d.status === "pending" ? "Request sent!" : "Joined!");
      setPools(await api("/api/my-pools"));
      setJoinCode("");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const enterPool = async (p) => {
    if (p.status === "pending") return showMsg("Waiting for approval", "error");
    setActivePool(p);
    setBalance(p.balance || 1000);
    setMyRole(p.role);
    setScreen("pool");
    setTab("board");
    setLoading(true);
    try {
      const [g, lb] = await Promise.all([
        api("/api/games/upcoming"),
        api(`/api/pools/${p.id}/leaderboard`),
      ]);
      setGames(g);
      setLeaderboard(lb.map((x) => ({ ...x, isYou: x.username === user.username })));
      if (p.role === "admin") setMembers(await api(`/api/pools/${p.id}/members`));
      setBets(await api(`/api/pools/${p.id}/my-bets`));
      try {
        setActivity(await api(`/api/pools/${p.id}/activity`));
      } catch (e) {}
      try {
        setMessages(await api(`/api/pools/${p.id}/messages`));
      } catch (e) {}
    } catch (e) {
      showMsg("Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };
  const LOCK_MS = 300000;
  const isLocked = (t) => t && new Date(t).getTime() - LOCK_MS <= Date.now();
  const placeBetDirect = async (gid, bt, pick, line, odds, wager) => {
    try {
      const d = await api("/api/bet", {
        method: "POST",
        body: JSON.stringify({
          pool_id: activePool.id,
          game_id: gid,
          bet_type: bt,
          pick,
          line,
          odds,
          wager,
        }),
      });
      setBalance(d.newBalance);
      setBets((prev) => [
        {
          id: "b_" + Date.now(),
          game_id: gid,
          bet_type: bt,
          pick,
          line,
          odds,
          wager,
          result: "pending",
          potential_profit: calcPayout(wager, odds),
        },
        ...prev,
      ]);
      showMsg(`Bet: ${wager} pts to win ${calcPayout(wager, odds)}`);
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const placeBet = async (gid, bt, pick, line, odds, wager) => {
    if (!wager || wager <= 0) return showMsg("Enter wager", "error");
    if (wager > balance) return showMsg("Not enough!", "error");
    const g = games.find((x) => x.id === gid);
    if (isLocked(g?.commence_time)) return showMsg("Betting closed", "error");
    if (wager > balance * 0.25) {
      setBetConfirm({
        gid,
        bt,
        pick,
        line,
        odds,
        wager,
        pickLabel:
          bt === "spread"
            ? `${tm(pick).abbr} ${line > 0 ? "+" : ""}${line}`
            : bt === "over"
            ? `Over ${line}`
            : bt === "under"
            ? `Under ${line}`
            : `${tm(pick).abbr} ML (${fmtOdds(odds)})`,
        profit: calcPayout(wager, odds),
      });
      return;
    }
    await placeBetDirect(gid, bt, pick, line, odds, wager);
  };
  const isParlayConflict = (gid, bt, pick) => {
    for (const l of parlayLegs) {
      if (l.gameId !== gid) continue;
      if (
        (l.betType === "spread" || l.betType === "moneyline") &&
        (bt === "spread" || bt === "moneyline") &&
        l.pick === pick
      )
        return "Can't parlay spread+ML";
      if (l.betType === bt && l.pick === pick) return "Already added";
    }
    return null;
  };
  const addParlayLeg = (gid, bt, pick, line, odds, gl) => {
    const c = isParlayConflict(gid, bt, pick);
    if (c) return showMsg(c, "error");
    setParlayLegs([
      ...parlayLegs,
      { gameId: gid, betType: bt, pick, line, odds, gameLabel: gl },
    ]);
  };
  const placeParlay = async () => {
    const w = parseInt(parlayWager);
    if (!w || w <= 0 || parlayLegs.length < 2)
      return showMsg("Need 2+ legs and wager", "error");
    if (w > balance) return showMsg("Not enough!", "error");
    try {
      const pg = `parlay_${Date.now()}`;
      for (const l of parlayLegs)
        await api("/api/bet", {
          method: "POST",
          body: JSON.stringify({
            pool_id: activePool.id,
            game_id: l.gameId,
            bet_type: l.betType,
            pick: l.pick,
            line: l.line,
            odds: l.odds,
            wager: w,
            parlay_group: pg,
          }),
        });
      setBalance((b) => b - w);
      setBets((prev) => [
        {
          id: "b_" + Date.now(),
          bet_type: "parlay",
          legs: [...parlayLegs],
          wager: w,
          result: "pending",
          potential_profit: calcParlayPayout(parlayLegs, w),
        },
        ...prev,
      ]);
      setParlayLegs([]);
      setParlayWager("");
      setTab("board");
      showMsg(`Parlay: ${w} to win ${calcParlayPayout(parlayLegs, w)}!`);
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const updateMember = async (mid, action) => {
    try {
      await api(`/api/pools/${activePool.id}/members/${mid}/${action}`, {
        method: "POST",
      });
      setMembers(await api(`/api/pools/${activePool.id}/members`));
      showMsg(`Member ${action}d!`);
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const adjustBalance = async () => {
    if (!adjustAmt) return;
    try {
      await api(
        `/api/pools/${activePool.id}/members/${adjustModal.id}/adjust-balance`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: parseInt(adjustAmt),
            reason: adjustReason,
          }),
        }
      );
      setMembers(await api(`/api/pools/${activePool.id}/members`));
      setAdjustModal(null);
      setAdjustAmt("");
      setAdjustReason("");
      showMsg("Adjusted!");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    try {
      const m = await api(`/api/pools/${activePool.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: msgInput }),
      });
      setMessages((prev) => [...prev, m]);
      setMsgInput("");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };
  const loadLineHistory = async (gameId, target) => {
    if (target === "board") {
      if (expandedGame === gameId) {
        setExpandedGame(null);
        setLineHistory(null);
        return;
      }
      setExpandedGame(gameId);
      try {
        setLineHistory(await api(`/api/games/${gameId}/line-history`));
      } catch (e) {}
    } else {
      if (schedExpanded === gameId) {
        setSchedExpanded(null);
        setSchedLineHist(null);
        setGameSummary(null);
        return;
      }
      setSchedExpanded(gameId);
      setGameSummary(null);
      try {
        setSchedLineHist(await api(`/api/games/${gameId}/line-history`));
      } catch (e) {}
    }
  };
  const loadGameSummary = async (eid) => {
    if (!eid) return;
    setSummaryLoading(true);
    try {
      setGameSummary(await api(`/api/espn/summary/${eid}`));
    } catch (e) {} finally {
      setSummaryLoading(false);
    }
  };
  const viewPlayer = async (username) => {
    setViewingPlayer(username);
    setViewingPlayerData(null);
    try {
      const d = await api(`/api/pools/${activePool.id}/profile/${username}`);
      setViewingPlayerData(d);
    } catch (e) {
      showMsg("Couldn't load profile", "error");
      setViewingPlayer(null);
    }
  };
  const refreshPool = async () => {
    if (!activePool) return;
    try {
      const [g, lb, b] = await Promise.all([
        api("/api/games/upcoming"),
        api(`/api/pools/${activePool.id}/leaderboard`),
        api(`/api/pools/${activePool.id}/my-bets`),
      ]);
      setGames(g);
      setLeaderboard(lb.map((x) => ({ ...x, isYou: x.username === user.username })));
      setBets(b);
      try {
        setActivity(await api(`/api/pools/${activePool.id}/activity`));
      } catch (e) {}
    } catch (e) {}
  };

  // ... (The rest of the function remains the same, starting from the `if(!user) return ...` line)
  // ... It is too long to paste here again, but you should not need to change it.
  // ... The important fixes are in the useEffect hooks above.

  // ═══ AUTH SCREEN ═══
  if (!user)
    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          color: C.text,
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        }}
      >
        {/* ... JSX for auth screen ... */}
      </div>
    );
  // ═══ POOLS LIST ═══
  if (screen === "pools")
    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          color: C.text,
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        }}
      >
        {/* ... JSX for pools list screen ... */}
      </div>
    );
  // ═══ POOL VIEW ═══
  const pc = members.filter((m) => m.status === "pending").length;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = [
    { id: "bet", label: "Bet", icon: "🎯", subs: [["board", "Board"], ["parlay", `Parlay${parlayLegs.length ? ` (${parlayLegs.length})` : ""}`]]},
    { id: "games", label: "Games", icon: "🏈", subs: [["live", "Live"],["schedule", "Schedule"],["recap", "Recap"]]},
    { id: "pool", label: "Pool", icon: "👥", subs: [["activity", "Activity"], ["chat", "Chat"], ["leaderboard", "Standings"]]},
    { id: "me", label: "Me", icon: "📊", subs: [["profile", "Profile"],["bets", "My Bets"]]},
    { id: "news", label: "News", icon: "📰", subs: [["news", "News"]]},
  ];
  if (myRole === "admin") navItems.push({ id: "admin", label: `Admin${pc ? ` (${pc})` : ""}`, icon: "⚙️", subs: [["admin", "Admin"]] });
  const switchSection = (sid) => {
    setSection(sid);
    const nav = navItems.find((n) => n.id === sid);
    if (nav?.subs?.[0]) setSubTab(nav.subs[0][0]);
    setSidebarOpen(false);
  };
  const currentNav = navItems.find((n) => n.id === section);

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      }}
    >
      {/* The entire JSX for the pool view goes here, unchanged */}
    </div>
  );
}


export default function App(){return<ErrorBoundary><AppInner/></ErrorBoundary>;}








