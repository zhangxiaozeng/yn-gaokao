// ===== 二维码弹窗增强（独立文件，Date.now() 强制最新） =====
(function(){
  if (window.__QR_MODAL_LOADED__) return;
  window.__QR_MODAL_LOADED__ = true;

  function dataURLToBlob(dataUrl) {
    try {
      var parts = dataUrl.split(',');
      var mime = parts[0].match(/:(.*?);/)[1];
      var bstr = atob(parts[1]);
      var n = bstr.length;
      var u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    } catch(e) { return null; }
  }

  // 如果页面上已经有弹窗（内联fallback），直接用；否则新建
  var overlay = document.getElementById('qrModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'qrModalOverlay';
    overlay.onclick = function() { window.closeQRModal(); };
    document.body.appendChild(overlay);
  }

  // 确保弹窗样式是最新的（内联样式覆盖所有 CSS 影响）
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);-webkit-backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px';
  overlay.onclick = function() { window.closeQRModal(); };

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);width:100%;max-width:340px" onclick="event.stopPropagation()">' +
      '<div style="padding:16px">' +
        '<div style="width:100%;background:#fff;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center">' +
          '<img id="qrModalImage" src="" alt="二维码" style="display:block;width:100%;height:auto;max-height:90vh">' +
        '</div>' +
        '<div id="qrDirectAction" style="display:none;margin-top:12px;text-align:center">' +
          '<button onclick="var u=document.getElementById(\'qrDirectLink\').href;if(u&&u!=\'#\')location.href=u" style="display:block;width:100%;padding:12px;background:#07c160;color:#fff;border-radius:10px;font-size:15px;font-weight:600;border:none;cursor:pointer;box-sizing:border-box">' +
            '<i class="fab fa-weixin"></i> 直接加入群聊' +
          '</button>' +
          '<a id="qrDirectLink" href="#" style="display:none"></a>' +
          '<p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:6px">识别到企业微信群，点击一键直达</p>' +
        '</div>' +
        '<p style="text-align:center;font-size:15px;color:#4b5563;margin-top:12px;font-weight:500">长按或截图保存二维码</p>' +
        '<p style="text-align:center;font-size:13px;color:#9ca3af;margin-top:4px">打开微信扫一扫识别</p>' +
      '</div>' +
      '<button onclick="window.closeQRModal()" style="display:block;width:100%;padding:14px;color:#6b7280;font-size:14px;background:transparent;border:none;cursor:pointer;border-top:1px solid #f3f4f6">关 闭</button>' +
    '</div>';

  // 覆盖全局弹窗函数
  window.showQRModal = function(imgId) {
    var img = document.getElementById(imgId);
    if (!img || !img.src) return;
    var modalImg = document.getElementById('qrModalImage');
    if (!modalImg) return;
    if (img.src.indexOf('data:') === 0) {
      var blob = dataURLToBlob(img.src);
      modalImg.src = blob ? URL.createObjectURL(blob) : img.src;
      overlay.style.display = 'flex';
      setTimeout(function(){ tryDecodeQR(modalImg); }, 200);
      return;
    }
    // HTTP URL：等图片加载完再显示，确保长按时图片已渲染
    if (modalImg.src === img.src && modalImg.complete) {
      overlay.style.display = 'flex';
      setTimeout(function(){ tryDecodeQR(modalImg); }, 200);
      return;
    }
    modalImg.onload = function() {
      overlay.style.display = 'flex';
      tryDecodeQR(modalImg);
      modalImg.onload = null;
      modalImg.onerror = null;
    };
    modalImg.onerror = function() {
      overlay.style.display = 'flex';
      modalImg.onerror = null;
    };
    modalImg.src = img.src;
  };

  // ===== 二维码解码：提取图片中的链接，显示"直接加入群聊"按钮 =====
  function tryDecodeQR(imgEl) {
    var action = document.getElementById('qrDirectAction');
    var link = document.getElementById('qrDirectLink');
    if (!action || !link) return;
    action.style.display = 'none';
    link.href = '#';
    if (typeof jsQR !== 'function' || !imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight) return;
    var c = document.createElement('canvas');
    c.width = imgEl.naturalWidth;
    c.height = imgEl.naturalHeight;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    try {
      ctx.drawImage(imgEl, 0, 0);
      var d = ctx.getImageData(0, 0, c.width, c.height);
      var code = jsQR(d.data, d.width, d.height);
      if (code && code.data && code.data.indexOf('http') === 0) {
        link.href = code.data;
        action.style.display = 'block';
      }
    } catch(e) { /* CORS 或不支持时静默失败 */ }
  }

  window.closeQRModal = function() {
    overlay.style.display = 'none';
    var modalImg = document.getElementById('qrModalImage');
    if (modalImg && modalImg.src && modalImg.src.indexOf('blob:') === 0) {
      URL.revokeObjectURL(modalImg.src);
    }
  };
})();
