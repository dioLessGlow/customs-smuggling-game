var PortraitGallery = function (containerEl, options) {
  options = options || {};
  this.container = containerEl;
  this.items = [];
  this.textures = [];
  this.tileWidth = options.tileWidth || 80;
  this.tileHeight = options.tileHeight || 80;
  this.gap = options.gap || 8;
  this.cols = options.cols || 5;
  this.onClick = options.onClick || null;
  this.baseW = 390;
  this.baseH = 844;
  this.viewOffset = { x: 0, y: 0 };
  this.drag = { isDragging: false, lastY: 0, velocityY: 0 };
  this.inertia = 0.95;
  this.bulgeStrength = 0.3;
  this.bulgeRadius = 1.0;
  this.adjustedBulgeRadius = this.bulgeRadius;
  this._animId = null;
  this._init();
};

PortraitGallery.prototype._init = function () {
  var gl = this.gl;
  if (!gl) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'gallery-canvas';
    this.container.appendChild(this.canvas);
    this._ready = false;
    try {
      gl = this.canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false }) || this.canvas.getContext('experimental-webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    } catch (e) {}
    if (!gl) {
      this._ready = false;
      return;
    }
    this.gl = gl;
    this._initGL();
    if (!this.program) return;
    this._ready = true;
    this._setupEvents();
    this._resize();
    this._animate();
  }
};

PortraitGallery.prototype._initGL = function () {
  var gl = this.gl;
  var vsSource = [
    'attribute vec2 aPosition;',
    'attribute vec2 aTexCoord;',
    'varying vec2 vTexCoord;',
    'uniform vec2 uResolution;',
    'uniform vec2 uOffset;',
    'uniform vec2 uImagePosition;',
    'uniform float uBulgeStrength;',
    'uniform float uBulgeRadius;',
    'vec2 applyBulgeEffect(vec2 pos){',
    '  vec2 normalizedPos = pos / uResolution;',
    '  vec2 center = vec2(0.5,0.5);',
    '  vec2 delta = normalizedPos - center;',
    '  float aspect = uResolution.x / uResolution.y;',
    '  delta.x *= aspect;',
    '  float dist = length(delta);',
    '  if(dist < uBulgeRadius){',
    '    float t = dist / uBulgeRadius;',
    '    float z = sqrt(1.5 - t*t);',
    '    delta *= 0.35 + uBulgeStrength * z;',
    '    delta.x /= aspect;',
    '    normalizedPos = center + delta;',
    '    pos = normalizedPos * uResolution;',
    '  }',
    '  return pos;',
    '}',
    'void main(){',
    '  vec2 pos = aPosition * vec2(' + this.tileWidth + '.0,' + this.tileHeight + '.0);',
    '  pos += uImagePosition;',
    '  pos -= uOffset;',
    '  vec2 center = uImagePosition + vec2(' + (this.tileWidth/2) + '.0,' + (this.tileHeight/2) + '.0) - uOffset;',
    '  pos -= center;',
    '  pos += center;',
    '  pos = applyBulgeEffect(pos);',
    '  vec2 clip = pos / uResolution * 2.0 - 1.0;',
    '  gl_Position = vec4(clip,0.0,1.0);',
    '  vTexCoord = aTexCoord;',
    '}'
  ].join('\n');
  var fsSource = [
    'precision mediump float;',
    'varying vec2 vTexCoord;',
    'uniform sampler2D uSampler;',
    'void main(){',
    '  vec2 uv = vec2(vTexCoord.x,1.0-vTexCoord.y);',
    '  vec4 color = texture2D(uSampler, uv);',
    '  if(color.a<0.01) discard;',
    '  gl_FragColor = color;',
    '}'
  ].join('\n');
  this.program = this._createProgram(vsSource, fsSource);
  var SUBDIV = 24;
  var positions = [], texCoords = [], indices = [];
  for (var y = 0; y <= SUBDIV; y++) {
    for (var x = 0; x <= SUBDIV; x++) {
      positions.push(x / SUBDIV, y / SUBDIV);
      texCoords.push(x / SUBDIV, y / SUBDIV);
    }
  }
  for (var y = 0; y < SUBDIV; y++) {
    for (var x = 0; x < SUBDIV; x++) {
      var i = y * (SUBDIV + 1) + x;
      indices.push(i, i + 1, i + SUBDIV + 1, i + 1, i + SUBDIV + 2, i + SUBDIV + 1);
    }
  }
  this.indexCount = indices.length;
  var gl2 = this.gl;
  this.positionBuffer = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, this.positionBuffer);
  gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(positions), gl2.STATIC_DRAW);
  this.texCoordBuffer = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, this.texCoordBuffer);
  gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(texCoords), gl2.STATIC_DRAW);
  this.indexBuffer = gl2.createBuffer();
  gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl2.STATIC_DRAW);
  gl2.enable(gl2.BLEND);
  gl2.blendFunc(gl2.SRC_ALPHA, gl2.ONE_MINUS_SRC_ALPHA);
};

PortraitGallery.prototype.setItems = function (items) {
  this.items = items || [];
  this._generateTextures();
};

PortraitGallery.prototype._generateTextures = function () {
  var gl2 = this.gl;
  var tw = this.tileWidth, th = this.tileHeight;
  this.textures.forEach(function (t) { gl2.deleteTexture(t); });
  this.textures = [];
  var self = this;
  this.items.forEach(function (item) {
    var c = document.createElement('canvas');
    c.width = tw;
    c.height = th;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, tw, th);
    // bg
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.rect(2, 2, tw - 4, th - 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(2, 2, tw - 4, th - 4);
    ctx.stroke();
    // emoji
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var iconSize = Math.max(18, Math.min(32, tw * 0.4));
    ctx.font = iconSize + 'px serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(item.icon || '📦', tw / 2, th * 0.38);
    // name
    var nameSize = Math.max(8, Math.min(11, tw * 0.13));
    ctx.font = 'bold ' + nameSize + 'px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    var name = item.name || '';
    if (name.length > 6) name = name.slice(0, 5) + '…';
    ctx.fillText(name, tw / 2, th * 0.78);
    var tex = gl2.createTexture();
    gl2.bindTexture(gl2.TEXTURE_2D, tex);
    gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, c);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
    self.textures.push(tex);
  });
};

PortraitGallery.prototype._getContentHeight = function () {
  var totalRows = Math.ceil(this.items.length / this.cols);
  return totalRows * (this.tileHeight + this.gap) - this.gap;
};

PortraitGallery.prototype._clampViewOffset = function () {
  var contentH = this._getContentHeight();
  var maxScroll = Math.max(0, contentH - this.baseH);
  this.viewOffset.y = Math.max(0, Math.min(this.viewOffset.y, maxScroll));
};

PortraitGallery.prototype._getVisibleTiles = function () {
  var tiles = [];
  var colW = this.tileWidth + this.gap;
  var rowH = this.tileHeight + this.gap;
  var totalRows = Math.ceil(this.items.length / this.cols);
  var totalGridW = this.cols * colW - this.gap;
  var offsetX = (this.baseW - totalGridW) / 2;
  var yStart = this.viewOffset.y - this.baseH;
  var yEnd = this.viewOffset.y + this.baseH;
  for (var row = Math.max(0, Math.floor(yStart / rowH) - 1); row <= Math.min(totalRows - 1, Math.ceil(yEnd / rowH) + 1); row++) {
    for (var col = 0; col < this.cols; col++) {
      var idx = row * this.cols + col;
      if (idx >= this.items.length) continue;
      tiles.push({ x: offsetX + col * colW, y: row * rowH, itemIndex: idx });
    }
  }
  return tiles;
};

PortraitGallery.prototype.render = function () {
  var gl2 = this.gl;
  if (!this._ready || !this.program || this.items.length === 0 || !gl2) return;
  gl2.viewport(0, 0, this.baseW, this.baseH);
  gl2.clearColor(0.035, 0.035, 0.05, 1);
  gl2.clear(gl2.COLOR_BUFFER_BIT);
  gl2.useProgram(this.program);
  var posLoc = gl2.getAttribLocation(this.program, "aPosition");
  gl2.enableVertexAttribArray(posLoc);
  gl2.bindBuffer(gl2.ARRAY_BUFFER, this.positionBuffer);
  gl2.vertexAttribPointer(posLoc, 2, gl2.FLOAT, false, 0, 0);
  var texLoc = gl2.getAttribLocation(this.program, "aTexCoord");
  gl2.enableVertexAttribArray(texLoc);
  gl2.bindBuffer(gl2.ARRAY_BUFFER, this.texCoordBuffer);
  gl2.vertexAttribPointer(texLoc, 2, gl2.FLOAT, false, 0, 0);
  gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl2.uniform2f(gl2.getUniformLocation(this.program, "uResolution"), this.baseW, this.baseH);
  gl2.uniform1f(gl2.getUniformLocation(this.program, "uBulgeStrength"), this.bulgeStrength);
  gl2.uniform1f(gl2.getUniformLocation(this.program, "uBulgeRadius"), this.adjustedBulgeRadius);
  var offLoc = gl2.getUniformLocation(this.program, "uOffset");
  var imgLoc = gl2.getUniformLocation(this.program, "uImagePosition");
  var smpLoc = gl2.getUniformLocation(this.program, "uSampler");
  var tiles = this._getVisibleTiles();
  for (var ti = 0; ti < tiles.length; ti++) {
    var tile = tiles[ti];
    gl2.uniform2f(offLoc, this.viewOffset.x, this.viewOffset.y);
    gl2.uniform2f(imgLoc, tile.x, tile.y);
    gl2.activeTexture(gl2.TEXTURE0);
    gl2.bindTexture(gl2.TEXTURE_2D, this.textures[tile.itemIndex]);
    gl2.uniform1i(smpLoc, 0);
    gl2.drawElements(gl2.TRIANGLES, this.indexCount, gl2.UNSIGNED_SHORT, 0);
  }
};

PortraitGallery.prototype._resize = function () {
  var cw = this.container.offsetWidth || window.innerWidth;
  var ch = this.container.offsetHeight || window.innerHeight;
  if (ch < 200) ch = window.innerHeight;
  this.baseW = 390;
  this.baseH = 844;
  this.container.style.width = cw + 'px';
  this.container.style.height = ch + 'px';
  if (this.canvas) {
    this.canvas.width = this.baseW;
    this.canvas.height = this.baseH;
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
  }
  var t = Math.sqrt(Math.pow(this.baseW / Math.min(this.baseW, this.baseH), 2) + Math.pow(this.baseH / Math.min(this.baseW, this.baseH), 2));
  this.adjustedBulgeRadius = Math.max(this.bulgeRadius, 0.6 * t * 1.2);
  if (this.gl) this.gl.viewport(0, 0, this.baseW, this.baseH);
};

PortraitGallery.prototype._getHitItem = function (tx, ty) {
  var ix = tx + this.viewOffset.x;
  var iy = ty + this.viewOffset.y;
  var tiles = this._getVisibleTiles();
  for (var ti = 0; ti < tiles.length; ti++) {
    var t = tiles[ti];
    if (ix >= t.x && ix <= t.x + this.tileWidth && iy >= t.y && iy <= t.y + this.tileHeight) {
      return this.items[t.itemIndex];
    }
  }
  return null;
};

PortraitGallery.prototype._toBase = function (cx, cy) {
  var r = this.canvas.getBoundingClientRect();
  return { x: (cx - r.left) * (this.baseW / r.width), y: (cy - r.top) * (this.baseH / r.height) };
};

PortraitGallery.prototype._setupEvents = function () {
  var self = this;
  var cvs = this.canvas;
  this._handlers = {};

  this._handlers.mousedown = function (e) {
    var p = self._toBase(e.clientX, e.clientY);
    self.drag.isDragging = true;
    self.drag.lastY = p.y;
    self.drag.startX = p.x;
    self.drag.startY = p.y;
    self.drag.moved = false;
  };
  cvs.addEventListener('mousedown', this._handlers.mousedown);

  this._handlers.mousemove = function (e) {
    if (!self.drag.isDragging) return;
    var p = self._toBase(e.clientX, e.clientY);
    var dy = p.y - self.drag.lastY;
    if (Math.abs(p.x - self.drag.startX) > 5 || Math.abs(p.y - self.drag.startY) > 5) self.drag.moved = true;
    self.drag.velocityY = 0.3 * dy + 0.7 * self.drag.velocityY;
    self.viewOffset.y -= self.drag.velocityY;
    self._clampViewOffset();
    self.drag.lastY = p.y;
  };
  window.addEventListener('mousemove', this._handlers.mousemove);

  this._handlers.mouseup = function () { self.drag.isDragging = false; };
  window.addEventListener('mouseup', this._handlers.mouseup);

  this._handlers.click = function (e) {
    if (self.drag.moved) return;
    var p = self._toBase(e.clientX, e.clientY);
    var item = self._getHitItem(p.x, p.y);
    if (item && self.onClick) self.onClick(item);
  };
  cvs.addEventListener('click', this._handlers.click);

  this._handlers.touchstart = function (e) {
    e.preventDefault();
    var p = self._toBase(e.touches[0].clientX, e.touches[0].clientY);
    self.drag.isDragging = true;
    self.drag.lastY = p.y;
    self.drag.startX = p.x;
    self.drag.startY = p.y;
    self.drag.moved = false;
  };
  cvs.addEventListener('touchstart', this._handlers.touchstart, { passive: false });

  this._handlers.touchmove = function (e) {
    if (!self.drag.isDragging) return;
    e.preventDefault();
    var p = self._toBase(e.touches[0].clientX, e.touches[0].clientY);
    var dy = p.y - self.drag.lastY;
    if (Math.abs(p.x - self.drag.startX) > 8 || Math.abs(p.y - self.drag.startY) > 8) self.drag.moved = true;
    self.drag.velocityY = 0.3 * dy + 0.7 * self.drag.velocityY;
    self.viewOffset.y -= self.drag.velocityY;
    self._clampViewOffset();
    self.drag.lastY = p.y;
  };
  window.addEventListener('touchmove', this._handlers.touchmove, { passive: false });

  this._handlers.touchend = function () { self.drag.isDragging = false; };
  window.addEventListener('touchend', this._handlers.touchend);

  this._handlers.wheel = function (e) {
    e.preventDefault();
    self.drag.velocityY += 0.3 * e.deltaY;
    self._clampViewOffset();
  };
  cvs.addEventListener('wheel', this._handlers.wheel, { passive: false });

  this._handlers.resize = function () { self._resize(); };
  window.addEventListener('resize', this._handlers.resize);
};

PortraitGallery.prototype._animate = function () {
  var self = this;
  if (!this.drag.isDragging) {
    this.viewOffset.y -= this.drag.velocityY;
    this._clampViewOffset();
    this.drag.velocityY *= this.inertia;
    if (Math.abs(this.drag.velocityY) < 0.1) this.drag.velocityY = 0;
  }
  this.render();
  this._animId = requestAnimationFrame(function () { self._animate(); });
};

PortraitGallery.prototype._loadShader = function (type, src) {
  var gl2 = this.gl;
  var s = gl2.createShader(type);
  gl2.shaderSource(s, src);
  gl2.compileShader(s);
  if (!gl2.getShaderParameter(s, gl2.COMPILE_STATUS)) {
    return null;
  }
  return s;
};

PortraitGallery.prototype._createProgram = function (vs, fs) {
  var gl2 = this.gl;
  var vsShader = this._loadShader(gl2.VERTEX_SHADER, vs);
  var fsShader = this._loadShader(gl2.FRAGMENT_SHADER, fs);
  if (!vsShader || !fsShader) return null;
  var p = gl2.createProgram();
  gl2.attachShader(p, vsShader);
  gl2.attachShader(p, fsShader);
  gl2.linkProgram(p);
  if (!gl2.getProgramParameter(p, gl2.LINK_STATUS)) return null;
  return p;
};

PortraitGallery.prototype.destroy = function () {
  if (this._animId) cancelAnimationFrame(this._animId);
  if (this._handlers) {
    var cvs = this.canvas;
    if (cvs) {
      cvs.removeEventListener('mousedown', this._handlers.mousedown);
      cvs.removeEventListener('click', this._handlers.click);
      cvs.removeEventListener('touchstart', this._handlers.touchstart);
      cvs.removeEventListener('wheel', this._handlers.wheel);
    }
    window.removeEventListener('mousemove', this._handlers.mousemove);
    window.removeEventListener('mouseup', this._handlers.mouseup);
    window.removeEventListener('touchmove', this._handlers.touchmove);
    window.removeEventListener('touchend', this._handlers.touchend);
    window.removeEventListener('resize', this._handlers.resize);
  }
  if (this.gl) {
    this.textures.forEach(function (t) { this.gl.deleteTexture(t); }, this);
  }
  this.textures = [];
  this.items = [];
  if (this.canvas && this.canvas.parentNode) {
    this.canvas.parentNode.removeChild(this.canvas);
  }
  this.gl = null;
};
