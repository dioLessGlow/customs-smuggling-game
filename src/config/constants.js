const SAVE_KEY = 'anti_smuggling_save_v4';
let _memoryStore = null;

var TUTOR_POOL = [
  { id:'linrui', icon:'👮‍♀️', name:'林锐', role:'通关走私专员', range:'k01~k06', echo:'crisis_exempt', color:'#ffd700' },
  { id:'chenfeng', icon:'🕵️', name:'陈锋', role:'毒品查缉专家', range:'k07~k12', echo:'wind_warning', color:'#00e5ff' },
  { id:'zhaohai', icon:'👨‍✈️', name:'赵海', role:'空港快件专家', range:'k13~k18', echo:'adversity_rebound', color:'#ff9100' },
  { id:'baiwei', icon:'👩‍⚕️', name:'白薇', role:'医学识别专家', range:'k19~k24', echo:'time_mastery', color:'#ea80fc' },
  { id:'laozhou', icon:'👮‍♂️', name:'老周', role:'海上缉私专家', range:'k25~k30', echo:'combo_keep', color:'#4ecca3' },
  { id:'xiaohui', icon:'👨‍🚒', name:'小辉', role:'机动特勤队长', range:'k31~k36', echo:'lucky_bonus', color:'#76ff03' }
];

var TUTOR2ECHO = {};
TUTOR_POOL.forEach(function(t) { TUTOR2ECHO[t.id] = t.echo; });
