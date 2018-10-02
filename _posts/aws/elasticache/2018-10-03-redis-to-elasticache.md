---
layout: post
title: EC2中Redis迁移至ElastiCache记录
date: 2018-10-03
categories: AWS
tags: [AWS, Redis, ElastiCache]
excerpt: 记录将EC2中的Redis服务迁移至ElastiCache中的过程。
---

## 背景介绍

公司后端服务部署于AWS EC2之上，服务与Redis分别置于同一服务器的两个Docker容器中。 为避免因服务器故障造成Redis上的数据丢失，决定将其迁至ElastiCache中。

## 备份Redis

因为Redis是在Docker容器中，进行备份前需要进入到对应的容器中。使用`docker ps`命令可以获得当前正常运行的所有容器的信息，从中可以找到需要备份的Redis容器的容器ID，如下述示例中的231ba129ef79。获得Docker容器ID后，便可使用`docker exec -it <cid> /bin/bash`命令进入该容器。

```bash
$ docker ps
CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS              PORTS                    NAMES
231ba129ef79        redis:4                     "redis"   3 weeks ago         Up 3 hours          0.0.0.0:6379->6379/tcp   service-redis

$ docker exec -it 231ba129ef79 /bin/bash
```

进入Docker容器后，便可通过reids-cli连接到本地Redis服务器中，并使用`save/bgsave`命令进行备份操作。Redis中`save/bgsave`命令的都可备份数据，两者的区别为`save`需要阻塞Redis主进程知道数据保存完成，其间不响应任何客户端的操作；而`bgsave`命令将会创建一个子进程进行数据保存的操作，在允许`bgsave`的期间服务器扔可继续处理客户端的请求。

```bash
root@231ba129ef79：/data# redis-cli
127.0.0.1:6379> bgsave
127.0.0.1:6379> exit
root@231ba129ef79：/data# ls
dump.rdb
```

在运行完`save/bgsave`命令后，默认情况下将在容器中的/data目录下生存一个名为dump.rdb的文件。

## 获取备份文件

至此，已经完成了Redis备份的操作，但保存后的dump.rdb文件扔存放与Docker容器中，需要手动从中复制/移动出Docker容器。首先需要退出Docker容器到服务器中，再使用`docker cp <cid>:<src_path> <dest_path>`命令复制到服务器中。

```bash
root@231ba129ef79：/data# exit
$ docker cp 231ba129ef79:/data/dump.rdb .
```

上述语句的作用为将ID为231ba129ef79的Docker容器中的/data/dump.rdb文件复制至服务器中的当前目录下。为了能使用创建的备份文件，需要使用`aws s3 cp`命令将其上传至S3中。使用Amazon Linux系统映像的实例中默认已经安装有aws-cli，可直接使用`aws s3 cp`命令，而使用其他类型系统映像的实例可能需要先使用`pip install awscli`安装aws-cli后才可使用。

```bash
$ aws s3 cp dump.rdb s3://redis-dump/dump.rdb
```

将备份文件上传至S3后，需为该文件授予ElastiCache的权限。在S3中选择上传的备份文件，进入该文件的详细页面后选择`权限`选项卡，若`aws-scs-s3-readonly`或下述对应的规范ID未列出，需点击`其他AWS账户的访问权限`添加对应的ID及授予`读取对象`与`读取对象权限`权限。

- 中国北京与中国宁夏区域：`b14d6a125bdf69854ed8ef2e71d8a20b7c490f252229b806e514966e490b8d83`
- AWS GovCloud (US)区域：`40fa568277ad703bd160f66ae4f83fc9dfdfd06c2f1b5060ca22442ac3ef8be6`
- 所有其他区域：`540804c33a284a299d2547575ce1010f2312ef3da9b3a053c8bc45bf233e4353`

![dump.rdb权限](/assets/images/aws/elasticache/2018-10-03-redis-to-elasticache/permission.png)

## 创建ElastiCache Redis实例

进入ElastiCache控制面板，在左侧选择Redis后点击创建进行创建。创建过程中需要在`将数据导入集群`下的`为 RDB 文件 S3 位置做种子`填写备份文件的路径，格式为`存储桶名称/文件夹（可省略）/文件名`，例如上节中设置的，可填写为`redis-dump/dump.rdb`。在完成设置后点击创建即可创建Redis实例，此过程大约需要数分钟或更长的时间。在Redis实例创建完成后，即可得到该实例的终端节点。

在创建ElastiCache前，需要确认VPC设置，确保ElastiCache能访问S3中的资源。并在创建完成后，需要确认安全组设置是否允许Redis对应端口入站。

## 使用ElastiCache优点与缺点

使用ElastiCache可将Redis从服务中分开，在无专门的Redis服务器的情况下避免因为服务器原因造成数据的丢失，但使用ElastiCache将会产生额外的费用。此操作过程需要需要较长的时间，为了避免Redis与ElastiCache中的数据不一致，可能需要在此期间停止服务。

## 结束语

本文介绍了从Redis迁移至ElastiCache一种方法，由于时间过长且需要暂停服务，整个流程还有许多有待于优化的地方，也存在着一定的风险。
