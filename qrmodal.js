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
          '<img id="qrModalImage" src="" alt="二维码" style="display:block;width:100%;height:auto;max-height:75vh">' +
        '</div>' +
        '<p style="text-align:center;font-size:15px;color:#4b5563;margin-top:16px;font-weight:500">长按或截图保存二维码</p>' +
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
      return;
    }
    // HTTP URL：等图片加载完再显示，确保长按时图片已渲染
    if (modalImg.src === img.src && modalImg.complete) {
      overlay.style.display = 'flex';
      return;
    }
    modalImg.onload = function() {
      overlay.style.display = 'flex';
      modalImg.onload = null;
      modalImg.onerror = null;
    };
    modalImg.onerror = function() {
      overlay.style.display = 'flex';
      modalImg.onerror = null;
    };
    modalImg.src = img.src;
  };

  window.closeQRModal = function() {
    overlay.style.display = 'none';
    var modalImg = document.getElementById('qrModalImage');
    if (modalImg && modalImg.src && modalImg.src.indexOf('blob:') === 0) {
      URL.revokeObjectURL(modalImg.src);
    }
  };
})();
