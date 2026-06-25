var _mapRoot = null;
var _tutorFilter = 'all';
var _isGlobe = true;

function _startLevel(levelId) {
  var cfg = LEVELS.find(function(l) { return l.id === levelId; });
  if (!cfg) return;
  var save = SaveManager.load();
  var unlocked = save.unlocked.indexOf(levelId) >= 0;
  var completed = save.completed.indexOf(levelId) >= 0;
  var canAfford = save.permanentDao >= cfg.cost;
  if (!unlocked) return;
  if (completed || !canAfford) return;
  soundManager.play('click');
  save.permanentDao -= cfg.cost;
  SaveManager.save(save);
  UI.hide();
  document.getElementById('phaser-container').style.display = 'block';
  game.scene.start(cfg.scene, { levelId: levelId });
}

function _getLevelState(levelId) {
  var save = SaveManager.load();
  var completed = save.completed.indexOf(levelId) >= 0;
  var inThisCycle = save.roundsInCycle.indexOf(levelId) >= 0;
  var unlocked = save.unlocked.indexOf(levelId) >= 0;
  if (completed) return 'completed';
  if (inThisCycle) return 'active';
  if (unlocked) return 'unlocked';
  return 'locked';
}

UI.on('level-select', function () {
  var container = document.getElementById('map-container');
  if (_mapRoot) { _mapRoot.dispose(); _mapRoot = null; }
  container.innerHTML = '';



  // Build filter bar — 7 cells: 全部 + 6 tutors
  var filterBar = document.getElementById('level-filter-bar');
  filterBar.innerHTML = '';
  var tutorColors = ['#8b5e3c','#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
  var labels = ['全部','林锐','陈锋','赵海','白薇','老周','小辉'];
  var ids = ['all','linrui','chenfeng','zhaohai','baiwei','laozhou','xiaohui'];


  for (var i = 0; i < 7; i++) {
    var btn = document.createElement('button');
    btn.textContent = labels[i];
    btn.style.cssText = 'background:' + (_tutorFilter === ids[i] ? tutorColors[i] : 'transparent') + ';color:' + (_tutorFilter === ids[i] ? '#fff' : '#3c1e0e') + ';border:1px solid ' + tutorColors[i] + ';border-radius:3px;padding:1px 0;font-size:10px;cursor:pointer;font-family:inherit;width:44px;text-align:center;font-weight:' + (_tutorFilter === ids[i] ? '600' : '400') + ';';
    (function (id) {
      btn.addEventListener('click', function () { _tutorFilter = id; UI.show('level-select'); });
    })(ids[i]);
    filterBar.appendChild(btn);
  }

  if (typeof am5 === 'undefined') return;

  try {
    var root = am5.Root.new('map-container');
    _mapRoot = root;

    var coffeeTheme = am5.Theme.new(root);
    coffeeTheme.rule("InterfaceColors").setAll({
      primaryButton: am5.color(0x8b5e3c),
      background: am5.color(0xe8d5b7),
      text: am5.color(0x3c1e0e)
    });
    root.setThemes([am5themes_Animated.new(root), coffeeTheme]);
    if (root._logo) root._logo.dispose();

    root.container.set("background", am5.Rectangle.new(root, {
      fill: am5.color(0xf0e6d6)
    }));

    var espresso = am5.color(0x3c1e0e);
    var mediumRoast = am5.color(0x8b5e3c);
    var lightRoast = am5.color(0xc4956a);
    var cream = am5.color(0xf5ece0);
    var gold = am5.color(0xdaa520);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      rotationX: -15,
      rotationY: -20,
      minZoomLevel: 0.5,
      zoomLevel: 0.9
    }));

    var bgSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    bgSeries.mapPolygons.template.setAll({
      fill: am5.color(0xede4d4),
      fillOpacity: 1,
      strokeOpacity: 0
    });
    bgSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

    var graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: mediumRoast,
      strokeOpacity: 0.15,
      strokeWidth: 0.5
    });

    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: cream,
      stroke: lightRoast,
      strokeWidth: 0.5,
      strokeOpacity: 0.5
    });

    var coords = [
      [45.72, -23.82], [88.93, 15.77], [28.14, 28.28], [-68.28, -9.05],
      [142.87, -15.67], [105.42, 62.14], [-67.56, -32.5], [-89.84, 23.24],
      [-76.59, 49.1], [-75.44, -0.08], [113.44, -30.34], [37.53, 21.95],
      [70.89, 42.3], [-60.19, -28.71], [20.34, -22.82], [108.74, 48.09],
      [103.77, 28.21], [-121.18, -78.62], [14.65, 14.24], [-80.51, 40.75],
      [11.07, 46.86], [-59.8, 60.77], [104.46, 5.89], [125.27, 38.66],
      [26.81, 60.03], [174.52, -42.46], [-56.71, -46.36], [-159.4, 59.19],
      [-2.39, 52.89], [-110.39, 46.16], [13.77, 36.41], [97.73, 32.47],
      [141.88, -1.32], [130.86, 40.04], [41.68, 49.22], [31.27, -2.84]
    ];

    var passes = [];
    var tutorLevelMap = {};
    for (var i = 0; i < 36; i++) {
      var cfg = LEVELS[i];
      var state = _getLevelState(cfg.id);
      if (_tutorFilter !== 'all' && cfg.tutor !== _tutorFilter) continue;
      passes.push({
        id: 'P' + (i < 9 ? '0' : '') + (i + 1),
        name: cfg.name,
        levelId: cfg.id,
        state: state,
        tier: cfg.tier,
        cost: cfg.cost,
        geometry: { type: "Point", coordinates: coords[i] }
      });
      if (!tutorLevelMap[cfg.tutor]) tutorLevelMap[cfg.tutor] = [];
      tutorLevelMap[cfg.tutor].push(i);
    }

    var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {
      geometryField: 'geometry'
    }));

    pointSeries.bullets.push(function (root, series, dataItem) {
      var data = dataItem.dataContext;
      var unlocked = data.state !== 'locked';
      var c = am5.Container.new(root, { cursorOverStyle: unlocked ? 'pointer' : 'default' });
      // Invisible larger hitbox for easier clicking
      c.children.push(am5.Circle.new(root, { radius: 20, fill: lightRoast, fillOpacity: 0, strokeOpacity: 0 }));
      c.children.push(am5.Circle.new(root, { radius: 8, fill: lightRoast, fillOpacity: unlocked ? 0.25 : 0.1, strokeOpacity: 0 }));
      c.children.push(am5.Circle.new(root, {
        radius: 5, fill: data.state === 'locked' ? lightRoast : (data.state === 'completed' ? gold : mediumRoast),
        fillOpacity: data.state === 'locked' ? 0.35 : (unlocked ? 0.9 : 0.35),
        stroke: data.state === 'locked' ? lightRoast : espresso,
        strokeWidth: 1, strokeOpacity: data.state === 'locked' ? 0.35 : 1
      }));
      c.children.push(am5.Circle.new(root, { radius: 2, fill: cream, strokeOpacity: 0 }));
      if (unlocked) {
        c.events.on('click', function () { _startLevel(data.levelId); });
      }
      var cfg = LEVELS.find(function(l) { return l.id === data.levelId; });
      var tierLabel = cfg ? ({ trainee:'见习', duty:'执勤', special:'特勤' })[cfg.tier] || '' : '';
      var costLabel = cfg ? cfg.cost + '功勋' : '';
      var tipText = data.state === 'locked' ? data.name + ' 🔒' : data.name + ' [' + tierLabel + ' ' + costLabel + ']';
      return am5.Bullet.new(root, { sprite: c, tooltipText: tipText });
    });

    pointSeries.bullets.push(function (root, series, dataItem) {
      var data = dataItem.dataContext;
      var unlocked = data.state !== 'locked';
      var label = am5.Label.new(root, {
        text: "{name}",
        populateText: true,
        fill: espresso,
        fontSize: 11,
        fontWeight: "600",
        centerX: am5.p50,
        centerY: am5.p50,
        dy: -22,
        cursorOverStyle: unlocked ? 'pointer' : 'default'
      });
      if (unlocked) {
        label.events.on('click', function () { _startLevel(data.levelId); });
      }
      return am5.Bullet.new(root, { sprite: label });
    });

    pointSeries.data.setAll(passes);

    if (_tutorFilter !== 'all') {
      var tIdx = TUTOR_POOL.findIndex(function (t) { return t.id === _tutorFilter; });
      var lineColor = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'][tIdx] || '#94a3b8';
      var indices = tutorLevelMap[_tutorFilter] || [];
      var lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
      lineSeries.mapLines.template.setAll({
        stroke: am5.color(lineColor),
        strokeOpacity: 0.4,
        strokeWidth: 2,
        strokeDasharray: [4, 4],
        tooltipText: ''
      });
      lineSeries.data.setAll([{
        geometry: { type: "LineString", coordinates: indices.map(function (i) { return coords[i]; }) }
      }]);
    }

    // Moving marker — only in tutor filter mode (6 levels)
    if (_tutorFilter !== 'all') (function () {
      var s2 = SaveManager.load();
      var nextIdx = -1;
      var lastDone = -1;
      for (var i2 = 0; i2 < LEVELS.length; i2++) {
        if (LEVELS[i2].tutor !== _tutorFilter) continue;
        var lid = LEVELS[i2].id;
        if (s2.completed.indexOf(lid) >= 0) lastDone = i2;
        if (s2.unlocked.indexOf(lid) >= 0 && s2.completed.indexOf(lid) < 0 && nextIdx < 0) nextIdx = i2;
      }
      if (nextIdx < 0) return;
      // Build path along the line
      var pathIndices = tutorLevelMap[_tutorFilter] || [];
      var pathStart = lastDone >= 0 ? pathIndices.indexOf(lastDone) : -1;
      var pathEnd = pathIndices.indexOf(nextIdx);
      var pathCoords = [];
      if (pathStart >= 0 && pathEnd > pathStart) {
        for (var pi = pathStart; pi <= pathEnd; pi++) pathCoords.push(coords[pathIndices[pi]]);
      } else {
        pathCoords = [coords[nextIdx]];
      }
      var mkSeries = chart.series.push(am5map.MapPointSeries.new(root, { geometryField: 'geometry' }));
      mkSeries.data.setAll([{ geometry: { type: "Point", coordinates: pathCoords[0] } }]);
      mkSeries.bullets.push(function () {
        var c = am5.Container.new(root, {});
        c.children.push(am5.Circle.new(root, {
          radius: 12, fill: am5.color(0xff4444), fillOpacity: 0.2, strokeOpacity: 0
        }));
        var ring = am5.Circle.new(root, {
          radius: 8, fill: am5.color(0xff1744), fillOpacity: 0.7, stroke: am5.color(0xff1744), strokeWidth: 2
        });
        ring.animate({ key: "radius", from: 6, to: 11, duration: 900, loops: Infinity, easing: am5.ease.inOut(am5.ease.sine) });
        ring.animate({ key: "fillOpacity", from: 0.5, to: 1, duration: 900, loops: Infinity, easing: am5.ease.inOut(am5.ease.sine) });
        c.children.push(ring);
        c.children.push(am5.Circle.new(root, { radius: 3, fill: am5.color(0xffffff), strokeOpacity: 0 }));
        return am5.Bullet.new(root, { sprite: c });
      });
      // Wait 1s then glide from start to end
      setTimeout(function () {
        var steps = 20;
        var stepDur = 30;
        var from = pathCoords[0];
        var to = pathCoords[pathCoords.length - 1];
        if (from[0] === to[0] && from[1] === to[1]) return;
        for (var si = 1; si <= steps; si++) {
          (function (t) {
            setTimeout(function () {
              var lat = from[0] + (to[0] - from[0]) * t / steps;
              var lon = from[1] + (to[1] - from[1]) * t / steps;
              mkSeries.data.setAll([{ geometry: { type: "Point", coordinates: [lat, lon] } }]);
            }, t * stepDur);
          })(si);
        }
      }, 1000);
    })();

    var titleCont = chart.children.push(am5.Container.new(root, {
      layout: root.verticalLayout,
      x: am5.p50, centerX: am5.p50,
      y: am5.p100, centerY: am5.p100,
      position: "absolute", paddingBottom: 16
    }));
    titleCont.children.push(am5.Label.new(root, {
      text: "三十六海关",
      fontSize: 11, fill: mediumRoast,
      x: am5.p50, centerX: am5.p50
    }));

    var northLabel = chart.children.push(am5.Label.new(root, {
      text: "北", fontSize: 14, fill: mediumRoast,
      x: am5.p50, centerX: am5.p50, y: 75,
      position: "absolute"
    }));



    var southCont = chart.children.push(am5.Container.new(root, {
      x: am5.p50, centerX: am5.p50,
      y: am5.p100, centerY: am5.p100,
      position: "absolute", paddingBottom: 80
    }));
    function setNSPos(globe) {
      northLabel.set("y", globe ? 75 : 50);
      southCont.set("paddingBottom", globe ? 80 : 60);
    }
    var southLabel = am5.Label.new(root, {
      text: "南", fontSize: 14, fill: mediumRoast
    });
    southCont.children.push(southLabel);

    chart.chartContainer.events.on("pointerdown", function () {
      if (rotAnim) { rotAnim.stop(); rotAnim = null; }
    });

    function updatePoleLabels() {
      if (chart.get("panX") !== "rotateX") return;
      try {
        var north = chart.convert({ latitude: 90, longitude: 0 });
        var south = chart.convert({ latitude: -90, longitude: 0 });
        if (north && south) {
          var nUp = north.y < south.y;
          northLabel.set("text", nUp ? "北" : "南");
          southLabel.set("text", nUp ? "南" : "北");
        } else if (north) {
          northLabel.set("text", "北"); southLabel.set("text", "南");
        } else if (south) {
          northLabel.set("text", "南"); southLabel.set("text", "北");
        }
      } catch (e) {}
    }
    setInterval(updatePoleLabels, 100);

    if (_tutorFilter === 'all') {
      var legendCont = chart.children.push(am5.Container.new(root, {
        layout: root.verticalLayout,
        x: 10, y: am5.p100, centerY: am5.p100,
        position: "absolute", paddingBottom: 44, gap: 6
      }));
      function legendItem(fillColor, label) {
        var c = am5.Container.new(root, { layout: root.horizontalLayout, gap: 4 });
        c.children.push(am5.Circle.new(root, { radius: 4, fill: fillColor, strokeOpacity: 0 }));
        c.children.push(am5.Label.new(root, { text: label, fontSize: 10, fill: mediumRoast }));
        return c;
      }
      legendCont.children.push(legendItem(lightRoast, "未开放"));
      legendCont.children.push(legendItem(mediumRoast, "已开放"));
      legendCont.children.push(legendItem(gold, "已通关"));
    }

    var zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", true);

    var switchCont = chart.children.push(am5.Container.new(root, {
      layout: root.horizontalLayout, x: 265, y: 51
    }));
    switchCont.children.push(am5.Label.new(root, {
      centerY: am5.p50, text: "地球", fill: espresso, fontSize: 13
    }));
    var switchBtn = switchCont.children.push(am5.Button.new(root, {
      themeTags: ["switch"], centerY: am5.p50,
      icon: am5.Circle.new(root, { themeTags: ["icon"] })
    }));
    switchCont.children.push(am5.Label.new(root, {
      centerY: am5.p50, text: "地图", fill: espresso, fontSize: 13
    }));

    var easing = am5.ease.inOut(am5.ease.cubic);
    var dur = 1500;
    var _restoring = false;

    function zoomToGlobe() {
      if (rotAnim) { rotAnim.stop(); rotAnim = null; }
      setNSPos(true);
      chart.set("projection", am5map.geoOrthographic());
      chart.set("panX", "rotateX"); chart.set("panY", "rotateY");
      chart.animate({ key: "rotationX", to: -15, duration: dur, easing: easing });
      chart.animate({ key: "rotationY", to: -20, duration: dur, easing: easing });
      chart.set("minZoomLevel", 0.5);
      chart.animate({ key: "zoomLevel", to: 0.9, duration: dur, easing: easing }).events.on("animationended", function () {
        animStart = Date.now();
        rotAnim = chart.animate({
          key: "rotationX", from: -15, to: -15 + 360,
          duration: 120000, loops: Infinity, easing: am5.ease.linear
        });
      });
    }

    function zoomToMap() {
      if (rotAnim) { rotAnim.stop(); rotAnim = null; }
      setNSPos(false);
      northLabel.set("text", "北"); southLabel.set("text", "南");
      chart.set("projection", am5map.geoMercator());
      chart.set("panX", "translateX"); chart.set("panY", "translateY");
      chart.animate({ key: "rotationX", to: 0, duration: dur, easing: easing });
      chart.animate({ key: "rotationY", to: 0, duration: dur, easing: easing });
      chart.set("minZoomLevel", 1);
      chart.animate({ key: "zoomLevel", to: 1.7, duration: dur, easing: easing });
    }

    switchBtn.on("active", function () {
      if (_restoring) return;
      _isGlobe = !switchBtn.get("active");
      chart.goHome(dur);
      setTimeout(function () { chart.seriesContainer.animate({ key: "opacity", to: 0, duration: 300 }); }, dur - 300);
      setTimeout(function () {
        if (switchBtn.get("active")) zoomToMap(); else zoomToGlobe();
        chart.seriesContainer.animate({ key: "opacity", to: 1, duration: 300 });
      }, dur);
    });

    var rotAnim = null;
    if (_isGlobe) {
      rotAnim = chart.animate({
        key: "rotationX", from: -15, to: -15 + 360,
        duration: 120000, loops: Infinity, easing: am5.ease.linear
      });
    } else {
      chart.set("projection", am5map.geoMercator());
      chart.set("panX", "translateX"); chart.set("panY", "translateY");
      chart.set("rotationX", 0); chart.set("rotationY", 0);
      chart.set("minZoomLevel", 1); chart.set("zoomLevel", 1.7);
      setNSPos(false);
      northLabel.set("text", "北"); southLabel.set("text", "南");
      _restoring = true;
      switchBtn.set("active", true);
      _restoring = false;
    }
    chart.appear(1000, 100);
  } catch (e) { if (typeof console !== 'undefined') console.error(e); }
});
