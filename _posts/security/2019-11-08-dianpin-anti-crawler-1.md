---
layout: post
title: 大众点评反爬虫简单研究之一
date: 2019-11-08
categories: [安全]
tags: [大众点评, 反爬虫, 安全]
excerpt: 简单研究大众点评使用自定义字体实现反爬虫。
---

## 前言

前几天因为要和大学同学聚会，所以看了一下大众点评。在刷一家餐厅的点评时看到了一个厨师的名字，就好奇这是谁，然后就复制名字准备去搜一下。点评做了防复制，当然直接用浏览器开发者工具或者查看源代码可破。就在用浏览器开发者工具的时候，发现了部分字被替换成了`<svgmtsi>`标签，猜测是作为一种反爬虫的手段，就稍做研究了一下。

## 分析

通过Chrome开发者工具可以看到，部分字被替换成了类似于下列的代码：

```html
<svgmtsi class="review"></svgmtsi>
```

在审查元素中出现``，可以在网页源代码中看到对应的Unicode编码。

```html
<svgmtsi class="review">&#xe1ee;</svgmtsi>
```

或者，可以通过js转换成对应的十六进制（当然这不是必要的，只是顺便玩了一下- -）。

```js
''.charCodeAt(0).toString(16)
// e1ee
```

在开发者工具中可以看到`review`类使用了`PingFangSC-Regular-review`字体，且在对应的CSS文件内有该字体的定义，可以下载其woff文件。

```css
@font-face {
  font-family: 'PingFangSC-Regular-review';
  src: url('//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/4a0affb9.eot');
  src: url('//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/4a0affb9.eot?#iefix')
      format('embedded-opentype'),
    url('//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/4a0affb9.woff');
}

.review {
  font-family: 'PingFangSC-Regular-review';
}
```

将该woff文件转为svg格式后，可以看到其中有`e1ee`对应的字体定义。

```xml
<glyph glyph-name="unie1ee" unicode="&#xe1ee;" 
d="M404 644h-161q30 75 47 164l-72 10q-13 -90 -43 -174h-93v-711h70v86h182v-57h70v682zM152 86v219h182v-219h-182zM152 370v206h182v-206h-182zM578 412l-58 -36q104 -123 165 -222l57 40q-56 93 -164 218zM921 643h-319q27 78 44 167l-71 9q-38 -213 -143 -360l43 -57
q58 77 100 171h275q-3 -432 -12 -517q-12 -77 -82 -77q-46 0 -109 3l17 -66l102 -4q126 1 140 115q15 118 15 616z" />
```

除了使用字体库外，发现大众点评每次请求的页面中被替换的字也不相同，而且不同的时间点请求到的字体文件也不同（未确认）。

## 结束语

本文只是对使用大众点评使用字体库作为防爬虫方法作了初步的分析，以后有机会的话可能继续对其进行深入的研究。由于不是因为爬虫的用途，所以文中也混入了一些奇怪的东西- -。

因为不是专门搞爬虫的，所以暂时也就没有深入想如何去想如何去解决爬取该数据的问题。因为每个字对应的unicode都是相同的，可以先下载woff文件整理出unicode对应的字。当爬虫遇到`<svgmtsi>`标签时，就可以使用其中的unicode去查找对应的字。
