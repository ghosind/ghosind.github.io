---
layout: page
title: JWT decoder
permalink: /tools/jwt-decoder
---

<link rel="stylesheet" type="text/css" href="{{ site.baseurl }}/assets/css/jwt-decoder.css" />
<div class='decoder'>
  <label for='token'>JWT Token: </label>
  <input type='text' id='token' />
  <button id='decode'>Decode</button>
  <div id='token-header'></div>
  <div id='token-payload'></div>
  <div id='error-message'></div>
</div>

<script src='{{ site.baseurl }}/assets/script/jwt-decoder.js'></script>
