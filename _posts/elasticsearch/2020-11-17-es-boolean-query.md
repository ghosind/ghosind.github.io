---
layout: post
title: Elasticsearch布尔查询及其组合查询
date: 2020-11-17
categories: [Elasticsearch]
tags: [Elasticsearch, Boolean Query, 布尔查询]
excerpt: 本文中将简单地介绍Elasticsearch中的布尔查询以及使用其进行组合查询，并以其等同的SQL语句的方式帮助理解DSL所表达的含义。
---

## 布尔查询

Elasticsearch支持类似于在SQL中使用`AND`、`OR`以及`NOT`的运算（在MySQL中仅支持部分语句使用`NOT`运算符，例如`IN`运算等，在这里我们也可以理解为使用相反的运算符），称之为布尔查询（Boolean Query）。Elasticsearch支持的布尔逻辑类型包括有以下几种：

- `must`：文档必须符合其中所有的查询条件，包含多个条件时类似于SQL中的`AND`。
- `should`：文档必须符合其中任意一个及以上查询条件（可由`minimum_should_match`指定需要满足的条件数量），包含多个条件时类似于SQL中的`OR`。
- `must_not`：文档必须不符合其中所有的查询条件，类似于SQL中的`NOT`，且返回的结果的分值都为`0`。
- `filter`：效果与使用`must`相同，但不影响查询结果的分值（score）。

在使用布尔查询时，需要将查询的条件写在`bool`查询语句中，且同个`bool`查询语句可以有多个不同的条件。

```json
{
  "query": {
    "bool": {
      "must": {
        "term": {
          "age": 20
        }
      },
      "must_not": {
        "term": {
          "gender": "male"
        }
      }
    }
  }
}
```

例如该查询运行后，将返回`age`的值为`20`且`gender`的值不为`"male"`的文档。

下面，我们将介绍上述各个类型查询语句在DSL（Domain Specific Language，即Elasticsearch使用的结构化查询语言）的用法。

### `must`查询

当使用`must`查询时，文档必须符合其中包括的所有查询条件。当`must`查询只包括一个查询条件时，可在DSL中使用JSON对象的形式表示，例如以下示例：

```json
{
  "query": {
    "bool": {
      "must": {
        "term": {
          "age": 20
        }
      }
    }
  }
}
```

该查询等同于下面对应的SQL语句：

```sql
SELECT * FROM xxx WHERE age = 20;
```

使用`must`时可以同时指定多个查询条件，在DSL中它以数组的形式表示，效果类似于SQL中的`AND`运算。例如下面的例子：

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "age": 20 } },
        { "term": { "gender": "male" } }
      ]
    }
  }
}
```

该查询等同于下面的SQL语句：

```sql
SELECT * FROM xxx WHERE age = 20 AND gender = "male";
```

### `filter`查询

使用`filter`查询时其效果等同于`must`查询，但不同于`must`查询的是，`filter`查询不参与查询结果的分值计算，它返回的文档的分值始终为0。`filter`的使用场景适合于过滤不需要的文档，但又不影响最终计算的得分。

例如下面的查询中，将返回所有`status`的值为`"active"`的文档，其得分均为`0.0`。

```json
{
  "query": {
    "bool": {
      "filter": {
        "term": {
          "status": "active"
        }
      }
    }
  }
}
```

### `should`查询

`should`查询类似于SQL中的`OR`语句，当其中包括两个及两个以上的条件时，其查询的结果必须至少满足其中一个。当只有一个查询条件时，即结果必须满足该条件。

```json
{
  "query": {
    "bool": {
      "should": [
        { "term": { "age": 20 } },
        { "term": { "gender": "male" } },
        { "range": { "height": { "gte": 170 } } },
      ]
    }
  }
}
```

该查询等同于下面对应的SQL语句：

```sql
SELECT * FROM xxx WHERE age = 20 OR gender = "male" or height >= 170;
```

`should`查询与SQL中的`OR`运算较为不同的一点是，`should`查询可以使用`minimum_should_match`参数指定至少需要满足几个条件。例如下面的例子中，查询的结果需要满足两个或两个以上的查询条件：

```json
{
  "query": {
    "bool": {
      "should": [
        { "term": { "age": 20 } },
        { "term": { "gender": "male" } },
        { "term": { "height": 170 } },
      ],
      "minimum_should_match": 2
    }
  }
}
```

在同一个`bool`语句中若不存在`must`或`filter`时，`minimum_should_match`默认的值为1，即至少要满足其中一个条件；但若有其它`must`或`filter`存在时，`minimum_should_match`默认值为0。例如下面的查询，所有返回的文档`age`值必定为20，但其中可能包括有`status`值不为`"active"`的文档。若需要二者同时生效，可入上面例子中一样在`bool`查询中增加一个参数`"minimum_should_match": 1`。

```json
{
  "query": {
    "bool": {
      "must": {
        "term": {
          "age": 20
        },
      },
      "should": {
        "term": {
          "status": "active"
        }
      }
    }
  }
}
```

### `must_not`查询

`must_not`查询类似于SQL语句中的`NOT`运算，它将只返回不满足指定条件的文档。例如：

```json
{
  "query": {
    "bool": {
      "must_not": [
        { "term": { "age": 20 } },
        { "term": { "gender": "male" } }
      ]
    }
  }
}
```

该查询等同于下面的SQL查询语句（由于MySQL不支持下面语句使用NOT，于是改写为使用`!=`实现）：

```sql
SELECT * FROM xxx WHERE age != 20 AND gender != "male";
```

另外，`must_not`与`filter`相同，采用过滤器执行而不需要计算文档的得分，所以返回的结果对应的分值为0。

## 布尔组合查询

在上面的[示例](#布尔查询)（本文第一个示例代码）中，我们提到过同一个`bool`下可以存在多个不同的查询条件，如该查询等同于下面的SQL语句：

```sql
SELECT * FROM xxx WHERE age = 20 AND gender != "male";
```

另外，我们也可以在各个查询中进行嵌套查询。但需要注意的是，布尔查询必须包含在`bool`查询语句中，所以在嵌套查询中必须在内部再次使用`bool`查询语句。

```json
{
  "query": {
    "must": [
      {
        "bool": {
          "should": [
            { "term": { "age": 20 } },
            { "term": { "age": 25 } }
          ]
        }
      },
      {
        "range": {
          "level": {
            "gte": 3
          }
        }
      }
    ]
  }
}
```

该查询语句等同于以下SQL语句：

```sql
SELECT * FROM xxx WHERE (age = 20 OR age = 25) AND level >= 3;
```

## 结束语

在本文中，我们简单地介绍了一下Elasticsearch中的布尔查询以及其组合查询。对于Elasticsearch的更多使用，可以参考官方提供的[Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)以及其它文章、书籍。

## 参考资料

- [Boolean query - Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html)
- Rafal Kuc, Marek Rogozinski. *Mastering Elasticsearch, second edition*.
