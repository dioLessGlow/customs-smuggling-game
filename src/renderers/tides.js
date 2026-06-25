// ════════════════════════════════════════
// 潮汐海洋背景 (直接移植自 tides_24h_fixed.html)
// ════════════════════════════════════════
var TidesBg = (function () {
  var canvas, ctx, W, H, horizonY, oceanH;
  var T = 0, timeOfDay = 0;

  /* ── 调色板关键帧 ── */
  var KEYS = [
    { t:0.0,  name:"子夜", skyTop:[4,6,18], skyHor:[12,16,36], sun:[255,248,220], glow:[120,110,80], wFar:[18,24,48], wNear:[4,8,18], foam:[200,195,170], sunH:0.55, glit:0.4, star:1.0 },
    { t:0.15, name:"拂晓前", skyTop:[12,16,38], skyHor:[28,36,68], sun:[255,250,225], glow:[140,130,90], wFar:[28,36,68], wNear:[8,14,28], foam:[210,205,180], sunH:0.35, glit:0.5, star:0.85 },
    { t:0.21, name:"黎明", skyTop:[38,44,86], skyHor:[247,176,128], sun:[255,238,206], glow:[255,178,120], wFar:[176,150,150], wNear:[34,62,84], foam:[255,244,234], sunH:0.1, glit:0.7, star:0 },
    { t:0.29, name:"清晨", skyTop:[64,134,206], skyHor:[188,222,236], sun:[255,255,246], glow:[255,250,224], wFar:[120,186,196], wNear:[20,92,114], foam:[255,255,255], sunH:0.55, glit:0.5, star:0 },
    { t:0.5,  name:"正午", skyTop:[58,142,214], skyHor:[176,216,230], sun:[255,255,248], glow:[255,252,232], wFar:[96,178,188], wNear:[16,96,120], foam:[255,255,255], sunH:0.92, glit:0.45, star:0 },
    { t:0.68, name:"金色时光", skyTop:[74,92,156], skyHor:[255,202,120], sun:[255,236,194], glow:[255,168,92], wFar:[206,164,118], wNear:[34,78,98], foam:[255,244,228], sunH:0.3, glit:0.95, star:0 },
    { t:0.79, name:"日落", skyTop:[48,38,86], skyHor:[255,108,68], sun:[255,206,148], glow:[255,92,58], wFar:[188,98,84], wNear:[30,42,72], foam:[255,222,200], sunH:0.06, glit:1.0, star:0.15 },
    { t:0.88, name:"暮光", skyTop:[22,24,56], skyHor:[58,64,108], sun:[255,245,210], glow:[130,120,80], wFar:[48,56,92], wNear:[14,20,42], foam:[200,195,170], sunH:0.15, glit:0.6, star:0.6 },
    { t:1.0,  name:"子夜", skyTop:[4,6,18], skyHor:[12,16,36], sun:[255,248,220], glow:[120,110,80], wFar:[18,24,48], wNear:[4,8,18], foam:[200,195,170], sunH:0.55, glit:0.4, star:1.0 }
  ];

  function lerp(a,b,t){return a+(b-a)*t}
  function lerpRGB(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]}
  function rgb(c,a){return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+(a||1)+')'}

  function getPalette(t){
    var i=0; while(i<KEYS.length-1&&t>KEYS[i+1].t)i++;
    var a=KEYS[i],b=KEYS[Math.min(i+1,KEYS.length-1)];
    var span=b.t-a.t||1;
    var k=Math.max(0,Math.min(1,(t-a.t)/span));
    return {
      name:k<0.5?a.name:b.name,
      skyTop:lerpRGB(a.skyTop,b.skyTop,k), skyHor:lerpRGB(a.skyHor,b.skyHor,k),
      sun:lerpRGB(a.sun,b.sun,k), glow:lerpRGB(a.glow,b.glow,k),
      wFar:lerpRGB(a.wFar,b.wFar,k), wNear:lerpRGB(a.wNear,b.wNear,k),
      foam:lerpRGB(a.foam,b.foam,k),
      sunH:lerp(a.sunH,b.sunH,k), glit:lerp(a.glit,b.glit,k), star:lerp(a.star,b.star,k)
    };
  }

  /* ── 静态元素 ── */
  var stars = Array.from({length:140},function(){return{x:Math.random(),y:Math.random()*0.4,r:Math.random()*1.2+0.3,tw:Math.random()*Math.PI*2}});

  var clouds = Array.from({length:5},function(_,i){return{x:Math.random(),y:0.08+Math.random()*0.18,w:0.18+Math.random()*0.22,speed:0.000015+Math.random()*0.00002}});

  var birds = Array.from({length:4},function(){return{x:Math.random(),y:0.15+Math.random()*0.18,speed:0.00004+Math.random()*0.00004,size:8+Math.random()*6,flap:Math.random()*Math.PI*2}});

  /* ── 弯月绘制 ── */
  var moonCanvas = document.createElement('canvas');
  var moonCacheSize=0,moonCacheR=0,moonCacheColor=null;

  function drawCrescent(cx,cy,r,color){
    var size=Math.ceil(r*2.6);
    var colorKey=(color[0]|0)+','+(color[1]|0)+','+(color[2]|0);
    if(size!==moonCacheSize||r!==moonCacheR||colorKey!==moonCacheColor){
      moonCacheSize=size;moonCacheR=r;moonCacheColor=colorKey;
      moonCanvas.width=size;moonCanvas.height=size;
      var tctx=moonCanvas.getContext('2d');
      var tx=size/2,ty=size/2;
      var cutW=r*1.05,cutOffset=r*0.25;
      var mg=tctx.createRadialGradient(tx+r*0.15,ty-r*0.1,0,tx,ty,r);
      mg.addColorStop(0,'rgba(255,255,245,1)');
      mg.addColorStop(0.5,'rgba('+colorKey+',1)');
      mg.addColorStop(0.8,'rgba('+colorKey+',1)');
      mg.addColorStop(1,'rgba('+colorKey+',1)');
      tctx.fillStyle=mg;tctx.beginPath();tctx.arc(tx,ty,r,0,Math.PI*2);tctx.fill();
      tctx.globalCompositeOperation='destination-out';
      tctx.fillStyle='rgba(0,0,0,1)';
      tctx.beginPath();tctx.arc(tx+cutOffset,ty,cutW,0,Math.PI*2);tctx.fill();
      tctx.globalCompositeOperation='source-over';
    }
    ctx.drawImage(moonCanvas,cx-moonCacheSize/2,cy-moonCacheSize/2);
  }

  function init(w,h,dpr){
    dpr=dpr||1;
    canvas=document.createElement('canvas');
    ctx=canvas.getContext('2d');
    W=w; H=h;
    canvas.width=w*dpr;
    canvas.height=h*dpr;
    canvas.style.width=w+'px';
    canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    horizonY=H*0.42;
    oceanH=H-horizonY;
    syncTime();
    setInterval(syncTime,1000);
  }

  function syncTime(){
    var now=new Date();
    timeOfDay=(now.getHours()+now.getMinutes()/60+now.getSeconds()/3600)/24;
  }

  function update(){
    T+=0.016;
    var P=getPalette(timeOfDay);
    var isNight=P.star>0.3;
    var lightX=W*0.78;
    var lightY=horizonY-P.sunH*horizonY*0.82;

    /* ── 天空 ── */
    var sky=ctx.createLinearGradient(0,0,0,horizonY+oceanH*0.1);
    sky.addColorStop(0,rgb(P.skyTop));
    sky.addColorStop(0.7,rgb(lerpRGB(P.skyTop,P.skyHor,0.55)));
    sky.addColorStop(1,rgb(P.skyHor));
    ctx.fillStyle=sky;
    ctx.fillRect(0,0,W,horizonY+2);

    /* ── 星星 ── */
    if(P.star>0.01){
      stars.forEach(function(s){
        var tw=0.5+0.5*Math.sin(T*2+s.tw);
        ctx.fillStyle=rgb([255,255,255],P.star*tw*0.9);
        ctx.beginPath();ctx.arc(s.x*W,s.y*horizonY,s.r,0,Math.PI*2);ctx.fill();
      });
    }

    /* ── 光源光晕 ── */
    var glowR=Math.min(W,H)*0.5;
    var g=ctx.createRadialGradient(lightX,lightY,0,lightX,lightY,glowR);
    if(isNight){
      g.addColorStop(0,rgb(P.glow,0.18));
      g.addColorStop(0.3,rgb(P.glow,0.06));
    }else{
      g.addColorStop(0,rgb(P.glow,0.55));
      g.addColorStop(0.25,rgb(P.glow,0.22));
    }
    g.addColorStop(1,rgb(P.glow,0));
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,horizonY+oceanH*0.4);

    /* ── 太阳/月亮 ── */
    var bodyR=Math.min(W,H)*0.045;
    if(isNight){
      drawCrescent(lightX,lightY,bodyR,P.sun);
    }else{
      var sd=ctx.createRadialGradient(lightX,lightY,0,lightX,lightY,bodyR);
      sd.addColorStop(0,rgb(P.sun,1));
      sd.addColorStop(0.7,rgb(P.sun,0.95));
      sd.addColorStop(1,rgb(P.sun,0.2));
      ctx.fillStyle=sd;
      ctx.beginPath();ctx.arc(lightX,lightY,bodyR,0,Math.PI*2);ctx.fill();
    }

    /* ── 云朵 ── */
    clouds.forEach(function(c){
      c.x+=c.speed;
      if(c.x>1.3)c.x=-0.3;
      var cx=c.x*W,cy=c.y*horizonY,cw=c.w*W;
      ctx.fillStyle=rgb(lerpRGB(P.skyHor,[255,255,255],0.25),0.16);
      for(var j=0;j<4;j++){
        ctx.beginPath();
        ctx.ellipse(cx+j*cw*0.22,cy+Math.sin(j)*6,cw*(0.3-j*0.04),cw*0.06,0,0,Math.PI*2);
        ctx.fill();
      }
    });

    /* ── 飞鸟 ── */
    birds.forEach(function(b){
      b.x+=b.speed;b.flap+=0.15;
      if(b.x>1.2){b.x=-0.2;b.y=0.15+Math.random()*0.18}
      var bx=b.x*W,by=b.y*horizonY;
      var wing=Math.sin(b.flap)*b.size*0.5;
      ctx.strokeStyle=rgb(lerpRGB(P.skyTop,[0,0,0],0.3),0.5);
      ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(bx-b.size,by+wing);
      ctx.quadraticCurveTo(bx,by-b.size*0.3,bx,by);
      ctx.quadraticCurveTo(bx,by-b.size*0.3,bx+b.size,by+wing);
      ctx.stroke();
    });

    /* ── 地平线雾效 ── */
    var haze=ctx.createLinearGradient(0,horizonY-40,0,horizonY+40);
    haze.addColorStop(0,rgb(P.skyHor,0));
    haze.addColorStop(0.5,rgb(P.skyHor,0.45));
    haze.addColorStop(1,rgb(P.wFar,0));
    ctx.fillStyle=haze;
    ctx.fillRect(0,horizonY-40,W,80);

    /* ── 海浪层 ── */
    var NUM=26;
    for(var i=0;i<NUM;i++){
      var depth=i/(NUM-1);
      var yTop=horizonY+Math.pow(depth,1.9)*oceanH;
      var amp=lerp(0.6,30,depth);
      var wlen=lerp(46,340,depth);
      var speed=lerp(0.25,0.9,depth);
      var phase=T*speed+i*0.9;
      var col=lerpRGB(P.wFar,P.wNear,depth);

      ctx.beginPath();
      ctx.moveTo(0,H);
      ctx.lineTo(0,yTop+Math.sin(phase)*amp);
      for(var x=0;x<=W;x+=6){
        var y=yTop+Math.sin(x/wlen+phase)*amp+Math.sin(x/(wlen*0.4)+phase*1.6)*amp*0.3;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);
      ctx.closePath();
      ctx.fillStyle=rgb(col);
      ctx.fill();

      ctx.lineWidth=lerp(0.6,2.2,depth);
      ctx.beginPath();
      var started=false;
      for(var x=0;x<=W;x+=6){
        var y=yTop+Math.sin(x/wlen+phase)*amp+Math.sin(x/(wlen*0.4)+phase*1.6)*amp*0.3;
        started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);
      }
      ctx.strokeStyle=rgb(lerpRGB(col,P.sun,0.55),lerp(0.05,0.3,depth));
      ctx.stroke();

      if(depth>0.62){
        var foamA=(depth-0.62)/0.38;
        for(var x=0;x<=W;x+=9){
          var y=yTop+Math.sin(x/wlen+phase)*amp+Math.sin(x/(wlen*0.4)+phase*1.6)*amp*0.3;
          var crest=Math.sin(x/wlen+phase);
          if(crest>0.55&&Math.random()>0.45){
            ctx.fillStyle=rgb(P.foam,foamA*(0.18+Math.random()*0.35));
            ctx.fillRect(x+(Math.random()-0.5)*6,y-Math.random()*3,1.5+Math.random()*3,1.5+Math.random()*2);
          }
        }
      }
    }

    /* ── 水面闪烁 ── */
    var glitterCount=220;
    for(var i=0;i<glitterCount;i++){
      var dy=Math.random();
      var y=horizonY+Math.pow(dy,1.5)*oceanH;
      var spread=lerp(6,W*0.3,dy);
      var x=lightX+(Math.random()-0.5)*2*spread;
      var distFade=1-Math.min(1,Math.abs(x-lightX)/(spread+1));
      var flick=0.25+Math.random()*0.75;
      var a=distFade*distFade*flick*P.glit*(1-dy*0.25);
      if(a<0.02)continue;
      ctx.fillStyle=rgb(P.sun,a*0.85);
      var len=1+Math.random()*(2+dy*4);
      ctx.fillRect(x,y,len,1+dy);
    }

    /* ── UI：时段名称与时间 ── */
    var hours = timeOfDay * 24;
    var hh = Math.floor(hours) % 24;
    var mm = Math.floor((hours % 1) * 60);
    var timeStr = ('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2);
    // 文字阴影
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(P.name, W - 14, 12);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Noto Serif SC","Songti SC","SimSun",serif';
    ctx.fillText(timeStr, W - 14, 28);
    ctx.shadowBlur = 0;

    /* ── 暗角 ── */
    var vig=ctx.createRadialGradient(W/2,H*0.55,H*0.25,W/2,H*0.55,H*0.9);
    vig.addColorStop(0,'rgba(0,0,0,0)');
    vig.addColorStop(1,'rgba(0,0,8,0.34)');
    ctx.fillStyle=vig;
    ctx.fillRect(0,0,W,H);
  }

  function getCanvas(){return canvas}
  return {init:init,update:update,getCanvas:getCanvas,buildLayers:function(){}};
})();
