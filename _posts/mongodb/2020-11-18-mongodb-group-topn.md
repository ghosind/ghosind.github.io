---
layout: post
title: MongoDB查询分组并获取TopN数据
date: 2020-11-18
categories: [MongoDB]
tags: [MongoDB, group, TopN]
excerpt: 在MongoDB中使用$group、$project等运算符实现分组并获取各分组中Top N个元素。
---

分组并获取每个分组中Top N个数据的需求在实际开发的过程中经常会遇到。例如，购物网站中经常会遇到的展示一个店铺列表，每个店铺列表中带有多个该店铺的产品信息。当然，展示店铺列表并分别去获取店铺指定数量的产品是个最为简单的做法，但需要消耗大量的资源。

在本文中，我们将会以一个简单的例子展示在MongoDB中实现分组并获取Top N个数据的实现方法。

## 示例

首先，我们在MongoDB中有一个用户信息的数据集合`user`，它存有下面的几条数据。

```json
[
  { "name": "刘大", "age": 28, "status": "active" },
  { "name": "陈二", "age": 25, "status": "active" },
  { "name": "张三", "age": 25, "status": "active" },
  { "name": "李四", "age": 25, "status": "active" },
  { "name": "王五", "age": 23, "status": "active" },
  { "name": "赵六", "age": 23, "status": "active" },
  { "name": "孙七", "age": 23, "status": "inactive" },
  { "name": "周八", "age": 23, "status": "active" }
]
```

在以上数据的基础上，我们准备在每个年龄抽取前两个（以先添加的文档为准）状态为`active`的人，并以年龄从小到大的形式输出分组。

首先，我们使用`$match`运算符进行了筛选，去除了状态不为`active`的文档。根据上面的要求，我们需要按年龄从小到大的形式排序，即使`age`按升序的形式排序（升序在MongoDB中以`1`表示）。另外，为了实现每个分组都能取到最先添加的两个文档，我们也增加了基于`createdAt`的升序排序。`age`的排序也可以在`$group`后执行，但在这里我们直接与时间排序合并在一起执行。

在筛选并排序后，我们需要使用`$group`运算符根据指定的字段进行分组。根据要求，我们需要使用`age`作为分组的依据，所以在实现中我们将`_id`设置为`$age`。在分组中，我们希望获取到各分组中的数组，所以使用了`$push`运算，将各文档（使用`$$ROOT`代表根文档）保存到`products`中。完成分组后，每个分组中的`products`保存了该分组所有的文档，为了实现获取TopN个元素，我们需要在`$project`中使用`$slice`限制返回的文档个数。

```js
db.user.aggregate([
  {
    $match: {
      status: 'active',
    },
  },
  {
    $sort: {
      age: 1,
      createdAt: 1,
    },
  },
  {
    $group: {
      _id: '$age'
      persons: {
        $push: '$$ROOT',
      },
    },
  },
  {
    $project: {
      _id: 0,
      age: "$_id",
      persons: {
        $slice: [
          '$persons',
          2,
        ],
      },
    },
  },
]);
```

执行该查询，可以得到下面的返回结果：

```json
[{
  "age": 23,
  "persons": [
    { "name": "王五", "age": 23, "status": "active" },
    { "name": "赵六", "age": 23, "status": "active" }
  ]
}, {
  "age": 25,
  "persons": [
    { "name": "陈二", "age": 25, "status": "active" },
    { "name": "张三", "age": 25, "status": "active" }
  ]
}, {
  "age": 28,
  "persons": [
    { "name": "刘大", "age": 28, "status": "active" }
  ]
}]
```

## 不分组返回结果

上面的输出结果中仍保持着分组的形式，如果需要将结果转换为文档的数组，可以另外使用`$unwind`以及`$replaceRoot`运算符。例如下面的例子：

```json
db.user.aggregate([
  // $match, $sort, $group, $project
  {
    "$unwind": "$persons"
  },
  {
    "$replaceRoot": {
      "newRoot": "$persons"
    },
  },
])
```

该查询执行后得到的结果为：

```json
[
  { "name": "王五", "age": 23, "status": "active" },
  { "name": "赵六", "age": 23, "status": "active" },
  { "name": "陈二", "age": 25, "status": "active" },
  { "name": "张三", "age": 25, "status": "active" },
  { "name": "刘大", "age": 28, "status": "active" }
]
```

## 参考资料

- [Aggregation Pipeline Stages - MongoDB](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)
- [Mongodb: Select the top N rows from each group - StackOverflow](https://stackoverflow.com/a/41527265/2685733)
