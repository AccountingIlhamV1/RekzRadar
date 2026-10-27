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
    var li=el("li");li.appendChild(el("span",null,n));li.appendChild(el("span","dot","Belum terhubung"));s.appendChild(li);
  });
}

statis();tampilkan(buatData());
$("segarkan").addEventListener("click",function(){tampilkan(buatData())});
})();
