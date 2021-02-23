---
layout: post
title: MySQL查看、修改字符集及Collation
date: 2018-10-12
categories: [MySQL]
tags: [MySQL, Charset, Collation]
excerpt: 查看并修改MySQL中的字符集及Collation。
---

## 前言

在使用MySQL的过程中，可能会出现初始设计使用的字符集或Collation不符合当前需求的情况。如使用utf8的表（MySQL中的utf8即utf8mb3）要支持emoji，而utf8mb3不支持emoji（emoji需要4个字节，而utf8mb3最长只支持3个字节），所以需要将字符集修改为utf8mb4。

Collation即排列字符集，每个字符集都有对应一个或多个排列字符集。如某列使用utf8mb4_unicode_ci，当需要使用emoji搜索的时候，因为utf8mb4_unicode_ci可替换字符的原因，就可能出现查找出错误数据的结果。

## 真实事例

在公司项目中有个需要生成唯一emoji序列的需求。开发过程中没发现问题，在测试的过程中出现了因为重复插入失败的情况，但是在插入前已经查询过数据库没有发现有重复。为确认是否是程序的问题，直接通过prisma插入一个不存在的序列，但是还是出现了插入失败的情况。查询了数据库中该表的结构，发现使用的字符集是utf8mb4，确认了是支持emoji的。在纠结了快半天的时间后，发现了该列的排列字符集为utf8mb4_unicode_ci，该排列字符集会认为一些特定的emoji是可替代的导致了这个问题，在将该列的Collation修改为utf8mb4_bin后解决了问题。

## 获取当前支持的全部字符集及Collation

MySQL提供了`SHOW CHARACTER SET`命令查看当前所有的字符集，同时也提供了`SHOW COLLATION`命令查看所以的Collation。同时，MySQL也提供了`SHOW CHARACTER SET LIKE 'charset_name'`和`SHOW COLLATION WHERE Charset = 'charset_name'`查看指定字符集和指定字符集的所有排列字符集的信息。

```sql
-- 查看所有字符集信息
SHOW CHARACTER SET;
-- 查看utf8字符集信息
SHOW CHARACTER SET LIKE 'utf8';

-- 查看所有排列字符集
SHOW COLLATION;
-- 查看utf8的所有排列字符集
SHOW COLLATION WHERE Charset = 'utf8';
```

在MySQL中，全部的字符集与排列字符集的信息都存放在`information_schema`库中。除上述方法外，还可进入`information_schema`库中查看`CHARACTER_SETS`与`COLLATIONS`表。

```sql
USE information_schema;
-- 查看所有字符集信息
SELECT * FROM CHARACTER_SETS;
-- 查看所有排列字符集信息
SELECT * FROM COLLATIONS;
```

在运行MySQL Server时，也可以使用`—-character-set-server=charset_name`及`—-collation-server=collation_name`参数指定服务器默认的字符集及Collation。

```bash
$ mysqld —-character-set-server=utf8mb4 —-collation-server=utf8mb4_bin
```

## 数据库级

### 查询全部数据库字符集

与上节中所说的字符集与排列字符集的信息都存放在`information_schema`库中相同，各个库、表、列的信息也都存放在其中。要查询所有库的信息，只需查询`information_schema`库中的`SCHEMATA`表即可得到。`SCHEMATA`表中包括了`CATALOG_NAME`、`SCHEMA_NAME`、`DEFAULT_CHARACTER_SET_NAME`、`DEFAULT_COLLATION_NAME`及`SQL_PATH`五个字段，其中`DEFAULT_CHARACTER_SET_NAME`与`DEFAULT_COLLATION_NAME`就是我们需要的字符集与排列字符集信息。

```sql
SELECT SCHEMA_NAME 'database', DEFAULT_CHARACTER_SET_NAME 'charset', DEFAULT_COLLATION_NAME 'collation' FROM information_schema.SCHEMATA;
```

### 查询并修改指定数据库的字符集及Collation

查询指定数据库时，可以在上节查询全部数据库的基础上增加`SCHEMA_NAME = 'database_name'`的条件即可。

```sql
SELECT DEFAULT_CHARACTER_SET_NAME 'charset', DEFAULT_COLLATION_NAME 'collation' FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'database_name';
```

除上述方法外，还可进入指定数据库后，查看`character_set_database`与`collation_database`两个变量分别查询该数据库的字符集与排列字符集。两种方式的区别为第一种可在任意数据库中查询所有库的信息，而第二种只能查询当前库。

```sql
USE database_name;
SHOW VARIABLES LIKE 'character_set_database';
SHOW VARIABLES LIKE 'collation_database';
```

对于库的操作除了查询外，还可修改该库的字符集与排列字符集。通过`ALTER DATABASE`语句就可以对数据库进行修改，修改时可以指定库的字符集，以及排列字符集。需要注意的是，修改库的字符集不带上COLLATE指定排列字符集，将会设置排列字符集为字符集的默认排列字符集。而直接使用COLLATE不指定字符集，会自动将字符集修改为排列字符集对应的字符集。

```sql
ALTER DATABASE database_name CHARACTER SET charset_name COLLATE collation_name;
```

## 数据库表级

### 查询全部表

MySQL提供了`SHOW TABLE STATUS`命令，可以查询数据库中表的全部信息。也可使用上文中的方法，直接在`information_schema`库中查询`TABLES`表。`TBALES`中包括了数据库服务器中所有的库的表信息，为了查询指定库的表信息，可通过`TABLE_SCHEMA`或`TABLE_NAME`字段进行库名筛选。

```sql
-- 直接查询information_schema中的数据
SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = database_name;
-- 在指定库中查询表的信息
USE database_name;
SHOW TABLE STATUS;
```

### 查询及修改指定表

数据库全部信息都存放于`information_schema`表中，可通过该表直接查询所有库、表、列的信息。但该库需要较高的安全性限制防止被恶意更改，下文中也将不继续介绍直接通过该库操作的方式。查询库中指定表的方式与查询全部表相同，只需添加对应的限制条件即可。

```sql
USE database_name;
SHOW TABLE STATUS WHERE NAME LIKE 'table_name';
```

修改表的字符集的方式与修改库相同，只需将修改库字符集的语句中的DATABASE修改为TABLE即可。

```sql
ALTER TABLE table_name CHARACTER SET charset_name COLLATE collation_name;
```

## 列级

### 全部列

在指定的库中，使用`SHOW FULL COLUMNS FROM table_name`语句即可查询表中所有列的信息。

```sql
USE database_name;
SHOW FULL COLUMNS FROM table_name;
```

### 指定列

为了查询指定列的信息，可以在上述语句中添加限制`Field`字段的条件。

```sql
SHOW FULL COLUMNS FROM table_name WHERE Field = column_name;
```

修改列信息的语句于上述两者略有不同，它需要在语句中指出修改的表的指定列。并且需要指定该列的类型，即使不对其进行修改。

```sql
ALTER TABLE table_name MODIFY column_name column_type CHARACTER SET charset_name COLLATE collation_name;
```

## 参考资料

1. [MySQL Reference Manual: Character Sets, Collations, Unicode](https://dev.mysql.com/doc/refman/8.0/en/charset.html)
2. [Stackoverflow](https://stackoverflow.com/questions/1049728/how-do-i-see-what-character-set-a-mysql-database-table-column-is)
