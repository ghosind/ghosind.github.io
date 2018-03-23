MathJax.Hub.Config({
  showMathMenu: false,
  messageStyle: "none",
  jax: ["input/TeX","output/CommonHTML"],
  extensions: ["tex2jax.js","MathMenu.js","MathZoom.js", "AssistiveMML.js", "a11y/accessibility-menu.js"],
  TeX: {
    extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"]
  },
  tex2jax: {inlineMath: [['\$','\$'], ['\\(','\\)']], 
    displayMath: [ ['\$\$','\$\$'], ['\\[','\\]'] ]}
});

MathJax.Ajax.loadComplete("/assets/script/mathjax_config.js");