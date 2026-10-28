import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioLines, Music2, Upload, Play, Pause, SkipBack, Plus, Trash2, Download, Eye, GripVertical, RotateCcw, Clock3, Type, Image as ImageIcon, Film, WandSparkles, Check, ChevronDown, CircleHelp, FileAudio, AlignLeft, Scissors } from 'lucide-react';
import './style.css';

const fmt = (n=0) => { if (!Number.isFinite(n)) n=0; const m=Math.floor(n/60), s=(n%60).toFixed(1).padStart(4,'0'); return `${String(m).padStart(2,'0')}:${s}`; };
const parseTime = (v) => { if (typeof v === 'number') return v; const s=String(v).trim(); if(!s) return NaN; if(s.includes(':')){ const p=s.split(':').map(Number); if(p.some(n=>!Number.isFinite(n))) return NaN; return p.reduce((a,b)=>a*60+b,0); } const n=Number(s); return Number.isFinite(n)?n:NaN; };
const uid = () => Math.random().toString(36).slice(2,10);
const capFirst = (s) => String(s??'').replace(/^\s*\S/, (m)=>m.toUpperCase());
const demo = [
  {id:uid(),text:'I walk alone',start:0,end:4,timed:true},
  {id:uid(),text:'Through the night',start:4,end:8,timed:true},
  {id:uid(),text:'Waiting for the morning light',start:8,end:13,timed:true},
  {id:uid(),text:'I keep on dreaming',start:13,end:17,timed:true},
];
const BG_PRESETS = [
  {id:'sunrise',label:'Golden sunrise',hint:'Hope & renewal',swatch:'linear-gradient(160deg,#162343 0%,#8a607f 48%,#ffd39a 100%)'},
  {id:'mountains',label:'Mountain stillness',hint:'Quiet & steady',swatch:'linear-gradient(160deg,#101b36 0%,#66749a 58%,#d8b4a0 100%)'},
  {id:'ocean',label:'Ocean horizon',hint:'Peace & depth',swatch:'linear-gradient(180deg,#1b3757 0%,#4c8b9b 54%,#f2c49c 100%)'},
  {id:'forest',label:'Forest dusk',hint:'Rest & reflection',swatch:'linear-gradient(160deg,#0b1e27 0%,#315b58 60%,#d1a477 100%)'},
  {id:'clouds',label:'Heavenly clouds',hint:'Light from above',swatch:'linear-gradient(160deg,#353a65 0%,#a17d9a 55%,#ffd6a6 100%)'},
  {id:'cross',label:'Cross at dawn',hint:'Faith & hope',swatch:'linear-gradient(160deg,#1a2340 0%,#bd7d77 62%,#f5d49d 100%)'},
  {id:'night',label:'Quiet night sky',hint:'Stillness & wonder',swatch:'linear-gradient(160deg,#080f25 0%,#24365b 70%,#5d6689 100%)'},
  {id:'worship',label:'Worship lights',hint:'Atmospheric & modern',swatch:'linear-gradient(120deg,#111b44 0%,#4c4487 48%,#b17aa4 100%)'},
  {id:'solid',label:'Solid color',hint:'Clean & minimal',swatch:'linear-gradient(135deg,#101b35,#293c5c)'},
 ];

const FONT_LIBRARY = [
  { family: 'Montserrat', category: 'Social captions', description: 'Bold, balanced, highly readable', weights: [400,500,600,700,800,900] },
  { family: 'Poppins', category: 'Social captions', description: 'Geometric and friendly', weights: [400,500,600,700,800,900] },
  { family: 'Inter', category: 'Social captions', description: 'Clean, crisp, modern', weights: [400,500,600,700,800,900] },
  { family: 'DM Sans', category: 'Social captions', description: 'Polished everyday captions', weights: [400,500,600,700,800,900] },
  { family: 'Manrope', category: 'Social captions', description: 'Premium and minimal', weights: [400,500,600,700,800] },
  { family: 'Outfit', category: 'Social captions', description: 'Contemporary and expressive', weights: [400,500,600,700,800,900] },
  { family: 'Urbanist', category: 'Social captions', description: 'Rounded, upbeat energy', weights: [400,500,600,700,800,900] },
  { family: 'Plus Jakarta Sans', category: 'Social captions', description: 'Smooth, editorial captions', weights: [400,500,600,700,800] },
  { family: 'Sora', category: 'Social captions', description: 'Distinctive modern shapes', weights: [400,500,600,700,800] },
  { family: 'Figtree', category: 'Social captions', description: 'Fresh, versatile caption font', weights: [400,500,600,700,800,900] },
  { family: 'Work Sans', category: 'Social captions', description: 'Simple and highly legible', weights: [400,500,600,700,800,900] },
  { family: 'Lato', category: 'Social captions', description: 'Friendly and familiar', weights: [400,700,900] },
  { family: 'Lexend', category: 'Social captions', description: 'Open forms for easy reading', weights: [400,500,600,700,800,900] },
  { family: 'Mulish', category: 'Social captions', description: 'Soft, clean, contemporary', weights: [400,500,600,700,800,900] },
  { family: 'Red Hat Display', category: 'Social captions', description: 'Bold modern display type', weights: [400,500,600,700,800,900] },
  { family: 'Nunito Sans', category: 'Social captions', description: 'Approachable and balanced', weights: [400,500,600,700,800,900] },
  { family: 'League Spartan', category: 'Bold & punchy', description: 'Big, confident headlines', weights: [400,500,600,700,800,900] },
  { family: 'Anton', category: 'Bold & punchy', description: 'Heavy, poster-like emphasis', weights: [400] },
  { family: 'Archivo Black', category: 'Bold & punchy', description: 'Extra-bold statement text', weights: [400] },
  { family: 'Space Grotesk', category: 'Bold & punchy', description: 'Modern with character', weights: [400,500,600,700] },
  { family: 'Oswald', category: 'Condensed', description: 'Tall, strong, space-saving', weights: [400,500,600,700] },
  { family: 'Bebas Neue', category: 'Condensed', description: 'Cinematic title-card style', weights: [400] },
  { family: 'Barlow Condensed', category: 'Condensed', description: 'Compact and energetic', weights: [400,500,600,700,800,900] },
  { family: 'Roboto Condensed', category: 'Condensed', description: 'Compact and familiar', weights: [400,500,700,900] },
  { family: 'Raleway', category: 'Expressive', description: 'Elegant with clean lines', weights: [400,500,600,700,800,900] },
  { family: 'Playfair Display', category: 'Expressive', description: 'Elegant lyric emphasis', weights: [400,500,600,700,800,900] },
  { family: 'Caveat', category: 'Expressive', description: 'Handwritten accent style', weights: [400,500,600,700] },
];
const FONT_CATEGORIES = ['All fonts', 'Social captions', 'Bold & punchy', 'Condensed', 'Expressive'];
const googleFontStylesheets = new Map();
const fontMeta = (family) => FONT_LIBRARY.find(item => item.family === family);
const fontWeightForFamily = (family, requested = 800) => {
  const available = fontMeta(family)?.weights || [400,500,600,700,800,900];
  const below = available.filter(weight => weight <= requested);
  return below.length ? below[below.length - 1] : available[0];
};
const canvasFont = (family, size, requestedWeight = 800) => {
  const safeFamily = String(family || 'Montserrat').replace(/"/g, '\\"');
  return `${fontWeightForFamily(family, requestedWeight)} ${size}px "${safeFamily}", sans-serif`;
};
function ensureGoogleFontStylesheet(family) {
  const meta = fontMeta(family);
  if (!meta || typeof document === 'undefined') return Promise.resolve(true);
  if (googleFontStylesheets.has(family)) return googleFontStylesheets.get(family);
  const familyParam = encodeURIComponent(meta.family).replace(/%20/g, '+');
  const weightParam = meta.weights.length > 1 ? `:wght@${meta.weights.join(';')}` : '';
  const href = `https://fonts.googleapis.com/css2?family=${familyParam}${weightParam}&display=swap`;
  const promise = new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.crossOrigin = 'anonymous';
    link.dataset.lyricStudioFont = family;
    link.onload = () => resolve(true);
    link.onerror = () => { googleFontStylesheets.delete(family); resolve(false); };
    document.head.appendChild(link);
  });
  googleFontStylesheets.set(family, promise);
  return promise;
}
async function ensureGoogleFontReady(family, size = 64) {
  const meta = fontMeta(family);
  if (!meta) return true;
  const stylesheetReady = await ensureGoogleFontStylesheet(family);
  if (!stylesheetReady || !document.fonts) return false;
  try {
    await Promise.all(meta.weights.map(weight => document.fonts.load(`${weight} ${size}px "${family}"`, 'Lyric Studio 0123456789')));
    await document.fonts.ready;
    return meta.weights.every(weight => document.fonts.check(`${weight} ${size}px "${family}"`, 'Lyric Studio 0123456789'));
  } catch (_) {
    return false;
  }
}

const drawBackgroundScene = (ctx, w, h, t, preset, solidColor) => {
  const fillSky = (stops) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  const glow = (x, y, radius, inner, outer) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  const ridge = (points, color) => {
    ctx.beginPath(); ctx.moveTo(0, h);
    points.forEach(([x, y]) => ctx.lineTo(x * w, y * h));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  };
  const sun = (x, y, r, colorA, colorB) => {
    const g = ctx.createRadialGradient(x, y, r * .08, x, y, r * 2.7);
    g.addColorStop(0, colorA); g.addColorStop(.35, colorB); g.addColorStop(1, 'rgba(255,190,128,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = colorA; ctx.fill();
  };

  if (preset === 'solid') {
    ctx.fillStyle = solidColor; ctx.fillRect(0, 0, w, h);
  } else if (preset === 'sunrise') {
    fillSky([[0,'#111a37'],[.34,'#4a456f'],[.62,'#bd7d86'],[.82,'#f1b787'],[1,'#f6ddb0']]);
    sun(w*.76,h*.61,h*.095,'#fff0c8','rgba(255,192,130,.45)');
    ridge([[0,.69],[.12,.55],[.22,.65],[.36,.48],[.49,.64],[.63,.53],[.76,.67],[.88,.56],[1,.66]],'#3b4263');
    ridge([[0,.78],[.15,.66],[.28,.75],[.43,.59],[.56,.75],[.7,.63],[.85,.78],[1,.68]],'#222e4d');
    ridge([[0,.91],[.18,.8],[.31,.88],[.47,.75],[.64,.88],[.79,.78],[1,.9]],'#111d36');
  } else if (preset === 'mountains') {
    fillSky([[0,'#10192f'],[.36,'#3f4c72'],[.65,'#a38a9c'],[1,'#e4c3ac']]);
    sun(w*.76,h*.38,h*.06,'#fff0dc','rgba(255,220,191,.27)');
    ridge([[0,.77],[.12,.45],[.22,.66],[.34,.3],[.48,.67],[.64,.37],[.78,.7],[.9,.47],[1,.72]],'#505a78');
    ridge([[0,.86],[.15,.65],[.27,.78],[.43,.55],[.57,.78],[.72,.6],[.85,.82],[1,.65]],'#2b3858');
    ridge([[0,.94],[.2,.82],[.34,.91],[.52,.76],[.67,.9],[.81,.79],[1,.91]],'#15213c');
  } else if (preset === 'ocean') {
    fillSky([[0,'#10243f'],[.38,'#2f657b'],[.57,'#a7a7a1'],[.68,'#f1c79e'],[1,'#102c47']]);
    sun(w*.72,h*.52,h*.06,'#fff1c9','rgba(255,221,162,.27)');
    const horizon=h*.59;
    const sea=ctx.createLinearGradient(0,horizon,0,h); sea.addColorStop(0,'#426f82'); sea.addColorStop(.35,'#214b64'); sea.addColorStop(1,'#0c203b');
    ctx.fillStyle=sea;ctx.fillRect(0,horizon,w,h-horizon);
    for(let i=0;i<42;i++){
      const yy=horizon+(i/42)*(h-horizon), spread=(i/42)*w*.22;
      const xx=w*.72+Math.sin(i*2.17+t*.08)*spread*.23;
      const ww=(w*.015+(i%5)*w*.004)*(1+i/25);
      ctx.strokeStyle=`rgba(255,220,174,${.03+(1-i/42)*.13})`;ctx.lineWidth=Math.max(1,h*.0015*(i%3+1));
      ctx.beginPath();ctx.moveTo(xx-ww/2,yy);ctx.lineTo(xx+ww/2,yy);ctx.stroke();
    }
  } else if (preset === 'forest') {
    fillSky([[0,'#0d2029'],[.42,'#31585a'],[.7,'#c09279'],[1,'#e0bd91']]);
    glow(w*.73,h*.55,w*.6,'rgba(255,211,153,.4)','rgba(255,190,136,0)');
    ridge([[0,.7],[.18,.52],[.31,.67],[.49,.54],[.63,.69],[.8,.5],[1,.68]],'#29464a');
    const tree=(x,y,scale,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-scale*.55,y+scale*.75);ctx.lineTo(x+scale*.55,y+scale*.75);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x,y+scale*.25);ctx.lineTo(x-scale*.7,y+scale);ctx.lineTo(x+scale*.7,y+scale);ctx.closePath();ctx.fill();};
    for(let i=0;i<24;i++){
      const x=(i/23)*w+(Math.sin(i*3.7)*w*.025), base=h*(.64+(i%4)*.055), sc=h*(.15+(i%5)*.035);
      tree(x,base,sc,i%3===0?'#0b242b':i%3===1?'#123238':'#183b3b');
    }
    ctx.fillStyle='#091923';ctx.fillRect(0,h*.94,w,h*.06);
  } else if (preset === 'clouds') {
    fillSky([[0,'#272b57'],[.3,'#76658d'],[.57,'#d18f98'],[.78,'#f6c9a3'],[1,'#f6dfbd']]);
    glow(w*.5,h*.2,w*.75,'rgba(255,220,188,.35)','rgba(255,220,188,0)');
    // Soft cloud banks, intentionally low-contrast behind the lyrics.
    for(let band=0;band<3;band++){
      const y=h*(.57+band*.12);
      for(let i=0;i<11;i++){
        const x=((i/10)*w)+(band%2?w*.04:-w*.02); const r=h*(.035+(i%3)*.012);
        ctx.beginPath();ctx.ellipse(x,y+Math.sin(i*2+band)*h*.012,r*2.8,r,0,0,Math.PI*2);
        ctx.fillStyle=`rgba(${band===0?'255,222,201':'85,79,121'},${band===0?.16:.13})`;ctx.fill();
      }
    }
  } else if (preset === 'cross') {
    fillSky([[0,'#121b37'],[.34,'#494366'],[.61,'#bd7e7d'],[.82,'#f0b985'],[1,'#efd7ae']]);
    sun(w*.73,h*.58,h*.105,'#fff1ca','rgba(255,203,139,.36)');
    ridge([[0,.73],[.18,.65],[.34,.72],[.49,.6],[.63,.7],[.79,.61],[1,.7]],'#41445f');
    // The cross sits off-centre so lyrics remain the focal point.
    const cx=w*.78, top=h*.31, bottom=h*.72, thickness=Math.max(5,w*.009), arm=Math.max(22,w*.05);
    ctx.fillStyle='rgba(16,21,38,.9)';ctx.fillRect(cx-thickness/2,top,thickness,bottom-top);ctx.fillRect(cx-arm/2,h*.44,arm,thickness);
    ridge([[0,.83],[.18,.77],[.37,.83],[.55,.72],[.72,.79],[.86,.74],[1,.8]],'#222d48');
    ridge([[0,.94],[.23,.86],[.41,.92],[.62,.84],[.8,.91],[1,.86]],'#111b31');
  } else if (preset === 'night') {
    fillSky([[0,'#071025'],[.52,'#172849'],[1,'#3d4c70']]);
    glow(w*.72,h*.18,w*.55,'rgba(110,143,193,.18)','rgba(70,93,151,0)');
    const mx=w*.76,my=h*.28,mr=h*.055;
    ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.fillStyle='#e5e8ef';ctx.fill();
    ctx.beginPath();ctx.arc(mx+mr*.42,my-mr*.22,mr*.85,0,Math.PI*2);ctx.fillStyle='#192b4a';ctx.fill();
    for(let i=0;i<95;i++){
      const xx=((i*127.7)%997)/997*w, yy=((i*73.1)%991)/991*h*.78;
      const pulse=.28+.55*(.5+.5*Math.sin(t*.7+i*1.91));
      ctx.fillStyle=`rgba(255,245,223,${pulse*(i%7===0?.95:.48)})`;
      ctx.beginPath();ctx.arc(xx,yy,(i%5===0?1.6:.7)*Math.min(w/960,1.2),0,Math.PI*2);ctx.fill();
    }
    ridge([[0,.82],[.16,.7],[.28,.79],[.42,.67],[.58,.81],[.76,.7],[.9,.8],[1,.73]],'#101b32');
  } else if (preset === 'worship') {
    fillSky([[0,'#080f28'],[.5,'#222855'],[1,'#100f27']]);
    glow(w*.22,h*.42,w*.6,'rgba(91,135,255,.35)','rgba(64,93,255,0)');
    glow(w*.78,h*.39,w*.55,'rgba(231,139,197,.28)','rgba(231,139,197,0)');
    glow(w*.5,h*.7,w*.42,'rgba(156,130,255,.12)','rgba(156,130,255,0)');
    for(let i=0;i<9;i++){
      const x=w*(.08+i*.105), y=h*(.19+(i%3)*.09);
      const g=ctx.createRadialGradient(x,y,1,x,y,h*.23);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(1,'rgba(146,151,255,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    }
    ctx.fillStyle='rgba(5,8,20,.28)';ctx.fillRect(0,h*.8,w,h*.2);
  }
};

const drawBackdrop = (ctx, w, h, t, {bg, bgImg, preset, motion, dim}) => {
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const zoomOn = motion==='slow-zoom' || motion==='cinematic';
  const panOn = motion==='gentle-pan' || motion==='cinematic';
  const zoom = zoomOn ? 1.035 + .012*Math.sin(t*.22) : (panOn ? 1.025 : 1);
  const panX = panOn ? Math.sin(t*.11)*w*.012 : 0;
  const panY = panOn ? Math.cos(t*.085)*h*.008 : 0;
  ctx.save();
  ctx.translate(w/2+panX,h/2+panY);ctx.scale(zoom,zoom);ctx.translate(-w/2,-h/2);
  if(bgImg&&bgImg.complete&&bgImg.naturalWidth){
    const scale=Math.max(w/bgImg.naturalWidth,h/bgImg.naturalHeight),dw=bgImg.naturalWidth*scale,dh=bgImg.naturalHeight*scale;
    ctx.drawImage(bgImg,(w-dw)/2,(h-dh)/2,dw,dh);
  } else {
    drawBackgroundScene(ctx,w,h,t,preset==='custom'?'sunrise':preset,bg);
  }
  ctx.restore();

  const darkAlpha=Math.max(0,Math.min(75,dim))/100*.66;
  if(darkAlpha>0){ctx.fillStyle=`rgba(3,8,22,${darkAlpha})`;ctx.fillRect(0,0,w,h);}

  if(motion==='light-rays'||motion==='cinematic'){
    const ox=w*.73, oy=h*.2;
    ctx.save();ctx.globalCompositeOperation='screen';ctx.translate(ox,oy);ctx.rotate(Math.sin(t*.08)*.055);
    for(let i=-5;i<=5;i++){
      const spread=(i*.12)+Math.sin(t*.16+i)*.018;
      const reach=w*(.2+Math.abs(i)*.035);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(spread*w-reach*.1,h*1.05);ctx.lineTo(spread*w+reach*.14,h*1.05);ctx.closePath();
      ctx.fillStyle=`rgba(255,222,174,${.018+(5-Math.abs(i))*.004})`;ctx.fill();
    }
    ctx.restore();
  }
  if(motion==='floating-particles'||motion==='cinematic'){
    for(let i=0;i<54;i++){
      const seed=((i*127.13+31.7)%997)/997;
      const speed=4+(i%8)*2.1;
      const x=((((i*83.71)%991)/991)*w)+Math.sin(t*.24+i*1.7)*w*.012;
      const y=((seed*h*1.4-t*speed)%(h*1.4)+h*1.4)%(h*1.4)-h*.2;
      const alpha=.1+.22*(.5+.5*Math.sin(t*.9+i*2.3));
      ctx.fillStyle=`rgba(255,232,191,${alpha})`;
      ctx.beginPath();ctx.arc(x,y,(i%4===0?1.7:0.8)*Math.max(.7,w/960),0,Math.PI*2);ctx.fill();
      if(i%11===0){ctx.strokeStyle=`rgba(255,239,210,${alpha*.6})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();}
    }
  }
  const vignette=ctx.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.12,w*.5,h*.46,Math.max(w,h)*.72);
  vignette.addColorStop(0,'rgba(3,7,18,0)');vignette.addColorStop(1,'rgba(2,5,16,.48)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
};

function App(){
  const audioRef=useRef(null), canvasRef=useRef(null), exportCanvasRef=useRef(null), rafRef=useRef(null), recorderRef=useRef(null), chunksRef=useRef([]), stopAtRef=useRef(null);
  const [audioUrl,setAudioUrl]=useState(''), [audioName,setAudioName]=useState('No audio uploaded'), [duration,setDuration]=useState(0);
  const [lyricsText,setLyricsText]=useState('I walk alone\nThrough the night\nWaiting for the morning light\nI keep on dreaming');
  const [lines,setLines]=useState(demo), [activeId,setActiveId]=useState(demo[0].id), [time,setTime]=useState(0), [playing,setPlaying]=useState(false);
  const [mode,setMode]=useState('line'), [bg,setBg]=useState('#101b35'), [highlight,setHighlight]=useState('#f9d34b'), [textColor,setTextColor]=useState('#ffffff'), [fontSize,setFontSize]=useState(37), [font,setFont]=useState('Montserrat'), [position,setPosition]=useState('center');
  const [fontSearch,setFontSearch]=useState(''), [fontCategory,setFontCategory]=useState('All fonts'), [fontRevision,setFontRevision]=useState(0);
  const [focusOnly,setFocusOnly]=useState(false);
  const [trash,setTrash]=useState([]);
  const dragIdRef=useRef(null); const [dropId,setDropId]=useState(null);
  const [syncOffset,setSyncOffset]=useState(0);
  const [caseMode,setCaseMode]=useState('original');
  const dcase=(s)=>caseMode==='lower'?String(s??'').toLowerCase():caseMode==='upper'?String(s??'').toUpperCase():String(s??'');
  // Animation controls are percentages of each lyric line's timed duration.
  const [lineAnimationPercent,setLineAnimationPercent]=useState(100);
  const [wordAnimationPercent,setWordAnimationPercent]=useState(100);
  // Animation defaults are time-based, so preview and export render the same frame when seeking.
  const [lineEntrance,setLineEntrance]=useState('pop');
  const [lineExit,setLineExit]=useState('fade');
  const [wordEffect,setWordEffect]=useState('glow');
  const [animationDuration,setAnimationDuration]=useState(0.4);
  const [orientation,setOrientation]=useState('landscape');
  const [bgPreset,setBgPreset]=useState('sunrise');
  const [bgMotion,setBgMotion]=useState('cinematic');
  const [bgDim,setBgDim]=useState(32);
  const [bgImageUrl,setBgImageUrl]=useState(''), [bgImg,setBgImg]=useState(null);
  const [headerText,setHeaderText]=useState(''), [footerText,setFooterText]=useState('');
  const [watermarkText,setWatermarkText]=useState('LYRIC STUDIO');
  const [headerSize,setHeaderSize]=useState(30), [headerFont,setHeaderFont]=useState(''), [headerColor,setHeaderColor]=useState('');
  const [footerSize,setFooterSize]=useState(22), [footerFont,setFooterFont]=useState(''), [footerColor,setFooterColor]=useState('');
  const bgInputRef=useRef(null);
  const dims=orientation==='portrait'?{w:540,h:960}:orientation==='square'?{w:720,h:720}:{w:960,h:540};
  const miniDims=orientation==='portrait'?{w:270,h:480}:orientation==='square'?{w:360,h:360}:{w:640,h:360};
  const miniCanvasRef=useRef(null);
  const [exporting,setExporting]=useState(false), [exportMsg,setExportMsg]=useState(''), [tab,setTab]=useState('sync'), [showLyrics,setShowLyrics]=useState(false);
  const adjTime=time+syncOffset;
  const current=useMemo(()=>lines.find(l=>adjTime>=l.start && adjTime<l.end), [lines,adjTime]);
  const filteredFonts=useMemo(()=>FONT_LIBRARY.filter(item=>(fontCategory==='All fonts'||item.category===fontCategory)&&(`${item.family} ${item.category} ${item.description}`).toLowerCase().includes(fontSearch.trim().toLowerCase())),[fontCategory,fontSearch]);
  const fontRequestKey=useMemo(()=>Array.from(new Set([font,headerFont||font,footerFont||font,...lines.flatMap(line=>[line.fontFamily,...(line.wordStyles||[]).map(style=>style?.fontFamily)])].filter(Boolean))).sort().join('|'),[font,headerFont,footerFont,lines]);
  useEffect(()=>{ if(current) setActiveId(current.id); },[current?.id]);
  useEffect(()=>{ FONT_LIBRARY.forEach(item=>ensureGoogleFontStylesheet(item.family)); },[]);
  useEffect(()=>{ let live=true; const families=fontRequestKey.split('|').filter(Boolean); Promise.all(families.map(family=>ensureGoogleFontReady(family,Math.max(64,Math.round(fontSize*1.5))))).then(()=>{if(live)setFontRevision(value=>value+1);}); return ()=>{live=false;}; },[fontRequestKey]);
  useEffect(()=>()=>{ if(audioUrl) URL.revokeObjectURL(audioUrl); if(rafRef.current) cancelAnimationFrame(rafRef.current); },[]);
  const updateLine=(id,patch)=>setLines(old=>old.map((l,i)=>{if(l.id!==id)return l;return {...l,...patch};}).map((l,i,a)=>({...l,end: i<a.length-1 ? Math.max(l.start, a[i+1].start) : l.end})));
  const onAudio=(file)=>{if(!file)return; if(audioUrl)URL.revokeObjectURL(audioUrl);const url=URL.createObjectURL(file);setAudioUrl(url);setAudioName(file.name);setTime(0);setPlaying(false);};
  const onBgImage=(file)=>{if(bgImageUrl)URL.revokeObjectURL(bgImageUrl); if(!file){setBgImageUrl('');return;} setBgImageUrl(URL.createObjectURL(file));};
  useEffect(()=>{if(!bgImageUrl){setBgImg(null);return;} let live=true; const img=new Image(); img.onload=()=>{if(live)setBgImg(img);}; img.onerror=()=>{if(live)setBgImg(null);}; img.src=bgImageUrl; return ()=>{live=false;};},[bgImageUrl]);
  useEffect(()=>()=>{if(bgImageUrl)URL.revokeObjectURL(bgImageUrl);},[bgImageUrl]);
  const loadLyrics=()=>{const lyricLines=lyricsText.split(/\r\n|\n|\r/).map((line=>line.trim())).filter(Boolean),count=lyricLines.length;if(!count)return;const step=duration>0?duration/count:4,next=lyricLines.map(((text,i)=>({id:uid(),text:capFirst(text),start:i*step,end:(i+1)*step})));setLines(next),setActiveId(next[0].id),setTab("sync")};
  const seek=(t)=>{stopAtRef.current=null; const v=Math.max(0,Math.min(duration||Infinity,t));if(audioRef.current)audioRef.current.currentTime=v;setTime(v);};
  const markStart=(id)=>{const now=audioRef.current&&audioUrl?audioRef.current.currentTime:time; const index=lines.findIndex(l=>l.id===id);setLines(old=>old.map((l,i)=>i===index?{...l,start:now,end:Math.max(now,old[i+1]?.start ?? (duration||now+3)),timed:true,hidden:true,wordTimes:null}:i===index-1?{...l,end:now}:l));setActiveId(id);};
  const tapWord=(id)=>{const now=audioRef.current&&audioUrl?audioRef.current.currentTime:time; setLines(old=>old.map(l=>{if(l.id!==id)return l; const words=l.text.trim().split(/\s+/).filter(Boolean); if(!words.length)return l; const cur=Array.isArray(l.wordTimes)?l.wordTimes:[]; return {...l,wordTimes:cur.length>=words.length?[now]:[...cur,now]};}));};
  const addLine=()=>{const now=audioRef.current&&audioUrl?audioRef.current.currentTime:time; const l={id:uid(),text:'New lyric line',start:now,end:duration||now+4,timed:true};setLines(old=>[...old,l].sort((a,b)=>a.start-b.start));setActiveId(l.id);};
  const removeLine=(id)=>{const li=lines.findIndex(l=>l.id===id); if(li<0)return; setTrash(old=>[...old,{line:lines[li],index:li}]); setLines(old=>old.filter(l=>l.id!==id));};
  const restoreLine=(id)=>{const t=trash.find(t=>t.line.id===id); if(!t)return; setTrash(old=>old.filter(x=>x.line.id!==id)); setLines(old=>[...old,t.line].sort((a,b)=>a.start-b.start)); setActiveId(t.line.id);};
  const reset=()=>{setLines([]);setLyricsText('');setTime(0);setExportMsg('');};
  const playLine=(line)=>{const a=audioRef.current; if(!a||!audioUrl)return; setActiveId(line.id); stopAtRef.current=Number.isFinite(line.end)?line.end:null; a.currentTime=Math.max(0,line.start||0); a.play().catch(()=>{});};
  const listDrop=(e)=>{e.preventDefault(); const from=dragIdRef.current; dragIdRef.current=null; setDropId(null); if(!from)return; const rows=[...e.currentTarget.querySelectorAll('.lyric-row')]; let target=null,after=true; for(const r of rows){const b=r.getBoundingClientRect(); if(e.clientY<b.top){target=r;after=false;break;} if(e.clientY<=b.bottom){target=r;after=(e.clientY-b.top)>b.height/2;break;} target=r;after=true;} if(target&&target.getAttribute('data-id')===from)return; setLines(old=>{const cur=old.filter(l=>l.id!==from); const moving=old.find(l=>l.id===from); if(!moving)return old; let to=cur.length; if(target){const ix=cur.findIndex(l=>l.id===target.getAttribute('data-id')); if(ix>=0)to=ix+(after?1:0);} return [...cur.slice(0,to),moving,...cur.slice(to)];});};
  const openLines=lines.filter(line=>!line.hidden);
  const visibleLines=focusOnly ? openLines.filter(line=>line.id===activeId) : openLines;
  const hiddenCount=lines.length-openLines.length;
  const drawFrame=(ctx,w,h,t)=>{
    drawBackdrop(ctx,w,h,t,{bg,bgImg,preset:bgPreset,motion:bgMotion,dim:bgDim});
    const k=w/960;
    const line=lines.find(l=>t>=l.start && t<l.end);
    if(line){
      const lineFontSize=line.fontSize ?? fontSize;
      const lineTextColor=line.textColor || textColor;
      const words=dcase(line.text).trim().split(/\s+/).filter(Boolean);
      const full=words.join(' ');
      const y=position==='top'?h*.22:position==='bottom'?h*.78:h*.52;
      const lineFontFamily=line.fontFamily||font;
      const baseCanvasSize=lineFontSize*1.5*k;
      const wordFamilyAt=index=>line.wordStyles?.[index]?.fontFamily||lineFontFamily;
      const wordScaleAt=index=>{const value=line.wordStyles?.[index]?.scale;return value!=null?Math.max(.5,Math.min(2,Number(value)/100||1)):1;};
      const measureWords=items=>{const widths=items.map((word,index)=>{ctx.font=canvasFont(wordFamilyAt(index),baseCanvasSize,800);return ctx.measureText(word).width*wordScaleAt(index);});ctx.font=canvasFont(lineFontFamily,baseCanvasSize,800);return {widths,space:ctx.measureText(' ').width};};
      const elapsed=Math.max(0,t-line.start);
      const span=Math.max(.1,line.end-line.start);
      const animated=mode!=='static';
      const activeEntrance=line.enterAnimation ?? lineEntrance;
      const activeExit=line.exitAnimation ?? lineExit;
      const animDur=Math.max(.08,Math.min(animationDuration,span*.42));
      const clamp01=n=>Math.max(0,Math.min(1,n));
      const easeOut=n=>1-Math.pow(1-clamp01(n),3);
      const intro=(!animated||activeEntrance==='none')?1:clamp01(elapsed/animDur);
      const outro=(!animated||activeExit==='none')?1:clamp01((line.end-t)/animDur);
      let alpha=1,translateX=0,translateY=0,wholeScale=1;
      if(animated){
        if(activeEntrance==='fade')alpha*=intro;
        if(activeExit==='fade')alpha*=outro;
        if(activeEntrance==='slide-up')translateY+=(1-easeOut(intro))*lineFontSize*1.6*k;
        if(activeEntrance==='slide-left')translateX-=(1-easeOut(intro))*w*.14;
        if(activeExit==='slide-down')translateY+=(1-outro)*lineFontSize*1.6*k;
        if(activeExit==='slide-right')translateX+=(1-outro)*w*.14;
        if(activeEntrance==='pop')wholeScale*=.72+.28*easeOut(intro);
        if(activeExit==='shrink')wholeScale*=.82+.18*outro;
      }
      const hasCustomWordStyle=Array.isArray(line.wordStyles)&&line.wordStyles.some(st=>st&&(st.color||(st.scale!=null&&Number(st.scale)!==100)||st.fontFamily));
      const typewriter=animated&&activeEntrance==='typewriter';
      const visibleChars=typewriter?Math.max(0,Math.ceil(full.length*intro)):full.length;
      ctx.save();
      ctx.globalAlpha*=alpha;
      // Transform the complete lyric group around the intended anchor point.
      ctx.translate(w/2+translateX,y+translateY);
      ctx.scale(wholeScale,wholeScale);
      ctx.translate(-w/2,-y);
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.font=canvasFont(lineFontFamily,baseCanvasSize,800);

      if(mode==='static'&&!hasCustomWordStyle){
        // Static mode intentionally has no transitions, highlights, or word motion.
        ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillText(full,w/2+2,y+3);
        ctx.fillStyle=lineTextColor;ctx.fillText(full,w/2,y);
      } else if(mode==='word' && words.length){
        const wt=Array.isArray(line.wordTimes)&&line.wordTimes.length===words.length?line.wordTimes:null;
        let idx=0;
        if(wt){for(let wi=0;wi<wt.length;wi++){if(t>=wt[wi])idx=wi;else break;}}
        else{
          const animationSpan=Math.max(.1,span*(wordAnimationPercent/100));
          idx=Math.min(words.length-1,Math.max(0,Math.floor(elapsed/animationSpan*words.length)));
        }
        const layout=measureWords(words);
        const measured=layout.widths,space=layout.space;
        const total=measured.reduce((a,b)=>a+b,0)+space*(words.length-1);
        let x=(w-total)/2;
        let charOffset=0;
        words.forEach((word,i)=>{
          const style=line.wordStyles?.[i]||{};
          const charsLeft=typewriter?visibleChars-charOffset:word.length;
          const visibleWord=typewriter?word.slice(0,Math.max(0,Math.min(word.length,charsLeft))):word;
          charOffset+=word.length+(i<words.length-1?1:0);
          if(!visibleWord){x+=measured[i]+space;return;}
          const isCurrent=i===idx;
          const customColor=style.color;
          let color=customColor||(i<=idx?highlight:lineTextColor);
          let wordScale=style.scale!=null?Math.max(.5,Math.min(2,Number(style.scale)/100||1)):1;
          if(animated&&isCurrent&&wordEffect==='bounce'){
            const wordStart=wt?wt[i]:line.start+(span*(wordAnimationPercent/100))*i/words.length;
            const wordEnd=wt?(wt[i+1]??line.end):line.start+(span*(wordAnimationPercent/100))*(i+1)/words.length;
            const wp=clamp01((t-wordStart)/Math.max(.08,wordEnd-wordStart));
            wordScale*=1+.16*Math.sin(Math.PI*wp);
          } else if(animated&&isCurrent&&wordEffect==='pulse'){
            wordScale*=1+.06*Math.sin(elapsed*9);
          }
          ctx.save();
          if(animated&&isCurrent&&wordEffect==='glow'){
            ctx.shadowColor=customColor||highlight;ctx.shadowBlur=20*k;
          }
          ctx.font=canvasFont(wordFamilyAt(i),baseCanvasSize,800);
          ctx.textAlign='left';ctx.fillStyle='rgba(0,0,0,.38)';
          ctx.fillText(visibleWord,x+2,y+3);
          ctx.translate(x+measured[i]/2,y);ctx.scale(wordScale,wordScale);ctx.textAlign='center';ctx.fillStyle=color;
          ctx.fillText(visibleWord,0,0);
          ctx.restore();
          x+=measured[i]+space;
        });
      } else if(hasCustomWordStyle && words.length){
        // Word-level styling remains visible in line mode. It intentionally takes priority over
        // the global progressive highlight so each chosen color/scale remains readable.
        const layout=measureWords(words),measured=layout.widths,space=layout.space;
        const total=measured.reduce((a,b)=>a+b,0)+space*(words.length-1);
        let x=(w-total)/2,charOffset=0;
        words.forEach((word,i)=>{
          const style=line.wordStyles?.[i]||{};
          const charsLeft=typewriter?visibleChars-charOffset:word.length;
          const visibleWord=typewriter?word.slice(0,Math.max(0,Math.min(word.length,charsLeft))):word;
          charOffset+=word.length+(i<words.length-1?1:0);
          if(!visibleWord){x+=measured[i]+space;return;}
          const wordScale=style.scale!=null?Math.max(.5,Math.min(2,Number(style.scale)/100||1)):1;
          ctx.save();ctx.font=canvasFont(wordFamilyAt(i),baseCanvasSize,800);ctx.textAlign='left';ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillText(visibleWord,x+2,y+3);
          ctx.translate(x+measured[i]/2,y);ctx.scale(wordScale,wordScale);ctx.textAlign='center';ctx.fillStyle=style.color||lineTextColor;ctx.fillText(visibleWord,0,0);ctx.restore();
          x+=measured[i]+space;
        });
      } else {
        // Standard line mode: progressive color reveal, with optional typewriter entrance.
        const displayText=typewriter?full.slice(0,visibleChars):full;
        ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillText(displayText,w/2+2,y+3);
        ctx.fillStyle=lineTextColor;ctx.fillText(displayText,w/2,y);
        const width=ctx.measureText(full).width;
        const progress=Math.max(0,Math.min(1,elapsed/Math.max(.1,span*(lineAnimationPercent/100))));
        const left=(w-width)/2;
        ctx.save();ctx.beginPath();ctx.rect(left-1,y-lineFontSize*1.15*k,Math.max(0,width*progress+2),lineFontSize*2.3*k);ctx.clip();
        ctx.fillStyle=highlight;ctx.fillText(displayText,w/2,y);ctx.restore();
      }
      ctx.restore();
    } else {
      ctx.fillStyle='rgba(255,255,255,.72)';ctx.font=`600 ${28*k}px Arial`;ctx.textAlign='center';ctx.fillText('Your lyrics will appear here',w/2,h/2);
    }
    if(headerText){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=canvasFont(headerFont||font,headerSize*k,700);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillText(headerText,w/2+1,45*k+1);ctx.fillStyle=headerColor||textColor;ctx.fillText(headerText,w/2,45*k);}
    if(footerText){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=canvasFont(footerFont||font,footerSize*k,600);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillText(footerText,w/2+1,h-72*k+1);ctx.fillStyle=footerColor||'rgba(255,255,255,.85)';ctx.fillText(footerText,w/2,h-72*k);}
    if(watermarkText){ctx.fillStyle='rgba(255,255,255,.42)';ctx.font='18px Arial';ctx.textAlign='left';ctx.fillText(watermarkText,42,h-38);}
  };
  useEffect(()=>{let raf=0,last=-1; const loop=()=>{const a=audioRef.current; const playingNow=!!(a&&audioUrl&&!a.paused); if(stopAtRef.current!=null&&a&&!a.paused&&a.currentTime>=stopAtRef.current){a.pause();stopAtRef.current=null;} const t=(a&&audioUrl?a.currentTime:time)+syncOffset; if(playingNow||t!==last){const targets=[canvasRef.current,exportCanvasRef.current,miniCanvasRef.current];targets.forEach(canvas=>{if(canvas){const ctx=canvas.getContext('2d');drawFrame(ctx,canvas.width,canvas.height,t);}}); last=t;} raf=requestAnimationFrame(loop);}; raf=requestAnimationFrame(loop); return ()=>cancelAnimationFrame(raf);},[time,audioUrl,syncOffset,lines,bg,bgImg,bgPreset,bgMotion,bgDim,highlight,textColor,fontSize,font,fontRevision,position,mode,headerText,headerSize,headerFont,headerColor,footerText,footerSize,footerFont,footerColor,watermarkText,orientation,lineAnimationPercent,wordAnimationPercent,lineEntrance,lineExit,wordEffect,animationDuration,tab,caseMode]);
  const exportVideo=async()=>{const audio=audioRef.current,canvas=exportCanvasRef.current;if(!audioUrl){setExportMsg('Upload an audio file before exporting.');return;}if(!canvas.captureStream||!window.MediaRecorder){setExportMsg('Video recording is not supported in this browser. Try the latest Chrome or Edge.');return;}
    try{setExporting(true);setExportMsg('Loading selected Google Fonts…');const usedFamilies=Array.from(new Set([font,headerFont||font,footerFont||font,...lines.flatMap(line=>[line.fontFamily,...(line.wordStyles||[]).map(style=>style?.fontFamily)])].filter(Boolean)));const fontReady=await Promise.all(usedFamilies.map(family=>ensureGoogleFontReady(family,Math.max(64,Math.round(fontSize*1.5*dims.w/960)))));if(fontReady.some(ready=>!ready)){setExportMsg('One or more Google Fonts could not load. Check your internet connection and try exporting again; recording was not started.');setExporting(false);return;}await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));seek(0);drawFrame(canvas.getContext('2d'),canvas.width,canvas.height,syncOffset);setExportMsg('Preparing real-time recording…');audio.pause();const stream=canvas.captureStream(30);let audioStream;
      if(audio.captureStream)audioStream=audio.captureStream();else if(audio.mozCaptureStream)audioStream=audio.mozCaptureStream();
      if(!audioStream){setExportMsg('This browser cannot capture audio for export. Try Chrome or Edge.');setExporting(false);return;}
      audioStream.getAudioTracks().forEach(track=>stream.addTrack(track));const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x))||'';
      const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorderRef.current=recorder;chunksRef.current=[];
      recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data);};
      recorder.onstop=()=>{const blob=new Blob(chunksRef.current,{type:recorder.mimeType||'video/webm'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(audioName.replace(/\.[^.]+$/,'')||'lyric-video')+'.webm';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);stream.getTracks().forEach(t=>t.stop());setExporting(false);setPlaying(false);setExportMsg('Export complete! Your video file was downloaded.');};
      audio.currentTime=0;recorder.start(250);await audio.play();setPlaying(true);setExportMsg('Recording video and audio in real time… keep this tab open.');
      audio.onended=()=>{if(recorder.state!=='inactive')recorder.stop();setPlaying(false);};
    }catch(e){setExporting(false);setExportMsg('Could not export: '+e.message+'. Try Chrome or Edge and check browser permissions.');}
  };
  const stopExport=()=>{if(recorderRef.current&&recorderRef.current.state!=='inactive')recorderRef.current.stop();if(audioRef.current){audioRef.current.pause();audioRef.current.onended=null;}setPlaying(false);};
  return <div className="app"><canvas ref={exportCanvasRef} width={dims.w} height={dims.h} style={{position:'fixed',left:'-2000px',top:0,width:dims.w,height:dims.h,pointerEvents:'none'}} aria-hidden="true"/><audio ref={audioRef} src={audioUrl||undefined} style={{display:'none'}} onLoadedMetadata={e=>{setDuration(e.currentTarget.duration||0);}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} />
    <header className="topbar"><div className="brand"><div className="logo"><Music2 size={24}/></div><div><h1>Lyric Studio</h1><p>Turn your music into a lyric video</p></div></div><div className="top-actions"><button className="btn ghost" onClick={reset}><RotateCcw size={16}/> Reset project</button><button className="btn primary" onClick={exportVideo} disabled={exporting}><Download size={16}/>{exporting?'Recording…':'Export video'}</button>{exporting&&<button className="btn danger" onClick={stopExport}>Stop export</button>}</div></header>
    <main className="layout"><aside className="sidebar"><div className="side-label">YOUR PROJECT</div>{[['upload','1','Upload files'],['sync','2','Sync lyrics'],['preview','3','Preview'],['export','4','Export video']].map(([key,n,label])=><button key={key} className={'step '+(tab===key?'selected':'')} onClick={()=>setTab(key)}><span className="step-num">{n}</span><span>{label}<small>{({upload:'Add audio and lyrics',sync:'Mark line timings',preview:'Style your video',export:'Create your file'})[key]}</small></span>{tab===key&&<span className="step-dot"/>}</button>)}<div className="sidebar-note"><CircleHelp size={17}/><div><b>Quick tip</b><p>Play the song and click “Mark current time” when each lyric line begins.</p></div></div></aside>
    <section className="workspace">
      <div className="page-heading"><div><div className="eyebrow">KARAOKE VIDEO MAKER</div><h2>{tab==='upload'?'Start with your song':tab==='preview'?'Make it yours':tab==='export'?'Ready to export?':'Sync your lyrics'}</h2><p>Everything runs locally in your browser. No AI or external API required.</p></div><div className="local-pill"><span/> Local processing</div></div>
      {tab==='upload'&&<div className="panel upload-panel"><div className="panel-title"><FileAudio size={18}/> <h3>1. Upload your audio</h3></div><label className="dropzone"><input type="file" accept="audio/*" onChange={e=>onAudio(e.target.files?.[0])}/><div className="upload-icon"><Upload size={24}/></div><b>{audioUrl?audioName:'Choose an MP3 or audio file'}</b><span>{audioUrl?'Audio loaded — choose another file to replace it':'Click to browse your device. Audio stays in your browser.'}</span></label><div className="panel-title lyrics-title"><AlignLeft size={18}/><h3>2. Paste your lyrics</h3></div><textarea className="lyrics-input" value={lyricsText} onChange={e=>setLyricsText(e.target.value)} placeholder={'One lyric line per row…\nI walk alone\nThrough the night'} rows={8}/><div className="form-footer"><span>{lyricsText.split(/\r\n|\n|\r/).filter(x=>x.trim()).length} lyric lines</span><button className="btn primary" onClick={loadLyrics}><Check size={16}/> Create lyric lines</button></div><div className="hint">Line timings are initialized evenly as a starting point. You can sync each line to the music in the editor.</div></div>}
      {tab==='sync'&&<><div className="panel audio-panel"><div className="panel-head"><div className="panel-title"><AudioLines size={18}/><h3>Audio player</h3></div><div className="file-meta">{audioName}<span>{fmt(duration)}</span></div></div><div className="player-controls"><button className="play-btn" onClick={()=>{if(!audioRef.current)return;if(audioRef.current.paused)audioRef.current.play();else audioRef.current.pause();}}>{playing?<Pause size={21} fill="currentColor"/>:<Play size={21} fill="currentColor"/>}</button><div className="seek-area"><input aria-label="Seek audio" type="range" min="0" max={duration||100} step=".05" value={Math.min(time,duration||100)} onChange={e=>seek(Number(e.target.value))}/><div className="time-labels"><span>{fmt(time)}</span><span>{fmt(duration)}</span></div></div></div><div className="sync-offset"><label>Highlight offset<input type="number" aria-label="Highlight offset in seconds" min={-1} max={1} step={0.05} value={syncOffset} onChange={e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))setSyncOffset(Number(e.target.value));}} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n))setSyncOffset(Math.max(-1,Math.min(1,n)));}} /></label><span>{Math.round(syncOffset*1000)} ms</span></div><div className="waveform" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();seek(((e.clientX-r.left)/r.width)*(duration||0));}}>{Array.from({length:120},(_,i)=><span key={i} style={{height:`${12+((Math.sin(i*2.17)+1)*.5)*40+((Math.cos(i*.53)+1)*.5)*18}px`,opacity:i/120<time/(duration||1)?1:.42}}/>)}<div className="wave-cursor" style={{left:`${duration?time/duration*100:0}%`}}/></div><div className="wave-foot"><span>Click waveform to seek</span><span>{audioUrl?'Audio ready':'Upload an audio file in Upload files'}</span></div></div>
      <div className="panel lyrics-panel"><div className="panel-head"><div className="panel-title"><AlignLeft size={18}/><h3>Lyrics & timing</h3><span className="count">{lines.length} lines</span></div><div className="panel-actions"><label className="base-size" title="Base size for all lines — per-line sizes override it">All lines<input type="number" aria-label="Base text size for all lines" min="18" max="96" value={fontSize} onChange={e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))setFontSize(Number(e.target.value));}} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n))setFontSize(Math.max(18,Math.min(96,n)));}} /></label><div className="segmented"><button className={mode==='line'?'active':''} onClick={()=>setMode('line')}>Line mode</button><button className={mode==='word'?'active':''} onClick={()=>setMode('word')}>Word mode</button><button className={mode==='static'?'active':''} onClick={()=>setMode('static')}>Static</button></div><button className="btn small ghost" onClick={()=>setFocusOnly(v=>!v)} title="Temporarily show only the selected/current lyric line">{focusOnly?'Show all lines':'Focus current line'}</button><button className="btn small ghost" onClick={addLine}><Plus size={15}/> Add line</button></div></div><div className="sync-instructions"><Clock3 size={15}/><span>Select a line, play the song, then click <b>Mark current time</b> when that line starts.</span></div><div className="line-list" onDragOver={e=>{e.preventDefault(); if(e.dataTransfer)e.dataTransfer.dropEffect='move'; const r=e.target.closest?.('.lyric-row'); setDropId(r?r.getAttribute('data-id'):null);}} onDrop={listDrop}>{visibleLines.map(line=>{const i=lines.findIndex(item=>item.id===line.id);const wcount=line.text.trim().split(/\s+/).filter(Boolean).length,wdone=Array.isArray(line.wordTimes)?Math.min(line.wordTimes.length,wcount):0;return <div className={'lyric-row '+(activeId===line.id?'active':'')+(dropId===line.id?' drop-target':'')} key={line.id} data-id={line.id} onFocusCapture={()=>setActiveId(line.id)}><div className="lyric-row-main"><span className="drag-handle" draggable title="Drag to reorder" onDragStart={e=>{dragIdRef.current=line.id; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',line.id);}catch(_){} const row=e.currentTarget.closest('.lyric-row'); if(row)row.classList.add('dragging');}} onDragEnd={e=>{dragIdRef.current=null; setDropId(null); const row=e.currentTarget.closest('.lyric-row'); if(row)row.classList.remove('dragging');}}><GripVertical size={15}/></span><button className="row-play" title="Play this line from its start to its end" onClick={()=>playLine(line)}><Play size={14}/></button><span className={'sync-dot'+(line.timed?' on':'')} title={line.timed?'Timing set':'Not timed yet — press Mark current time while playing'}/><input className="line-text" aria-label="Lyric text" value={dcase(line.text)} onChange={e=>setLines(old=>old.map(l=>l.id===line.id?{...l,text:capFirst(e.target.value),wordTimes:null,wordStyles:[]}:l))}/><div className="time-field"><label>Start</label><input aria-label="Line start time" title="Start time as mm:ss.tenths, e.g. 00:19.3" inputMode="decimal" placeholder="00:00.0" defaultValue={fmt(line.start)} key={`${line.id}-${Number(line.start.toFixed(1))}`} onBlur={e=>{const n=parseTime(e.target.value); if(!Number.isFinite(n)||n<0){e.target.value=fmt(line.start);return;} const v=Math.round(n*10)/10; setLines(old=>old.map(l=>l.id===line.id?{...l,start:v,timed:true,wordTimes:null}:l).sort((a,b)=>a.start-b.start));}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></div><button className="mark-btn" onClick={()=>markStart(line.id)} title="Set this line's start to current playback time"><Clock3 size={14}/> Mark current time</button><button className="icon-btn" onClick={()=>removeLine(line.id)} title="Remove line"><Trash2 size={16}/></button><button className="icon-btn" onClick={()=>updateLine(line.id,{hidden:true})} title="Hide this line — mark as done"><Eye size={16}/></button></div><div className="line-style-controls"><label>Text size <input type="number" min="14" max="96" value={line.fontSize ?? fontSize} onChange={e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))updateLine(line.id,{fontSize:Number(e.target.value)});}} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n))updateLine(line.id,{fontSize:Math.max(14,Math.min(96,n))});}} /></label><label>Line color <input aria-label={`Text color for line ${i+1}`} type="color" value={line.textColor || textColor} onChange={e=>updateLine(line.id,{textColor:e.target.value})}/></label><label className="line-font-select">Line font<select aria-label={`Font for lyric line ${i+1}`} value={line.fontFamily||''} onChange={e=>updateLine(line.id,{fontFamily:e.target.value||null})}><option value="">Global font</option>{FONT_LIBRARY.map(item=><option key={item.family} value={item.family}>{item.family}</option>)}</select></label><button type="button" className="line-style-reset" onClick={()=>updateLine(line.id,{fontSize:null,textColor:null,fontFamily:null,wordTimes:null,wordStyles:[],enterAnimation:null,exitAnimation:null})}>Use default style</button><label className="line-animation-select">Entrance<select aria-label={`Entrance animation for line ${i+1}`} value={line.enterAnimation??'default'} onChange={e=>updateLine(line.id,{enterAnimation:e.target.value==='default'?null:e.target.value})}><option value="default">Global default</option><option value="none">None</option><option value="fade">Fade</option><option value="slide-up">Slide up</option><option value="slide-left">Slide left</option><option value="pop">Pop</option><option value="typewriter">Typewriter</option></select></label><label className="line-animation-select">Exit<select aria-label={`Exit animation for line ${i+1}`} value={line.exitAnimation??'default'} onChange={e=>updateLine(line.id,{exitAnimation:e.target.value==='default'?null:e.target.value})}><option value="default">Global default</option><option value="none">None</option><option value="fade">Fade</option><option value="slide-down">Slide down</option><option value="slide-right">Slide right</option><option value="shrink">Shrink</option></select></label>{mode==='word'&&<button type="button" className="line-style-reset" title="Tap along while playing to stamp each word's start time" onClick={()=>tapWord(line.id)}>{wdone>=wcount&&wcount>0?'Retap words':wdone>0?`Tap word ${wdone+1}/${wcount}`:'Tap words'}</button>}</div><details className="word-style-editor"><summary>Style individual words</summary><div className="word-style-grid">{line.text.trim().split(/\s+/).filter(Boolean).map((word,wordIndex)=>{const wordStyle=line.wordStyles?.[wordIndex]||{};return <div className="word-style-item" key={`${line.id}-${wordIndex}`}><strong>{word}</strong><label>Font<select aria-label={`Font for word ${word}`} value={wordStyle.fontFamily||''} onChange={e=>{const next=[...(line.wordStyles||[])];next[wordIndex]={...(next[wordIndex]||{}),fontFamily:e.target.value||undefined};updateLine(line.id,{wordStyles:next});}}><option value="">Line font</option>{FONT_LIBRARY.map(item=><option key={item.family} value={item.family}>{item.family}</option>)}</select></label><label>Color<input type="color" aria-label={`Color for word ${word}`} value={wordStyle.color||line.textColor||textColor} onChange={e=>{const next=[...(line.wordStyles||[])];next[wordIndex]={...(next[wordIndex]||{}),color:e.target.value};updateLine(line.id,{wordStyles:next});}}/></label><label>Size <span>{wordStyle.scale??100}%</span><input type="range" min="80" max="150" step="5" aria-label={`Size for word ${word}`} value={wordStyle.scale??100} onChange={e=>{const next=[...(line.wordStyles||[])];next[wordIndex]={...(next[wordIndex]||{}),scale:Number(e.target.value)};updateLine(line.id,{wordStyles:next});}}/></label><button type="button" className="line-style-reset" onClick={()=>{const next=[...(line.wordStyles||[])];next[wordIndex]={};updateLine(line.id,{wordStyles:next});}}>Reset</button></div>;})}</div><small>Custom word fonts, colors and sizes override the line style. In Word mode, uncustomized words still use karaoke highlighting.</small></details></div>;})}</div>{lines.length===0&&<div className="empty">No lyric lines yet. Add a line or paste lyrics in Upload files.</div>}{focusOnly&&<div className="focus-note">Focus view is on — the other lines are hidden temporarily. <button type="button" onClick={()=>setFocusOnly(false)}>Show all lines</button></div>}{hiddenCount>0&&<div className="focus-note">{hiddenCount} finished {hiddenCount===1?'line':'lines'} hidden. <button type="button" onClick={()=>setLines(old=>old.map(l=>({...l,hidden:false})))}>Show hidden lines</button></div>}{hiddenCount===lines.length&&lines.length>0&&<div className="empty">All lines are hidden. Use “Show hidden lines” above to review them.</div>}{trash.length>0&&<div className="recycle-bin"><div className="recycle-head"><span>Recycle bin ({trash.length})</span><button type="button" className="line-style-reset" onClick={()=>setTrash([])}>Empty bin</button></div>{trash.map(t=><div className="recycle-row" key={t.line.id}><span>{t.line.text||'(empty line)'} · {fmt(t.line.start)}</span><button type="button" className="line-style-reset" onClick={()=>restoreLine(t.line.id)}>Restore</button></div>)}</div>}<div className="list-footer"><button className="btn ghost" onClick={()=>setTab('upload')}><Plus size={15}/> Edit lyrics</button><span>Line end = next line start automatically</span></div></div></>}
      {tab==='preview'&&<div className="panel preview-panel"><div className="panel-title"><ImageIcon size={18}/><h3>Video style & live preview</h3></div><div className="big-preview"><canvas ref={canvasRef} width={dims.w} height={dims.h} style={dims.h>dims.w?{height:'60vh',width:'auto',margin:'0 auto'}:undefined}/><div className="preview-time">{fmt(time)} / {fmt(duration)}</div></div><div className="background-studio">
  <div className="background-studio-heading"><div><b>Background library</b><small>Choose a mood to match the message of the song.</small></div><span className="background-live-tag">LIVE CANVAS</span></div>
  <div className="background-preset-grid">
    {BG_PRESETS.map(preset=><button type="button" key={preset.id} className={'background-preset'+(!bgImageUrl&&bgPreset===preset.id?' selected':'')} onClick={()=>{setBgPreset(preset.id);if(bgImageUrl)onBgImage(null);}} aria-pressed={!bgImageUrl&&bgPreset===preset.id}>
      <span className="background-preset-swatch" style={{background:preset.swatch}}><span className="background-preset-glow"/></span>
      <span className="background-preset-copy"><b>{preset.label}</b><small>{preset.hint}</small></span>
      <span className="background-preset-check"><Check size={12}/></span>
    </button>)}
  </div>
  <div className="background-options-grid">
    <label>Background motion<select value={bgMotion} onChange={e=>setBgMotion(e.target.value)}>
      <option value="none">Still background</option><option value="slow-zoom">Slow cinematic zoom</option><option value="gentle-pan">Gentle drifting pan</option><option value="light-rays">Soft moving light rays</option><option value="floating-particles">Floating light particles</option><option value="cinematic">Slow zoom + light + dust</option>
    </select></label>
    <label className="background-dim-control"><span>Darken for lyric contrast <b>{bgDim}%</b></span><input type="range" min="0" max="65" step="1" value={bgDim} onChange={e=>setBgDim(Number(e.target.value))}/></label>
    {bgPreset==='solid'&&!bgImageUrl&&<label>Background color<div className="color-input"><input type="color" value={bg} onChange={e=>setBg(e.target.value)}/><code>{bg}</code></div></label>}
  </div>
  <div className="background-upload-row"><div className="background-upload-copy"><b>Use your own photo</b><small>Use a landscape, sky, church, nature, or worship image from your device.</small></div><input ref={bgInputRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files?.[0];if(file){setBgPreset('custom');onBgImage(file);}e.target.value='';}}/><div className="background-upload-actions"><button type="button" className="btn small ghost" onClick={()=>bgInputRef.current?.click()}>{bgImageUrl?'Change photo':'Upload photo'}</button>{bgImageUrl&&<button type="button" className="btn small ghost" onClick={()=>{onBgImage(null);setBgPreset('sunrise');}}>Remove</button>}</div></div>
  {bgImageUrl&&<p className="background-upload-status"><Check size={13}/> Custom photo selected — it will be included in the preview and video export.</p>}
</div>
<div className="style-grid"><label>Highlight color<div className="color-input"><input type="color" value={highlight} onChange={e=>setHighlight(e.target.value)}/><code>{highlight}</code></div></label><label>Text color<div className="color-input"><input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)}/><code>{textColor}</code></div></label><label>Base text size <div className="font-size-controls"><input aria-label="Base text size slider" type="range" min="18" max="96" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))}/><input aria-label="Exact base text size in pixels" type="number" min="18" max="96" value={fontSize} onChange={e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))setFontSize(Number(e.target.value));}} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n))setFontSize(Math.max(18,Math.min(96,n)));}}/><span>px</span></div></label><div className="font-library-control"><div className="font-library-heading"><span>Premium font library</span><small>Google Fonts · {FONT_LIBRARY.length} families</small></div><input className="font-search" type="search" aria-label="Search font library" value={fontSearch} onChange={e=>setFontSearch(e.target.value)} placeholder="Search fonts… e.g. Montserrat"/><div className="font-category-row">{FONT_CATEGORIES.map(category=><button type="button" key={category} className={fontCategory===category?'active':''} onClick={()=>setFontCategory(category)}>{category}</button>)}</div><div className="font-card-grid">{filteredFonts.map(item=><button type="button" key={item.family} className={'font-card'+(font===item.family?' selected':'')} onClick={()=>setFont(item.family)} aria-pressed={font===item.family}><span className="font-card-top"><b>{item.family}</b>{font===item.family&&<Check size={13}/>}</span><span className="font-card-sample" style={{fontFamily:'"'+item.family+'", sans-serif'}}>Sing it loud</span><small>{item.description}</small></button>)}</div>{filteredFonts.length===0&&<div className="font-empty">No fonts match that search.</div>}<small className="font-library-note">Choose a base font here. Override a line or any individual word in the lyrics editor. Google Fonts need an internet connection.</small></div><label>Text position<select value={position} onChange={e=>setPosition(e.target.value)}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label><label>Orientation<select aria-label="Video orientation" value={orientation} onChange={e=>setOrientation(e.target.value)}><option value="landscape">Landscape 16:9</option><option value="portrait">Portrait 9:16</option><option value="square">Square 1:1</option></select></label><div className="style-group"><span className="group-title">Header overlay</span><input className="text-input" aria-label="Header text" value={headerText} onChange={e=>setHeaderText(e.target.value)} placeholder="Optional — shown at top" maxLength={80}/><div className="style-row"><label>Size<input type="number" aria-label="Header text size" min={10} max={96} value={headerSize} onChange={e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))setHeaderSize(Number(e.target.value));}} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n))setHeaderSize(Math.max(10,Math.min(96,n)));}} /></label><label>Font<select aria-label="Header font" value={headerFont} onChange={e=>setHeaderFont(e.target.value)}><option value="">Video font</option>{FONT_LIBRARY.map(item=><option key={item.family} value={item.family}>{item.family}</option>)}</select></label><label>Color<div className="color-input"><input type="color" aria-label="Header color" value={headerColor||textColor} onChange={e=>setHeaderColor(e.target.value)}/><code>{headerColor||textColor}</code></div></label></div></div><div className="style-group"><span className="group-title">Footer overlay</span><input className="text-input" aria-label="Footer text" value={footerText} onChange={e=>setFooterText(e.target.value)} placeholder="Optional — shown at bottom" maxLength={80}/><div className="style-row"><label>Size<input type="number" aria-label="Footer text size" min={10} max={96} value={footerSize} onChange={e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))setFooterSize(Number(e.target.value));}} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n))setFooterSize(Math.max(10,Math.min(96,n)));}} /></label><label>Font<select aria-label="Footer font" value={footerFont} onChange={e=>setFooterFont(e.target.value)}><option value="">Video font</option>{FONT_LIBRARY.map(item=><option key={item.family} value={item.family}>{item.family}</option>)}</select></label><label>Color<div className="color-input"><input type="color" aria-label="Footer color" value={footerColor||'#ffffff'} onChange={e=>setFooterColor(e.target.value)}/><code>{footerColor||'#ffffff'}</code></div></label></div></div><label>Watermark text<input className="text-input" value={watermarkText} onChange={e=>setWatermarkText(e.target.value)} placeholder="LYRIC STUDIO — empty hides it" maxLength={40}/></label></div><div className="form-footer"><button className="btn ghost" onClick={()=>setTab('sync')}><Clock3 size={16}/> Adjust timing</button><button className="btn primary" onClick={()=>setTab('export')}><Film size={16}/> Continue to export</button></div></div>}
      {tab==='export'&&<div className="panel export-panel"><div className="export-icon"><Film size={32}/></div><h3>Render your lyric video</h3><p>Record the live canvas preview together with your uploaded audio. This runs locally in your browser — no server or API key.</p><div className="export-summary"><div><span>Audio</span><b>{audioUrl?audioName:'Not uploaded'}</b></div><div><span>Lyrics</span><b>{lines.length} lines</b></div><div><span>Duration</span><b>{fmt(duration)}</b></div><div><span>Output</span><b>WebM · {dims.w}×{dims.h} · 30 FPS</b></div></div><div className="notice"><WandSparkles size={17}/><span>Export records in real time, so a 3-minute song takes about 3 minutes to export. Keep this tab open until it finishes. Browser support varies.</span></div>{exportMsg&&<div className="status-msg">{exportMsg}</div>}<div className="form-footer"><button className="btn ghost" onClick={()=>setTab('preview')}>Back to style</button><button className="btn primary" disabled={exporting||!audioUrl} onClick={exportVideo}><Download size={16}/>{exporting?'Recording…':'Start export'}</button></div></div>}
    </section>
    <aside className="rightbar"><div className="panel preview-card"><div className="panel-title"><Film size={17}/><h3>Video preview</h3></div><div className="mini-preview" style={{aspectRatio:`${miniDims.w} / ${miniDims.h}`}}><canvas ref={miniCanvasRef} width={miniDims.w} height={miniDims.h}/><div className="mini-overlay" style={{display:'none'}}/></div><div className="mini-controls"><button className="icon-btn" onClick={()=>{if(audioRef.current?.paused)audioRef.current.play();else audioRef.current?.pause();}}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><div className="mini-progress"><div style={{width:`${duration?time/duration*100:0}%`}}/></div><span>{fmt(time)}</span></div></div><div className="panel quick-settings"><div className="panel-title"><Type size={17}/><h3>Quick settings</h3></div><label>Highlight style<select value={mode} onChange={e=>setMode(e.target.value)}><option value="line">Line by line</option><option value="word">Word by word</option><option value="static">Static text</option></select></label><div className="animation-timing-controls"><div className="animation-timing-control"><label htmlFor="line-animation-percent">Line highlight timing <b>{lineAnimationPercent}%</b></label><input id="line-animation-percent" aria-label="Line highlight timing percentage" type="range" min="25" max="100" step="5" value={lineAnimationPercent} onChange={e=>setLineAnimationPercent(Number(e.target.value))}/><small>Complete the line highlight over this portion of its duration.</small></div><div className="animation-timing-control"><label htmlFor="word-animation-percent">Word highlight timing <b>{wordAnimationPercent}%</b></label><input id="word-animation-percent" aria-label="Word highlight timing percentage" type="range" min="25" max="100" step="5" value={wordAnimationPercent} onChange={e=>setWordAnimationPercent(Number(e.target.value))}/><small>Complete the word sequence over this portion of its duration.</small></div>{mode==='static'&&<p className="animation-static-note">Static mode disables highlighting and animated transitions; it shows only the current timed line.</p>}</div><div className="animation-engine-controls"><div className="animation-engine-heading"><WandSparkles size={15}/><b>Text animation</b></div><label>Default entrance<select value={lineEntrance} onChange={e=>setLineEntrance(e.target.value)}><option value="none">None</option><option value="fade">Fade in</option><option value="slide-up">Slide up</option><option value="slide-left">Slide from left</option><option value="pop">Pop & bounce</option><option value="typewriter">Typewriter reveal</option></select></label><label>Default exit<select value={lineExit} onChange={e=>setLineExit(e.target.value)}><option value="none">None</option><option value="fade">Fade out</option><option value="slide-down">Slide down</option><option value="slide-right">Slide away right</option><option value="shrink">Shrink away</option></select></label><label>Active word effect<select value={wordEffect} onChange={e=>setWordEffect(e.target.value)}><option value="none">None</option><option value="bounce">Bounce</option><option value="glow">Glow</option><option value="pulse">Pulse</option></select></label><div className="animation-timing-control"><label htmlFor="animation-duration">Transition duration <b>{animationDuration.toFixed(2)} s</b></label><input id="animation-duration" type="range" min="0.1" max="1" step="0.05" value={animationDuration} onChange={e=>setAnimationDuration(Number(e.target.value))}/><small>Line transitions are calculated from playback time, so seeking and export stay synchronized.</small></div><small className="animation-static-note">Per-line entrance and exit overrides are available in the lyric editor. Static mode intentionally ignores these animations.</small></div><label>Text position<select value={position} onChange={e=>setPosition(e.target.value)}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label><label>Text case<select aria-label="Text case" value={caseMode} onChange={e=>setCaseMode(e.target.value)}><option value="original">Original</option><option value="lower">lowercase</option><option value="upper">UPPERCASE</option></select></label><button className="btn ghost full" onClick={()=>setTab('preview')}><WandSparkles size={15}/> Customize appearance</button></div><div className="panel tips"><div className="panel-title"><CircleHelp size={17}/><h3>How it works</h3></div><ul><li>Upload your MP3 and paste lyrics.</li><li>One lyric line per row works best.</li><li>Play audio and mark each line's start.</li><li>Preview styling, then export a video.</li></ul><div className="tip-foot"><Check size={14}/> Your files stay in this browser</div></div></aside>
    </main><footer>LYRIC STUDIO <span>•</span> Manual sync editor <span>•</span> No external APIs</footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
