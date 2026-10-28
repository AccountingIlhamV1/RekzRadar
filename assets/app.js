(function(){
"use strict";
function $(id){return document.getElementById(id)}
function fmt(n,d){return n.toFixed(d).replace(".",",")}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function pct(x){if(x==null||isNaN(x))return ["—",""];return [(x>=0?"+":"")+fmt(x,2)+"%",x>=0?"up":"dn"]}
function logRet(a){var r=[],i;for(i=1;i<a.length;i++){if(a[i]>0&&a[i-1]>0)r.push(Math.log(a[i]/a[i-1]))}return r}
function sd(r){var m=r.reduce(function(a,b){return a+b},0)/r.length;return Math.sqrt(r.reduce(function(a,b){return a+(b-m)*(b-m)},0)/(r.length-1))}
function corr(a,b){
  var n=Math.min(a.length,b.length);if(n<10)return null;
  a=a.slice(a.length-n);b=b.slice(b.length-n);
  var ma=a.reduce(function(x,y){return x+y},0)/n,mb=b.reduce(function(x,y){return x+y},0)/n,sab=0,saa=0,sbb=0,i;
  for(i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);saa+=(a[i]-ma)*(a[i]-ma);sbb+=(b[i]-mb)*(b[i]-mb)}
  return saa&&sbb?sab/Math.sqrt(saa*sbb):null;
}
function parseJson(tx){try{return JSON.parse(tx)}catch(e){throw new Error("respons sumber tidak valid")}}
function stamp(){$("waktu").textContent=new Date().toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"medium"})+" (jam perangkat, saat data terakhir dimuat)"}

function pilih(tr,fn){
  tr.className="klik";tr.tabIndex=0;tr.addEventListener("click",fn);
  tr.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();fn()}});
}
function grafik(s,mn,mx,up,o){
  var NS="http://www.w3.org/2000/svg",W=600,H=220,pl=8,pr=8,pt=18,pb=26,r=(mx-mn)||1;
  var sv=document.createElementNS(NS,"svg");
  sv.setAttribute("viewBox","0 0 "+W+" "+H);sv.setAttribute("class","chart");sv.setAttribute("role","img");sv.setAttribute("aria-label","Grafik "+o.judul);
  function X(i){return pl+i/(s.length-1)*(W-pl-pr)}
  function Y(v){return pt+(1-(v-mn)/r)*(H-pt-pb)}
  var pts=s.map(function(v,i){return X(i).toFixed(1)+","+Y(v).toFixed(1)}).join(" "),col=up?"#4fc3d9":"#f08a4b";
  var ar=document.createElementNS(NS,"polygon");
  ar.setAttribute("points",pts+" "+X(s.length-1).toFixed(1)+","+(H-pb)+" "+X(0).toFixed(1)+","+(H-pb));
  ar.setAttribute("fill",col);ar.setAttribute("opacity",".15");sv.appendChild(ar);
  var ln=document.createElementNS(NS,"polyline");
  ln.setAttribute("points",pts);ln.setAttribute("fill","none");ln.setAttribute("stroke",col);ln.setAttribute("stroke-width","2");ln.setAttribute("stroke-linejoin","round");sv.appendChild(ln);
  function T(x,y,txt,an){var t=document.createElementNS(NS,"text");t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor",an);t.setAttribute("fill","#8da3b3");t.setAttribute("font-size","12");t.textContent=txt;sv.appendChild(t)}
  T(pl,12,"Tertinggi "+o.f(mx),"start");
  T(W-pr,H-pb-6,"Terendah "+o.f(mn),"end");
  T(pl,H-8,o.awal,"start");T(W-pr,H-8,o.akhir,"end");
  return sv;
}
function detail(o){
  var box=$("detail-box");box.textContent="";
  var s=o.s;
  if(!s||s.length<5){$("detail-judul").textContent="Data tidak cukup untuk menampilkan grafik.";return}
  $("detail-judul").textContent=o.judul;
  var mn=Math.min.apply(null,s),mx=Math.max.apply(null,s),L=s[s.length-1],ch=(L/s[0]-1)*100;
  box.appendChild(grafik(s,mn,mx,ch>=0,o));
  var ul=el("ul","src");
  [["Terakhir",o.f(L)],["Tertinggi",o.f(mx)],["Terendah",o.f(mn)],["Perubahan periode",pct(ch)[0]],["Volatilitas/hari",o.vol==null?"—":fmt(o.vol,2)+"%"]].forEach(function(p){
    var li=el("li");li.appendChild(el("span",null,p[0]));li.appendChild(el("span",null,p[1]));ul.appendChild(li);
  });
  box.appendChild(ul);
  $("detail").scrollIntoView({behavior:"smooth",block:"start"});
}
function detailKr(c){detail({judul:c.name+" ("+c.sym+") · 7 hari terakhir, per jam (USD)",s:c.sp,f:function(v){return v.toLocaleString("id-ID",{maximumFractionDigits:v<1?6:2})},awal:"7 hari lalu",akhir:"sekarang",vol:c.vh})}
function detailFx(x){var a=x.ds[0],b=x.ds[x.ds.length-1];detail({judul:"USD/"+x.c+" · "+a+" s/d "+b+", harian",s:x.s,f:function(v){return v.toLocaleString("id-ID",{maximumFractionDigits:v>100?2:4})},awal:a,akhir:b,vol:x.vol})}

function buatSumber(o){
  var s={busy:false,last:0,data:null,dot:null};
  s.sisa=function(){return s.last?Math.ceil((o.cool-(Date.now()-s.last))/1000):0};
  s.muat=function(){
    var st=$(o.st),btn=$(o.btn);
    if(s.busy)return;
    if(s.sisa()>0){st.textContent="Tunggu "+s.sisa()+" detik sebelum memuat ulang.";return}
    s.busy=true;btn.disabled=true;st.textContent="Memuat…";if(s.dot)s.dot.textContent="Memuat…";
    var ctl=new AbortController(),to=setTimeout(function(){ctl.abort()},o.timeout);
    fetch(o.url(),{signal:ctl.signal}).then(function(r){
      if(r.status===429)throw new Error("batas pemakaian tercapai (HTTP 429)");
      if(!r.ok)throw new Error("HTTP "+r.status);
      return r.text();
    }).then(function(tx){
      var d=o.parse(tx);s.data=d;s.last=Date.now();o.show(d);
      st.textContent=o.ok(d);
      if(s.dot){s.dot.textContent="Terhubung";s.dot.className="dot up"}
      stamp();
      try{turunan()}catch(e){}
    }).catch(function(e){
      s.last=Date.now();
      var m=e.name==="AbortError"?"waktu habis":e.message;
      st.textContent="Gagal memuat "+o.nama+": "+m+"."+(s.data?" Tampilan di bawah adalah data terakhir yang berhasil dimuat.":" Tidak ada data untuk ditampilkan.");
      if(s.dot){s.dot.textContent="Gagal";s.dot.className="dot dn"}
    }).then(function(){clearTimeout(to);s.busy=false;btn.disabled=false});
  };
  return s;
}

/* KRIPTO */
var KR=buatSumber({nama:"data kripto",st:"kripto-status",btn:"muat-kripto",cool:60000,timeout:12000,
  url:function(){return "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,tron&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d"},
  parse:function(tx){
    var rows=parseJson(tx);if(!Array.isArray(rows)||!rows.length)throw new Error("data kosong");
    return rows.filter(function(c){return c.current_price>0}).map(function(c){
      var sp=(c.sparkline_in_7d&&c.sparkline_in_7d.price)||[],r=logRet(sp);
      return {name:c.name,sym:String(c.symbol).toUpperCase(),p:c.current_price,d24:c.price_change_percentage_24h_in_currency,d7:c.price_change_percentage_7d_in_currency,sp:sp,vh:r.length>=10?sd(r)*Math.sqrt(24)*100:null,r:r,t:c.last_updated};
    });
  },
  show:function(rows){
    var t=$("kripto-tbl");t.textContent="";
    var hr=el("tr");["Aset","Harga (USD)","24 jam","7 hari","Volatilitas/hari"].forEach(function(x){hr.appendChild(el("th",null,x))});t.appendChild(hr);
    rows.forEach(function(c){
      var tr=el("tr"),a=pct(c.d24),b=pct(c.d7);pilih(tr,function(){detailKr(c)});
      tr.appendChild(el("td",null,c.name+" ("+c.sym+")"));
      tr.appendChild(el("td",null,c.p.toLocaleString("id-ID",{maximumFractionDigits:c.p<1?6:2})));
      tr.appendChild(el("td",a[1],a[0]));tr.appendChild(el("td",b[1],b[0]));
      tr.appendChild(el("td",null,c.vh==null?"—":fmt(c.vh,2)+"%"));
      t.appendChild(tr);
    });
  },
  ok:function(rows){var tm=rows.map(function(c){return c.t}).sort().pop();return "Data CoinGecko per "+new Date(tm).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"medium"})}
});

/* FOREX */
var FXS="IDR,EUR,GBP,JPY,CHF,AUD,SGD,CNY";
var FX=buatSumber({nama:"data forex",st:"forex-status",btn:"muat-forex",cool:60000,timeout:12000,
  url:function(){var d=new Date(Date.now()-40*864e5).toISOString().slice(0,10);return "https://api.frankfurter.dev/v1/"+d+"..?base=USD&symbols="+FXS},
  parse:function(tx){
    var js=parseJson(tx);if(!js||!js.rates)throw new Error("format data tidak dikenali");
    var tg=Object.keys(js.rates).sort();if(tg.length<5)throw new Error("data terlalu sedikit");
    var rows=FXS.split(",").map(function(c){
      var s=tg.map(function(d){return js.rates[d]&&js.rates[d][c]}).filter(function(x){return x>0});
      if(s.length<5)return null;
      var L=s[s.length-1];
      var ds=tg.filter(function(d){return js.rates[d]&&js.rates[d][c]>0});return {c:c,s:s,ds:ds,last:L,d1:(L/s[s.length-2]-1)*100,mo:(L/s[0]-1)*100,vol:sd(logRet(s))*100};
    }).filter(Boolean);
    if(!rows.length)throw new Error("tidak ada pasangan valid");
    return {rows:rows,tgl:tg[tg.length-1],awal:tg[0]};
  },
  show:function(o){
    var t=$("forex-tbl");t.textContent="";
    var hr=el("tr");["Pasangan","Kurs","1 hari","Sebulan","Volatilitas/hari"].forEach(function(x){hr.appendChild(el("th",null,x))});t.appendChild(hr);
    o.rows.forEach(function(x){
      var tr=el("tr"),a=pct(x.d1),b=pct(x.mo);pilih(tr,function(){detailFx(x)});
      tr.appendChild(el("td",null,"USD/"+x.c));
      tr.appendChild(el("td",null,x.last.toLocaleString("id-ID",{maximumFractionDigits:x.last>100?2:4})));
      tr.appendChild(el("td",a[1],a[0]));tr.appendChild(el("td",b[1],b[0]));
      tr.appendChild(el("td",null,fmt(x.vol,2)+"%"));
      t.appendChild(tr);
    });
  },
  ok:function(o){return "Kurs per tanggal "+o.tgl+" (data sejak "+o.awal+")"}
});

/* BERITA */
var nwLang="en";
var NWQ={en:'("central bank" OR inflation OR "interest rate" OR "stock market" OR bitcoin OR gold OR "oil price") sourcelang:english',
 id:'(inflasi OR "suku bunga" OR "bank sentral" OR IHSG OR rupiah OR emas OR "harga minyak" OR bitcoin) sourcelang:indonesian'};
function tglGdelt(s){var m=/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s||"");return m?new Date(Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6])):null}
var NW=buatSumber({nama:"berita",st:"berita-status",btn:"muat-berita",cool:10000,timeout:15000,
  url:function(){return "https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(NWQ[nwLang])+"&mode=ArtList&format=json&maxrecords=40&sort=datedesc&timespan=24h"},
  parse:function(tx){
    var js=parseJson(tx);if(!js||!Array.isArray(js.articles))throw new Error("tidak ada berita yang cocok");
    var seen={},out=[];
    js.articles.forEach(function(a){
      var t=String(a.title||"").trim(),u=String(a.url||"");
      if(!t||!/^https?:\/\//i.test(u))return;
      var k=t.toLowerCase().slice(0,80);if(seen[k])return;seen[k]=1;
      out.push({t:t.slice(0,200),u:u,dom:String(a.domain||"").slice(0,60),d:tglGdelt(a.seendate)});
    });
    if(!out.length)throw new Error("tidak ada berita yang cocok");
    return out.slice(0,12);
  },
  show:function(rows){
    var ul=$("peristiwa-list");ul.textContent="";
    rows.forEach(function(r){
      var li=el("li");
      li.appendChild(el("div","d",(r.d?r.d.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"}):"waktu tidak diketahui")+" · "+r.dom));
      var a=el("a",null,r.t);a.href=r.u;a.target="_blank";a.rel="noopener noreferrer";
      var d=el("div");d.appendChild(a);li.appendChild(d);ul.appendChild(li);
    });
  },
  ok:function(){return "Berita 24 jam terakhir dari GDELT, dimuat pukul "+new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}
});

/* TURUNAN: semua dihitung dari data nyata di atas */
function kartu(g,nm,v,ch,cls){
  var c=el("div","card");c.appendChild(el("div","nm",nm));
  c.appendChild(el("div","v",v));c.appendChild(el("div","ch "+(cls||"muted"),ch));g.appendChild(c);
}
function turunan(){
  var K=KR.data,F=FX.data&&FX.data.rows,i;
  var g=$("grid-aset");g.textContent="";
  var kn=null,fn=null;
  if(K){
    var up=K.filter(function(c){return c.d24>0}).length,avg=K.reduce(function(a,c){return a+(c.d24||0)},0)/K.length;
    kn=up>=Math.ceil(K.length*.75)?"Condong naik":up<=Math.floor(K.length*.25)?"Condong turun":"Campuran";
    kartu(g,"Kripto ("+K.length+" koin)",up+" dari "+K.length+" naik","Rata-rata 24 jam "+pct(avg)[0],avg>=0?"up":"dn");
  }else kartu(g,"Kripto","—","Menunggu data");
  if(F){
    var idr=F.filter(function(x){return x.c==="IDR"})[0],ud=F.filter(function(x){return x.d1>0}).length;
    fn=ud>=Math.ceil(F.length*.75)?"Cenderung menguat":ud<=Math.floor(F.length*.25)?"Cenderung melemah":"Campuran";
    if(idr)kartu(g,"Forex: USD/IDR",idr.last.toLocaleString("id-ID",{maximumFractionDigits:2}),"1 hari "+pct(idr.d1)[0],idr.d1>=0?"up":"dn");
    else kartu(g,"Forex","—","USD/IDR tidak tersedia");
  }else kartu(g,"Forex","—","Menunggu data");
  ["Saham & indeks","Emas & logam","Obligasi","Komoditas"].forEach(function(n){kartu(g,n,"—","Belum ada sumber data")});

  /* ringkasan */
  var vs=[];
  if(K)K.forEach(function(c){if(c.vh!=null)vs.push({n:c.name,v:c.vh})});
  if(F)F.forEach(function(x){vs.push({n:"USD/"+x.c,v:x.vol})});
  vs.sort(function(a,b){return b.v-a.v});
  $("mood-label").textContent=kn||"—";
  $("mood-naik").textContent=fn||"—";
  $("mood-vol").textContent=vs.length?vs[0].n+" ("+fmt(vs[0].v,2)+"%/hari)":"—";
  $("mood-teks").textContent="Dihitung dari data nyata di panel Kripto dan Forex. Saham, emas, obligasi, dan komoditas belum punya sumber data.";

  /* volatilitas */
  var v=$("vol");v.textContent="";
  var top=vs.slice(0,8),mx=top.length?top[0].v:1;
  top.forEach(function(x){
    var r=el("div","row");r.appendChild(el("span",null,x.n));
    var b=el("div","bar"),it=el("i");it.style.width=Math.max(3,x.v/mx*100).toFixed(0)+"%";b.appendChild(it);r.appendChild(b);
    r.appendChild(el("span","muted",fmt(x.v,2)+"%"));v.appendChild(r);
  });
  $("vol-status").textContent=vs.length?"8 teratas dari "+vs.length+" aset yang dipantau. Satuan: % per hari (kripto dari data per jam 7 hari, forex dari data harian ±1 bulan).":"Menunggu data.";

  /* pengamatan otomatis */
  var w=$("pantauan-list");w.textContent="";var n=0;
  function cek(nm,ch,vol,ket){
    if(ch==null||vol==null||!vol)return;
    var k=Math.abs(ch)/vol;
    if(k>2){n++;var li=el("li");li.appendChild(el("div",null,nm+": "+pct(ch)[0]+" dalam "+ket));li.appendChild(el("div","muted small","Sekitar "+fmt(k,1).replace(",0","")+"× volatilitas hariannya"));w.appendChild(li)}
  }
  if(K)K.forEach(function(c){cek(c.name,c.d24,c.vh,"24 jam")});
  if(F)F.forEach(function(x){cek("USD/"+x.c,x.d1,x.vol,"1 hari")});
  if(!n){var li=el("li");li.appendChild(el("div","muted",(K||F)?"Tidak ada pergerakan yang melewati aturan saat ini.":"Menunggu data."));w.appendChild(li)}

  /* korelasi kripto */
  var t=$("korelasi");t.textContent="";
  if(K&&K.length>2){
    var hr=el("tr");hr.appendChild(el("th"));K.forEach(function(c){hr.appendChild(el("th",null,c.sym))});t.appendChild(hr);
    K.forEach(function(a){
      var tr=el("tr");tr.appendChild(el("td","h",a.sym));
      K.forEach(function(b){
        var x=a===b?1:corr(a.r,b.r),td=el("td",null,x==null?"—":fmt(x,2));
        if(x!=null){var al=Math.abs(x)*.55+.1;td.style.background=x>=0?"rgba(79,195,217,"+al+")":"rgba(240,138,75,"+al+")"}
        tr.appendChild(td);
      });t.appendChild(tr);
    });
    $("kor-status").textContent="Korelasi return per jam selama 7 hari. Korelasi tidak berarti sebab-akibat. Antar-kelas aset (kripto, forex, dll.) belum bisa dihitung karena sumbernya belum seragam.";
  }else $("kor-status").textContent="Menunggu data kripto.";
}

/* SUMBER DATA */
var dots={};
["Data saham & indeks","Data kripto","Data emas & komoditas","Data forex","Data obligasi & makro","Berita ekonomi","Kalender ekonomi"].forEach(function(n){
  var li=el("li");li.appendChild(el("span",null,n));
  var d=el("span","dot",["Data kripto","Data forex","Berita ekonomi"].indexOf(n)>=0?"Memuat…":"Belum tersedia");
  li.appendChild(d);$("sumber-list").appendChild(li);dots[n]=d;
});
KR.dot=dots["Data kripto"];FX.dot=dots["Data forex"];NW.dot=dots["Berita ekonomi"];

$("muat-kripto").addEventListener("click",KR.muat);
$("muat-forex").addEventListener("click",FX.muat);
$("muat-berita").addEventListener("click",NW.muat);
$("bahasa-berita").addEventListener("click",function(){
  if(NW.busy)return;
  if(NW.sisa()>0){$("berita-status").textContent="Tunggu "+NW.sisa()+" detik sebelum mengganti bahasa.";return}
  nwLang=nwLang==="en"?"id":"en";NW.data=null;
  $("bahasa-berita").textContent="Bahasa: "+(nwLang==="en"?"English":"Indonesia");
  NW.muat();
});
turunan();KR.muat();FX.muat();NW.muat();
})();
