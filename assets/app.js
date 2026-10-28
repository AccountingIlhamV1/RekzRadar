(function(){
"use strict";
var ASET=[
 {id:"saham",nm:"Saham & indeks"},{id:"kripto",nm:"Kripto"},{id:"emas",nm:"Emas & logam"},
 {id:"forex",nm:"Forex"},{id:"obligasi",nm:"Obligasi"},{id:"komoditas",nm:"Komoditas"}
];
var PERISTIWA=[
 {t:"Contoh: rilis data inflasi bulanan",d:"Jadwal contoh",i:"Dampak: suku bunga, obligasi, forex"},
 {t:"Contoh: keputusan suku bunga bank sentral",d:"Jadwal contoh",i:"Dampak: semua kelas aset"},
 {t:"Contoh: laporan stok minyak mingguan",d:"Jadwal contoh",i:"Dampak: komoditas, inflasi"},
 {t:"Contoh: data tenaga kerja",d:"Jadwal contoh",i:"Dampak: saham, forex"}
];
var PANTAUAN=[
 {t:"Emas bergerak berlawanan dengan dolar",s:"Syarat contoh: korelasi < -0,5"},
 {t:"Volatilitas kripto melonjak",s:"Syarat contoh: volatilitas > ambang tinggi"},
 {t:"Imbal hasil obligasi naik tajam",s:"Syarat contoh: kenaikan harian besar"}
];
var SUMBER=["Data saham & indeks","Data kripto","Data emas & komoditas","Data forex","Data obligasi & makro","Kalender ekonomi & berita"];

var krDot,krBusy=false,krLast=0,krData=null;
function $(id){return document.getElementById(id)}
function rnd(a,b){return a+Math.random()*(b-a)}
function fmt(n,d){return n.toFixed(d).replace(".",",")}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}

function spark(arr,naik){
  var w=100,h=32,mn=Math.min.apply(null,arr),mx=Math.max.apply(null,arr),r=mx-mn||1;
  var p=arr.map(function(v,i){return (i/(arr.length-1)*w).toFixed(1)+","+(h-2-((v-mn)/r)*(h-4)).toFixed(1)}).join(" ");
  var s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox","0 0 "+w+" "+h);s.setAttribute("preserveAspectRatio","none");s.setAttribute("aria-hidden","true");
  var l=document.createElementNS("http://www.w3.org/2000/svg","polyline");
  l.setAttribute("points",p);l.setAttribute("fill","none");l.setAttribute("stroke-width","1.8");
  l.setAttribute("stroke",naik?"#4fc3d9":"#f08a4b");s.appendChild(l);return s;
}

function buatData(){
  return ASET.map(function(a){
    var v=100,seri=[];
    for(var i=0;i<24;i++){v+=rnd(-1.6,1.7);seri.push(v)}
    var ch=(seri[23]-seri[0])/seri[0]*100;
    return {id:a.id,nm:a.nm,nilai:seri[23],ch:ch,seri:seri,vol:rnd(8,70)};
  });
}

function levelVol(v){return v>=50?["Tinggi","hi"]:v>=28?["Sedang","md"]:["Rendah",""]}

function tampilkan(data){
  var now=new Date();
  $("waktu").textContent=now.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"medium"})+" (waktu perangkat)";

  var naik=data.filter(function(d){return d.ch>0}).length;
  var mx=data.slice().sort(function(a,b){return b.vol-a.vol})[0];
  var label=naik>=5?"Condong naik":naik<=1?"Condong turun":"Campuran";
  $("mood-label").textContent=label;
  $("mood-naik").textContent=naik+" dari "+data.length;
  $("mood-vol").textContent=mx.nm;
  $("mood-teks").textContent="Ringkasan ini dihitung dari angka simulasi acak, hanya untuk mencoba tampilan.";

  var g=$("grid-aset");g.textContent="";
  data.forEach(function(d){
    var c=el("div","card"),up=d.ch>=0;
    c.appendChild(el("div","nm",d.nm));
    c.appendChild(el("div","v",fmt(d.nilai,1)));
    c.appendChild(el("div","ch "+(up?"up":"dn"),(up?"▲ +":"▼ ")+fmt(d.ch,2)+"%"));
    c.appendChild(spark(d.seri,up));
    g.appendChild(c);
  });

  var v=$("vol");v.textContent="";
  data.forEach(function(d){
    var lv=levelVol(d.vol),r=el("div","row");
    r.appendChild(el("span",null,d.nm.split(" ")[0]));
    var b=el("div","bar"),i=el("i",lv[1]);i.style.width=d.vol.toFixed(0)+"%";b.appendChild(i);r.appendChild(b);
    r.appendChild(el("span","muted",lv[0]));v.appendChild(r);
  });

  var t=$("korelasi");t.textContent="";
  var hr=el("tr");hr.appendChild(el("th"));
  data.forEach(function(d){hr.appendChild(el("th",null,d.nm.split(" ")[0].slice(0,6)))});
  t.appendChild(hr);
  var m=data.map(function(){return []});
  for(var i=0;i<6;i++)for(var j=0;j<6;j++){
    m[i][j]=i===j?1:(j<i?m[j][i]:rnd(-.9,.9));
  }
  data.forEach(function(d,i){
    var tr=el("tr");tr.appendChild(el("td","h",d.nm.split(" ")[0]));
    m[i].forEach(function(x){
      var td=el("td",null,fmt(x,2)),a=Math.abs(x)*.55+.1;
      td.style.background=x>=0?"rgba(79,195,217,"+a+")":"rgba(240,138,75,"+a+")";
      tr.appendChild(td);
    });t.appendChild(tr);
  });
}

function statis(){
  var e=$("peristiwa-list");PERISTIWA.forEach(function(p){
    var li=el("li");li.appendChild(el("div","d",p.d));li.appendChild(el("div",null,p.t));li.appendChild(el("div","dampak",p.i));e.appendChild(li);
  });
  var w=$("pantauan-list");PANTAUAN.forEach(function(p){
    var li=el("li");li.appendChild(el("div",null,p.t));li.appendChild(el("div","muted small",p.s));w.appendChild(li);
  });
  var s=$("sumber-list");SUMBER.forEach(function(n){
    var li=el("li");li.appendChild(el("span",null,n));var dt=el("span","dot","Belum terhubung");if(n==="Data kripto"){krDot=dt}li.appendChild(dt);s.appendChild(li);
  });
}


var KR_URL="https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,tron&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d";
function volHarian(sp){
  if(!sp||sp.length<20)return null;var r=[],i;
  for(i=1;i<sp.length;i++){if(sp[i]>0&&sp[i-1]>0)r.push(Math.log(sp[i]/sp[i-1]))}
  if(r.length<10)return null;
  var m=r.reduce(function(a,b){return a+b},0)/r.length;
  var v=r.reduce(function(a,b){return a+(b-m)*(b-m)},0)/(r.length-1);
  return Math.sqrt(v)*Math.sqrt(24)*100;
}
function pct(x){if(x==null)return ["—",""];return [(x>=0?"+":"")+fmt(x,2)+"%",x>=0?"up":"dn"]}
function tabelKripto(rows){
  var t=$("kripto-tbl");t.textContent="";
  var hr=el("tr");["Aset","Harga (USD)","24 jam","7 hari","Volatilitas/hari"].forEach(function(x){hr.appendChild(el("th",null,x))});t.appendChild(hr);
  rows.forEach(function(c){
    var tr=el("tr"),a=pct(c.price_change_percentage_24h_in_currency),b=pct(c.price_change_percentage_7d_in_currency);
    var vh=volHarian(c.sparkline_in_7d&&c.sparkline_in_7d.price);
    tr.appendChild(el("td",null,c.name+" ("+String(c.symbol).toUpperCase()+")"));
    tr.appendChild(el("td",null,c.current_price.toLocaleString("id-ID",{maximumFractionDigits:c.current_price<1?6:2})));
    tr.appendChild(el("td",a[1],a[0]));tr.appendChild(el("td",b[1],b[0]));
    tr.appendChild(el("td",null,vh==null?"—":fmt(vh,2)+"%"));
    t.appendChild(tr);
  });
}
function muatKripto(){
  var st=$("kripto-status"),btn=$("muat-kripto");
  if(krBusy)return;
  var sisa=60000-(Date.now()-krLast);
  if(krLast&&sisa>0){st.textContent="Tunggu "+Math.ceil(sisa/1000)+" detik sebelum memuat ulang (menjaga batas gratis).";return}
  krBusy=true;btn.disabled=true;st.textContent="Memuat…";if(krDot)krDot.textContent="Memuat…";
  var ctl=new AbortController(),to=setTimeout(function(){ctl.abort()},12000);
  fetch(KR_URL,{signal:ctl.signal}).then(function(r){
    if(r.status===429)throw new Error("batas gratis tercapai (HTTP 429)");
    if(!r.ok)throw new Error("HTTP "+r.status);
    return r.json();
  }).then(function(rows){
    if(!Array.isArray(rows)||!rows.length)throw new Error("data kosong");
    krData=rows;krLast=Date.now();tabelKripto(rows);
    var tmax=rows.map(function(c){return c.last_updated}).sort().pop();
    st.textContent="Data CoinGecko per "+new Date(tmax).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"medium"});
    if(krDot){krDot.textContent="Terhubung";krDot.className="dot up"}
  }).catch(function(e){
    krLast=Date.now();
    var msg=e.name==="AbortError"?"waktu habis":e.message;
    st.textContent="Gagal memuat data kripto: "+msg+"."+(krData?" Tabel di bawah adalah data terakhir yang berhasil dimuat.":" Tidak ada data untuk ditampilkan.");
    if(krDot){krDot.textContent="Gagal";krDot.className="dot dn"}
  }).then(function(){clearTimeout(to);krBusy=false;btn.disabled=false});
}
statis();tampilkan(buatData());muatKripto();
$("muat-kripto").addEventListener("click",muatKripto);
$("segarkan").addEventListener("click",function(){tampilkan(buatData())});
})();
