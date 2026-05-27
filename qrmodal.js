// ===== 二维码弹窗（独立文件，Date.now() 强制最新） =====
(function(){
  // 如果已经执行过则跳过
  if (window.__QR_MODAL_LOADED__) return;
  window.__QR_MODAL_LOADED__ = true;

  // base64 转 blob
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

  // 创建弹窗 DOM（大尺寸、不裁剪）
  var overlay = document.createElement('div');
  overlay.id = 'qrModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.8);display:none;align-items:center;justify-content:center;padding:20px;';
  overlay.onclick = function() { closeQRModal(); };

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.3);width:100%;max-width:340px" onclick="event.stopPropagation()">' +
      '<div style="padding:20px">' +
        '<div style="width:100%;overflow:hidden;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center">' +
          '<img id="qrModalImage" src="" alt="二维码" style="display:block;width:100%;height:auto;max-height:75vh">' +
        '</div>' +
        '<p style="text-align:center;font-size:15px;color:#4b5563;margin-top:16px;font-weight:500">长按或截图保存二维码</p>' +
        '<p style="text-align:center;font-size:13px;color:#9ca3af;margin-top:4px">打开微信扫一扫识别</p>' +
      '</div>' +
      '<button id="qrModalCloseBtn" style="display:block;width:100%;padding:14px;color:#6b7280;font-size:14px;border:none;border-top:1px solid #f3f4f6;background:#fff;cursor:pointer;text-align:center">关 闭</button>' +
    '</div>';

  document.body.appendChild(overlay);

  document.getElementById('qrModalCloseBtn').onclick = function() { closeQRModal(); };

  // ===== 全局函数 =====
  window.showQRModal = function(imgId) {
    var img = document.getElementById(imgId);
    if (!img || !img.src) return;
    var modalImg = document.getElementById('qrModalImage');
    if (img.src.indexOf('data:') === 0) {
      var blob = dataURLToBlob(img.src);
      if (blob) modalImg.src = URL.createObjectURL(blob);
      else modalImg.src = img.src;
    } else {
      modalImg.src = img.src;
    }
    overlay.style.display = 'flex';
  };

  window.closeQRModal = function() {
    overlay.style.display = 'none';
    var modalImg = document.getElementById('qrModalImage');
    if (modalImg.src && modalImg.src.indexOf('blob:') === 0) {
      URL.revokeObjectURL(modalImg.src);
    }
  };

  // 处理队列中积压的调用（防止竞态）
  var queue = window.__qrModalQueue || [];
  while (queue.length) {
    var args = queue.shift();
    if (args[0] === 'show') window.showQRModal(args[1]);
    else if (args[0] === 'close') window.closeQRModal();
  }
})();
