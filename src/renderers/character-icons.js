// ════════════════════════════════════════
// 全身人物图标生成器 (Canvas 2D)
// 生成 6 个 60×80 的缉私英雄全身像
// ════════════════════════════════════════
var CHAR_ICONS = {};

(function(){
  var W=60,H=90;

  function drawPerson(color,drawExtra){
    var c=document.createElement('canvas');
    c.width=W;c.height=H;
    var cx=c.getContext('2d');
    cx.scale(0.8,0.8);

    /* 统一人体 */
    var skin='#f5d6b8',shirt=color||'#4a7a9a',pants='#2c3e50',belt='#1a1a2e',shoes='#333';

    /* 腿 */
    cx.strokeStyle=pants;cx.lineWidth=5;cx.lineCap='round';
    cx.beginPath();cx.moveTo(26,52);cx.lineTo(20,78);cx.stroke();
    cx.beginPath();cx.moveTo(34,52);cx.lineTo(40,78);cx.stroke();
    /* 鞋 */
    cx.fillStyle=shoes;
    cx.fillRect(14,76,10,5);
    cx.fillRect(36,76,10,5);

    /* 躯干 */
    cx.fillStyle=shirt;
    cx.beginPath();
    cx.moveTo(22,24);cx.lineTo(38,24);
    cx.lineTo(40,52);cx.lineTo(20,52);
    cx.closePath();cx.fill();
    /* 衣领 */
    cx.strokeStyle='rgba(0,0,0,0.2)';cx.lineWidth=1;
    cx.beginPath();cx.moveTo(30,24);cx.lineTo(26,30);
    cx.moveTo(30,24);cx.lineTo(34,30);
    cx.stroke();
    /* 皮带 */
    cx.fillStyle=belt;
    cx.fillRect(21,48,18,3);
    /* 肩章 */
    cx.fillStyle='rgba(255,215,0,0.6)';
    cx.fillRect(22,24,5,3);
    cx.fillRect(33,24,5,3);

    /* 左臂 */
    cx.strokeStyle=shirt;cx.lineWidth=4;cx.lineCap='round';
    cx.beginPath();cx.moveTo(22,28);cx.lineTo(12,46);cx.stroke();
    /* 右手 */
    cx.fillStyle=skin;
    cx.beginPath();cx.arc(12,46,3,0,Math.PI*2);cx.fill();

    /* 右臂 (默认下垂) */
    cx.strokeStyle=shirt;cx.lineWidth=4;
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(48,46);cx.stroke();
    cx.fillStyle=skin;
    cx.beginPath();cx.arc(48,46,3,0,Math.PI*2);cx.fill();

    /* 头 */
    cx.fillStyle=skin;
    cx.beginPath();cx.arc(30,14,10,0,Math.PI*2);cx.fill();
    /* 头发 */
    cx.fillStyle='#2c1810';
    cx.beginPath();cx.arc(30,12,10,Math.PI,2*Math.PI);cx.fill();
    /* 脸 (眉毛/眼睛) */
    cx.fillStyle='#2c1810';
    cx.fillRect(25,12,2,1);cx.fillRect(33,12,2,1);/* 眼睛 */
    /* 嘴 */
    cx.beginPath();cx.arc(30,18,2.5,0.1,Math.PI-0.1);cx.stroke();

    /* 角色专属 */
    if(drawExtra)drawExtra(cx);
    return c.toDataURL();
  }

  function hat(cx,color){
    cx.fillStyle=color||'#1a2a4a';
    cx.fillRect(20,2,20,4);
    cx.fillRect(23,0,14,3);
    cx.fillStyle='#ffd700';
    cx.fillRect(28,2,4,1.5);
  }

  CHAR_ICONS.qixia = drawPerson('#ff4081',function(cx){
    /* 林锐：女警帽 + 右臂前指教学姿态 */
    hat(cx,'#1a2a4a');
    /* 女性头发轮廓 */
    cx.fillStyle='#2c1810';
    cx.beginPath();cx.arc(22,10,3,0,Math.PI*2);cx.fill();
    cx.beginPath();cx.arc(38,10,3,0,Math.PI*2);cx.fill();
    /* 右臂改为前指 */
    cx.strokeStyle='#ff4081';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(52,30);cx.lineTo(58,26);cx.stroke();
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(58,26,3,0,Math.PI*2);cx.fill();
    /* 左臂改叉腰 */
    cx.strokeStyle='#ff4081';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(22,28);cx.lineTo(14,32);cx.lineTo(12,40);cx.stroke();
  });

  CHAR_ICONS.chenjunnan = drawPerson('#76ff03',function(cx){
    /* 陈锋：便衣夹克 + 微蹲 + 手指抵唇 */
    /* 拉链线 */
    cx.strokeStyle='rgba(0,0,0,0.2)';cx.lineWidth=1;
    cx.beginPath();cx.moveTo(30,28);cx.lineTo(30,48);cx.stroke();
    /* 墨镜 */
    cx.fillStyle='#1a1a2e';
    cx.fillRect(24,11,5,3);
    cx.fillRect(31,11,5,3);
    cx.strokeStyle='#1a1a2e';cx.lineWidth=1;
    cx.beginPath();cx.moveTo(28,12);cx.lineTo(32,12);cx.stroke();
    /* 手指抵唇姿态——右臂弯曲向上到嘴 */
    cx.strokeStyle='#76ff03';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(44,22);cx.lineTo(40,16);cx.stroke();
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(40,16,3,0,Math.PI*2);cx.fill();
    /* 头发稍乱 */
    cx.fillStyle='#1a1a2e';
    cx.beginPath();cx.arc(24,10,2,0,Math.PI*2);cx.fill();
    cx.beginPath();cx.arc(36,10,2,0,Math.PI*2);cx.fill();
  });

  CHAR_ICONS.qiaojiagin = drawPerson('#ff9100',function(cx){
    /* 赵海：船长帽 + 双手举望远镜 */
    /* 船长帽 */
    cx.fillStyle='#1a2a4a';
    cx.fillRect(19,0,22,4);
    cx.fillRect(21,-2,18,3);
    cx.fillStyle='#ffd700';
    cx.fillRect(27,0,6,2);
    /* 双臂举望远镜 (双手在眼前组成圆形) */
    cx.strokeStyle='#ff9100';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(22,28);cx.lineTo(18,14);cx.stroke();/* 左臂上举 */
    cx.strokeStyle='#ff9100';
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(42,14);cx.stroke();/* 右臂上举 */
    /* 望远镜 */
    cx.fillStyle='#2c3e50';
    cx.fillRect(16,10,6,8);
    cx.fillRect(38,10,6,8);
    cx.strokeStyle='#4a5568';cx.lineWidth=2;
    cx.beginPath();cx.moveTo(22,14);cx.lineTo(38,14);cx.stroke();
    /* 手指 */
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(18,14,3,0,Math.PI*2);cx.fill();
    cx.beginPath();cx.arc(42,14,3,0,Math.PI*2);cx.fill();
  });

  CHAR_ICONS.yanzhichun = drawPerson('#ea80fc',function(cx){
    /* 白薇：医护帽 + 双臂交叉防守姿态 */
    /* 医护帽 */
    cx.fillStyle='#fff';
    cx.fillRect(22,2,16,6);
    cx.fillStyle='#e94560';
    cx.fillRect(28,3,4,2);
    /* 口罩 (半透明) */
    cx.fillStyle='rgba(200,230,255,0.5)';
    cx.fillRect(25,15,10,5);
    /* 双臂交叉在胸前 */
    cx.strokeStyle='#ea80fc';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(22,28);cx.lineTo(26,36);cx.lineTo(36,38);cx.stroke();
    cx.strokeStyle='#ea80fc';
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(34,36);cx.lineTo(24,38);cx.stroke();
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(36,38,3,0,Math.PI*2);cx.fill();
    cx.beginPath();cx.arc(24,38,3,0,Math.PI*2);cx.fill();
  });

  CHAR_ICONS.chutianqiu = drawPerson('#69f0ae',function(cx){
    /* 老周：警帽 + 白发 + 一手叉腰一手持望远镜 */
    hat(cx,'#1a2a4a');
    /* 白发 (两鬓) */
    cx.fillStyle='#e2e8f0';
    cx.beginPath();cx.arc(20,10,3,0,Math.PI*2);cx.fill();
    cx.beginPath();cx.arc(40,10,3,0,Math.PI*2);cx.fill();
    /* 皱纹 (额纹) */
    cx.strokeStyle='rgba(0,0,0,0.15)';cx.lineWidth=0.5;
    cx.beginPath();cx.moveTo(27,9);cx.lineTo(33,9);cx.stroke();
    /* 右臂叉腰 */
    cx.strokeStyle='#69f0ae';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(44,34);cx.lineTo(40,44);cx.stroke();
    /* 左臂持望远镜 */
    cx.strokeStyle='#69f0ae';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(22,28);cx.lineTo(8,36);cx.stroke();
    cx.fillStyle='#2c3e50';
    cx.fillRect(4,32,8,6);
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(8,36,3,0,Math.PI*2);cx.fill();
  });

  CHAR_ICONS.jiangruoxue = drawPerson('#00e5ff',function(cx){
    /* 小辉：警帽 + 立正敬礼 */
    hat(cx,'#1a2a4a');
    /* 年轻面孔——没有皱纹, 大眼睛 */
    cx.fillStyle='#fff';
    cx.fillRect(26,12,3,3);cx.fillRect(31,12,3,3);/* 眼白 */
    cx.fillStyle='#1a1a2e';
    cx.fillRect(27,13,1,1);cx.fillRect(32,13,1,1);/* 瞳孔 */
    /* 右臂敬礼 */
    cx.strokeStyle='#00e5ff';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(38,28);cx.lineTo(46,18);cx.lineTo(48,10);cx.stroke();
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(48,10,3,0,Math.PI*2);cx.fill();
    /* 左臂垂立 */
    cx.strokeStyle='#00e5ff';cx.lineWidth=4;
    cx.beginPath();cx.moveTo(22,28);cx.lineTo(12,46);cx.stroke();
    cx.fillStyle='#f5d6b8';
    cx.beginPath();cx.arc(12,46,3,0,Math.PI*2);cx.fill();
  });

})();
