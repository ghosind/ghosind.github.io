---
layout: post
title: Google编程规范之HTML
date: 2018-04-21
categories: [编程规范]
tags: [编程规范]
excerpt: 翻译HTML谷歌编程规范
---

## 前言

最近要优化一下[Jekyll Paper](https://github.com/ghosind/Jekyll-Paper)的代码，于是就翻阅了一下Google HTML/CSS Style Guide，发现Guide又更新了，于是决定开个坑简单翻译一下最新版本。原文HTML与CSS在同一页面中，在这里为了翻译的方便，分成了两篇独立的文章。Google的编程规范并不一定适用于所有的项目中，但具有一定的参考价值。

## 通用规则

### 通用样式规则

#### 协议

尽可能地使用HTTPS协议来嵌入资源。对于图片及其它媒体文件、样式表以及脚本，除非该文件不支持HTTPS协议，否则请使用HTTPS协议（`https:`）。在以前的版本中是推荐省略协议，随着安全重要性的提高，现在已经推荐使用HTTPS而非HTTP了。

```html
<!-- 不推荐：省略协议 -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
<!-- 不推荐：使用HTTP协议 -->
<script src="http://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
<!-- 推荐 -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
```

```scss
/* 不推荐：省略协议 */
@import '//fonts.googleapis.com/css?family=Open+Sans';
/* 不推荐：使用HTTP协议 */
@import 'http://fonts.googleapis.com/css?family=Open+Sans';
/* 推荐 */
@import 'https://fonts.googleapis.com/css?family=Open+Sans';
```

### 通过格式规则

#### 缩进

一次缩减两个空格，不混合使用tab与空格作为缩进。

```html
<ul>
  <li>Fantastic
  <li>Great
</ul>
```

```css
.example {
  color: blue;
}
```

#### 大小写

只使用小写。使用小写字母编写所有的代码：包括HTML元素名称、属性、属性值（除`text/CDATA`外），CSS选择器、属性以及属性值（字符串除外）。

```html
<!-- 不推荐 -->
<A HREF="/">Home</A>
<!-- 推荐 -->
<img src="google.png" alt="Google">
```

```css
/* 不推荐 */
color: #E5E5E5;
/* 推荐 */
color: #e5e5e5;
```

#### 行尾空格

删除行尾的空格，行尾的空格是不需要的，并且会使diff变复杂。

```html
<!-- 不推荐 -->
<p>What?_
<!-- 推荐 -->
<p>Yes please.
```

### 通用元规则

#### 编码

使用UTF-8无BOM编码格式。确保你的编辑器使用UTF-8无BOM编码格式作为字符编码格式。在HTML模板及文档中通过`<meta charset="utf-8">`指定编码格式。不需要为样式表指定编码格式，它们已经默认采用了UTF-8。

更多关于编码以及何时何情况去指定它们，可以参考[Handling character encodings in HTML and CSS](https://www.w3.org/International/tutorials/tutorial-char-enc/)。

#### 注释

尽可能为代码添加注释。使用注释去解释代码：它们做了什么，它的用途是什么，为什么是可行的解决方式。

（此项为可选项，实际上并非总是需要完整的注释。根据项目的复杂度，HTML与CSS代码可能会有很大的变化。）

#### 活动项

为待办事项及活动项标记上`TODO`。仅通过`TODO`关键字来标记待办事项，而不是其他格式，如`@@`。在`TODO(contatc)`格式的括号中添加联系人信息（如用户名或邮箱）。在`TODO:`的冒号后添加待办的具体事项。

```html
{# TODO(john.doe): revisit centering #}
<center>Test</center>
<!-- TODO: remove optional tags -->
<ul>
  <li>Apples</li>
  <li>Oranges</li>
</ul>
```

## HTML

### HTML样式规则

#### 文档类型

使用HTML5。

对于所有的HTML文档，HTML5都是首选，使用`<!DOCTYPE html>`将文档标记为HTML5。

（建议使用HTML而非XHTML。XHTML缺乏浏览器以及底层的支持，可优化的空间小于HTML。）

尽管使用HTML，但请别关闭空元素，例如使用`<br>`而非`<br />`。

#### HTML验证

尽可能使用有效的HTML。

使用有效的HTML代码除非由于文件大小限制等原因导致无法实现。使用如[W3C HTML validator](https://validator.w3.org/nu/)等工具验证。使用有效的HTML是一个可衡量的质量基线，它有助于了解一些技术要求以及限制，并确保正确的使用HTML。

```html
<!-- 不推荐 -->
<title>Test</title>
<article>This is only a test.
<!-- 推荐 -->
<!DOCTYPE html>
<meta charset="utf-8">
<title>Test</title>
<article>This is only a test.</article>
```

#### 语义

根据元素的意义使用HTML。

按元素（有时候被错误的称之为标签）被创建时所赋予的含义使用它们。例如使用为标题使用标题元素，为段落使用`p`元素，链接使用`a`元素等。
根据元素的意义编写HTML对于可读性，复用性及效率都非常重要。

```html
<!-- 不推荐 -->
<div onclick="goToRecommendations();">All recommendations</div>
<!-- 推荐 -->
<a href="recommendations/">All recommendations</a>
```

#### 后备多媒体元素

为多媒体元素提供替代的内容。

确保为例如图片、视频、动画等多媒体元素提供替代的使用方式。例如为图片提供相同含义的代替文本，以及为音频视频提供记录或字幕。提供替代内容对于可用性有很大的帮助：盲人无法知道没有`alt`属性的图像是什么内容，其他人也可能无法理解视频与音频的内容。

（`alt`属性会引入冗余内容，对于一些装饰性的图像，如果不能使用CSS代替，请不要使用`alt`属性。）

```html
<!-- 不推荐 -->
<img src="spreadsheet.png">
<!-- 推荐 -->
<img src="spreadsheet.png" alt="Spreadsheet screenshot.">
```

#### 关注点分离

根据实现不同功能分离结构。

严格保持结构、样式以及脚本的分离，并保证它们之间相互影响最小。
即确保文档和模板只有HTML，将所有与表现有关的内容移至样式表中，以及所以与行为有关的内容移至脚本中。
另外，保持在文档中尽可能少的链接样式表与脚本。
为了更好的维护，将结构、样式以及脚本分离是非常重要的。更改文档的结构通常比更改样式与脚本要付出更大的代价。

```html
<!-- 不推荐 -->
<!DOCTYPE html>
<title>HTML sucks</title>
<link rel="stylesheet" href="base.css" media="screen">
<link rel="stylesheet" href="grid.css" media="screen">
<link rel="stylesheet" href="print.css" media="print">
<h1 style="font-size: 1em;">HTML sucks</h1>
<p>I’ve read about this on a few sites but now I’m sure:
  <u>HTML is stupid!!1</u>
<center>I can’t believe there’s no way to control the styling of
  my website without doing everything all over again!</center>
<!-- 推荐 -->
<!DOCTYPE html>
<title>My first CSS-only redesign</title>
<link rel="stylesheet" href="default.css">
<h1>My first CSS-only redesign</h1>
<p>I’ve read about this on a few sites but today I’m actually
  doing it: separating concerns and avoiding anything in the HTML of
  my website that is presentational.
<p>It’s awesome!
```

#### 实体引用

请不要使用实体引用。

使用UTF-8等编码时并不需要使用类似于`&mdash;`、`&rdquo;`、`&#x263a;`等实体引用。唯一一个例外是HTML中含有特殊意义的字符，如`<`、`&`或不可见字符。

```html
<!-- 不推荐 -->
The currency symbol for the Euro is &ldquo;&eur;&rdquo;.
<!-- 推荐 -->
The currency symbol for the Euro is “€”.
```

#### 可选标签

忽略可选标签（可选）。

为了优化文件的大小，一些标签是可以选择省略的。HTML5标准定义了哪些标签是可以被省略的。

（此项与具体采用的HTML编码标准相关，若选择忽略可选标签，尽量忽略所有可选标签，避免不统一造成的代码混乱。）

```html
<!-- 不推荐 -->
<!DOCTYPE html>
<html>
  <head>
    <title>Spending money, spending bytes</title>
  </head>
  <body>
    <p>Sic.</p>
  </body>
</html>
<!-- 推荐 -->
<!DOCTYPE html>
<title>Saving money, saving bytes</title>
<p>Qed.
```

#### type属性

忽略样式表及脚本的type属性。

除非不是使用CSS或JavaScript，否则请不要使用type属性。
为这些内容声明type属性在HTML5中是不必要的，默认已经视为`text/css`或`text/javascript`。在旧的浏览器中也能这样正常的使用。

```html
<!-- 不推荐 -->
<link rel="stylesheet" href="https://www.google.com/css/maia.css"
  type="text/css">
<!-- 推荐 -->
<link rel="stylesheet" href="https://www.google.com/css/maia.css">
<!-- 不推荐 -->
<script src="https://www.google.com/js/gweb/analytics/autotrack.js"
  type="text/javascript"></script>
<!-- 推荐 -->
<script src="https://www.google.com/js/gweb/analytics/autotrack.js"></script>
```

### HTML格式规则

#### 一般规则

每个元素都使用独立的一行，包括块、列表、表格以及各子元素。
如果是块、列表或者表格的子元素，请使用缩进已达到更好的可读性。

（在一些情况下可以选择写在同一行中。在具体的编码过程中，我们更倾向于警告而不是错误。）

```html
<blockquote>
  <p><em>Space</em>, the final frontier.</p>
</blockquote>
<ul>
  <li>Moe
  <li>Larry
  <li>Curly
</ul>
<table>
  <thead>
    <tr>
      <th scope="col">Income
      <th scope="col">Taxes
  <tbody>
    <tr>
      <td>$ 5.00
      <td>$ 4.50
</table>
```

#### HTML行包装

为长度过长的行换行（可选）。

尽管HTML标准没有列数的限制，但为了更好的可读性，尽量使用换行。
当使用换行时，每一个连续的行需要使用相对于原行至少四个额外的空格缩进。

```html
<md-progress-circular md-mode="indeterminate" class="md-accent"
    ng-show="ctrl.loading" md-diameter="35">
</md-progress-circular>
<md-progress-circular
    md-mode="indeterminate"
    class="md-accent"
    ng-show="ctrl.loading"
    md-diameter="35">
</md-progress-circular>
<md-progress-circular md-mode="indeterminate"
                      class="md-accent"
                      ng-show="ctrl.loading"
                      md-diameter="35">
</md-progress-circular>
```

#### HTML中引号的使用

当需要使用引号来包括属性值时，请使用双引号而非单引号包括。

```html
<!-- 不推荐 -->
<a class='maia-button maia-button-secondary'>Sign in</a>
<!-- 推荐 -->
<a class="maia-button maia-button-secondary">Sign in</a>
```

## 原文

[Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)