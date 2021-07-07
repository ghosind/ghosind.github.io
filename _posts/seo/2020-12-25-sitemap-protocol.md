---
layout: post
title: 网站SEO优化之sitemap协议
date: 2020-12-25
categories: [SEO]
tags: [SEO, Sitemap]
excerpt: 简单介绍帮助搜索引擎有效抓取网站页面的sitemap协议，sitemap文件实现以及使用sitemap索引文件实现大型网站的sitemap。
---

Sitemap协议用于告知搜索引擎该站点允许抓取的有效页面，在最简单的实现下，它是一个由页面URL及其附加属性（如修改时间，页面重要程度等）组成的XML文件。使用sitemap协议只能为搜索引擎抓取提供更好的支持，但并不能保证搜索引擎一定会按协议设置的数据抓取。另外，sitemap协议还允许例如RSS、纯文本等格式的形式，在本文中我们只使用XML格式。

Sitemap协议规定XML文件需要满足[实体转义](#实体转义)且以UTF-8作为编码，另外还需要满足以下条件：

- 必须以`<urlset>`开始并以`</urlset>`结束（XML文档声明除外），且必须声明协议标准（例如`http://www.sitemaps.org/schemas/sitemap/0.9`）；
- 每个URL使用一个`<url>`标签表示；
- 每个`<url>`标签中必须有一个`<loc>`子标签；
- sitemap文件最多只能支持50,000个链接且该文件大小必须保持在50MB以下（为了更快传输，sitemap支持使用gzip进行压缩）。

下面是一个简单的sitemap文件示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://www.example.com/</loc>
    <lastmod>2020-12-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... -->
</urlset>
```

## Sitemap协议标签说明

|    标签名    | 是否必须 | 说明                                                         |
| :----------: | :------: | :----------------------------------------------------------- |
|   `urlset`   |    是    | Sitemap的根元素。                                            |
|    `url`     |    是    | 表示URL的父节点，除`<urlset>`外其它标签都是`<url>`标签的子元素。 |
|    `loc`     |    是    | 表示页面的链接网址，需要以协议（例如`http`开头）并以`/`结尾，且整体长度需要小于2048个字符。 |
|  `lastmod`   |    否    | 以[W3C Datetime](https://www.w3.org/TR/NOTE-datetime)编码标准或`YYYY-MM-DD`格式表示的上次修改时间。 |
| `changefreq` |    否    | 表示页面内容改变的间隔，可以告知搜索引擎蜘蛛多久需要重新爬取内容（实际的时间间隔由搜索引擎决定）。 |
|  `priority`  |    否    | 表示该页面在网站中的优先程度，其值为`0.0`～`1.0`之间，未设置时默认为`0.5`，该值只影响本站点的页面，并不会影响搜索引擎展示结果中的位置。 |

对于`changefreq`，有以下几个允许的值：

- `always`
- `hourly`
- `daily`
- `weekly`
- `monthly`
- `yearly`
- `never`

其中，`always`表示每次访问该页面时内容都会改变，而`never`表示归档内容。

\* 谷歌的文档中提到，谷歌将忽略`<priority>`以及`<changefreq>`的值，如果站点只提交至谷歌可以忽略这两个标签。

> Google ignores `<priority>` and `<changefreq>` values, so don't bother adding them.

## 实体转义

对于在文件中除标签外出现的以下字符，需要对其进行转义才能正确的表示：

|   字符   |  转义后的表示方式   |
| :--: | :--: |
| `&` | `&amp;` |
| `'` | `&apos;` |
| `"` | `&quot;` |
| `>` | `&gt;` |
| `<` | `&lt;` |

对于所有的URL，需要满足[RFC-3986](http://www.ietf.org/rfc/rfc3986.txt)URI标准、[RFC-3987](http://www.ietf.org/rfc/rfc3987.txt)IRI标准以及[XML标准](http://www.w3.org/TR/REC-xml/)。对于URL中出现的非ASCII字符（例如中文字符），也需要对其进行转义，例如：

```txt
https://example.com/示例.html/
```

对于该URL，需要将其进行转义为以下形式：

```txt
https://example.com/%E7%A4%BA%E4%BE%8B.html/
```

## sitemap索引文件

对于单个sitemap文件，只支持最多50,000个网址，且其大小必须在50MB以内。如果站点包含的网址超过50,000个或其大小超过50MB，则需要创建多个sitemap文件且使用sitemap索引文件。

同样，sitemap索引文件也为满足实体转义的UTF-8编码XML文件，且满足以下条件：

- 以`<sitemapindex>`开始并以`</sitemapindex>`结束；
- 使用`<sitemap>`标签每个表示sitemap文件，且每个`<sitemap>`标签中必须包含有一个`<loc>`元素表示sitemap文件的位置；
- sitemap索引文件最多支持50,000个sitemap文件，且其大小必须保持在50MB以下。


| 标签名 | 是否必须 | 说明 |
| :----: | :------: | ---- |
| `<sitemapindex>` | 是 | sitemap索引文件的根元素。 |
|   `<sitemap>`    | 是 | 用于封装每个sitemap文件链接，是除`<sitemapindex>`以外其它元素的父元素。 |
| `<loc>` | 是 | sitemap文件的位置，可以是sitemap协议的XML文件，或是RSS、纯文本等格式，也可以是gzip压缩后的文件。 |
| `<lastmod>` | 否 | 满足W3C Datetime标准的修改时间。 |

同样，对于sitemap索引文件中的每个sitemap文件，也需要满足50,000个或以下的链接以及50MB以下的文件大小。

下面是一个简单的sitemap索引文件示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <sitemap>
      <loc>http://www.example.com/sitemap1.xml</loc>
      <lastmod>2020-10-01T00:00:00+00:00</lastmod>
   </sitemap>
   <sitemap>
      <loc>http://www.example.com/sitemap2.xml.gz</loc>
      <lastmod>2020-10-01T00:00:00+00:00</lastmod>
   </sitemap>
   <!-- ... -->
</sitemapindex>
```

## 多站点支持

Sitemap协议同样支持在通过sitemap文件中包括多个子域名或多个域名。若存在多个域名，可以通过使用单个sitemap文件或是区分多个sitemap实现。

例如，可以在单个sitemap文件中声明：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://host1.example.com/</loc>
  </url>
  <url>
    <loc>http://host2.example.com/</loc>
  </url>
  <url>
    <loc>http://host1.example1.com/</loc>
  </url>
</urlset>
```

但需要注意的是，通常搜索引擎只支持同个账户下已经认证的域名。例如对于谷歌，需要将域名都在Google Search Console中验证通过。

## 参考资料

- [Sitemap](https://www.sitemaps.org/index.html)

- [Build and submit a sitemap](https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap)
