---
layout: post
title: Mongoose错误信息'xxx may not be used as a schema pathname'原因及其解决方式
date: 2020-08-06
categories: [MongoDB]
tags: [MongoDB, Mongoose]
excerpt: Mongoose错误信息'xxx may not be used as a schema pathname'的出错原因以及解决方式。
---

公司的后端服务采用了MongoDB + Mongoose的设计，今天的一个需求中需要标记某些文档是否被人工修改，于是便在其schema中加入了一个名为`isModified`字段。

```js
const schema = {
  // ...
  isModified: {
    type: Boolean,
    required: false,
    default: false,
  },
  // ...
}
```

在添加后运行程序出现了下述错误信息：

```
Error: `isModified` may not be used as a schema pathname
    at Schema.path (.../node_modules/mongoose/lib/schema.js:644:11)
    at Schema.add (.../node_modules/mongoose/lib/schema.js:519:14)
    at new Schema (.../node_modules/mongoose/lib/schema.js:130:10)
    ...
```

这个错误比较少见，国内网站上也基本上没有对于该问题的具体解答，只是说到将错误的字段名改为其它名称。

造成该错误的原因为schema定义的属性中包含了Mongoose保留的关键词。从Mongoose的源码中可以很清楚的看到该错误的原因：

```js
// some path names conflict with document methods
const firstPieceOfPath = path.split('.')[0];
if (reserved[firstPieceOfPath]) {
  throw new Error('`' + firstPieceOfPath + '` may not be used as a schema pathname');
}
```

因此，只要在schema设计时避免使用Mongoose保留的关键词即可，具体的Mongoose保留关键词如下节所示。

## 关键词列表

Mongoose 5.x中保留的关键词如下（以字母顺序排列）：

- `_posts`
- `_pres`
- `collection`
- `emit`
- `errors`
- `get`
- `init`
- `isModified`
- `isNew`
- `listeners`
- `modelName`
- `on`
- `once`
- `populated`
- `prototype`
- `remove`
- `removeListener`
- `save`
- `schema`
- `toObject`
- `validate`

若使用的是Mongoose 4.x及之前的版本，其schema保留的关键词与5.x有一些差异，具体的保留关键词如下：

- `_events`
- `_posts`
- `_pres`
- `collections`
- `db`
- `emit`
- `errors`
- `get`
- `init`
- `isNew`
- `modelName`
- `on`
- `options`
- `set`
- `schema`
- `toObject`

## 参考资料

- [Schema.reserved - Mongoose Docs](https://mongoosejs.com/docs/api/schema.html#schema_Schema.reserved)
- [Schema.reserved - Mongoose 4.x Docs](https://mongoosejs.com/docs/4.x/docs/api.html#schema_Schema.reserved)
- [Strange Mongoose schema.js error - StackOverflow](https://stackoverflow.com/questions/24130600/strange-mongoose-schema-js-error-options-may-not-be-used-as-a-schema-pathnam)
