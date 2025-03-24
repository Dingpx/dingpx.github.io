---
layout: default
title: 地图页面
---

<div id="map" style="height: 100vh; width: 100%;"></div>

<script>
  // 初始化地图
  const map = L.map('map').setView([0, 0], 2); // 设置初始视图（全球视图）

  // 添加 OpenStreetMap 图层
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 添加一个示例标记
  const marker = L.marker([51.505, -0.09]).addTo(map);
  marker.bindPopup('<b>这里是伦敦!</b>').openPopup();
</script>