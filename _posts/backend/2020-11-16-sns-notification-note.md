---
layout: post
title: 服务端通过AWS SNS创建消息推送记录
date: 2020-11-16
categories: [后端开发]
tags: [消息推送, AWS SNS, APNs, FCM]
excerpt: 记录Node.js通过AWS SNS实现iOS与Android端消息推送，并介绍APNs与GCM的消息格式，以及实现过程中遇到的一些问题。
---

本文主要记录APNs、FCM消息推送的格式以及后端服务集成消息推送时遇到的一些问题，使用的环境为Node.js + AWS SNS。

AWS SNS是一个AWS的消息管理服务，本文中我们主要通过其创建多平台的消息推送。我们可以通过SNS对多个平台发送消息，如APNs（iOS）、FCM（Android）等。文中的消息推送可以简单地通过以下Node.js代码实现（Typescript）。

```typescript
import { SNS } from 'aws-sdk';

const sns = new SNS({
  accessKeyId: '***',
  secretAccessKey: '***',
  region: '***',
});

const params = {
  // 发送消息提醒到topic则需要填写此项，本文中主要是发送到topic
  TopicArn: '',

  // 发送消息提醒到指定终端则填写此项而非TopicArn
  // TargetArn: '',

  // 消息推送内容的类型，值为json
  MessageStructure: 'json'

  // 消息提醒的内容
  Message: JSON.stringify({
    // 若发送至topic，必须包含default，其代表发送至未被指定的平台的内容
    default: '默认消息',
    // 为指定平台发送数据时，必须为JSON键值对字符串
    APNS: JSON.stringify({
      aps: {
        alert: {
          title: '你好，iOS',
          body: '这是提醒内容',
        },
      },
      data: {
        customId: '123',
      }
    }),
    GCM: JSON.stringify({
      notification: {
        title: '你好，Android',
        body: '这是提醒内容',
      },
      data: {
        customId: '123',
      }
    }),
  }),
}

sns.publish(params);
```

在消息发送后，订阅了该topic的生产环境下的iOS终端将收到标题为`'你好，iOS'`的消息提醒，Android端将收到`'你好，Android'`的消息提醒，其它终端（例如iOS开发环境或浏览器）将收到`'默认消息'`。

## APNs数据格式（iOS）

APNs（Apple Push Notification service）是为苹果终端设备推送消息提醒的服务。首先，我们先看一个APNs推送的内容示例：

```json
{
  "aps": {
    "alert": {
      "title": "",
      "body": "",
    }
  },
  // other custom data...
  "data": {
    "customId": ""
  }
}
```

其中，`aps`表示一些苹果定义的推送设置内容，关于其值可参考[`aps`部分键值对说明](#aps部分键值对说明)。

除`aps`外，我们还可以加入一些自定义的内容，如示例中的`customId`。

### `aps`字段说明

| 名称 | 类型 | 说明 |
|:---:|:----:|:-----|
| `alert` | 字典或字符串 | 推送横幅展示的内容，为字符串时直接展示该字符串的值，为字典时值请参考下表 |
| `badge` | 数值 | app标记（badge）显示的数字，为0则不显示标记 |
| `sound` | 字符串或字典 | 接受推送时的声音提醒，默认为`default`，关于更多推送声音可参考[UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound) |
| `thread-id` | 字符串 | 用于不同类型消息提醒的分组 |
| `category` | 字符串 | 消息提醒的类型，可以参考[Declaring Your Actionable Notification Types](https://developer.apple.com/documentation/usernotifications/declaring_your_actionable_notification_types) |
| `content-available` | 数值 | 其值为1且不包含`alert`、`badge`以及`sound`时表示该消息提醒为后台提醒 |
| `mutable-content` | 数值 | 其值为1时该消息推送需要先经过app端处理，可参考[Modifying Content in Newly Delivered Notifications](https://developer.apple.com/documentation/usernotifications/modifying_content_in_newly_delivered_notifications) |
| `target-content-id` | 字符串 | 打开窗口的标识符 |

关于更多的`aps`部分说明可参考[Payload Key Reference Table 1](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2943363)。

### `alert`部分常用字段说明

| 名称 | 类型 | 说明 |
|:---:|:----:|:-----|
| `title` | 字符串 | 消息提醒的主标题 |
| `subtitle` | 字符串 | 消息提醒的副标题，用于表示解释推送目的的额外信息 |
| `body` | 字符串 | 消息提醒的主要内容 |
| `launch-image` | 字符串 | 表示用户通过点击消息提醒打开app时展示的图片 |

另外，`alert`部分还定义了`loc-key`、`loc-args`等与本地化相关的字段，如需使用可参考文档。关于更多的`alert`部分说明可参考[Payload Key Reference Table 2](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2943365)。

## FCM数据格式

FCM（Firebase Cloud Messaging）是一个跨平台的消息解决方案，在2018年起Google使用FCM替代GCM（Google Cloud Messaging）。同样，我们先看一下FCM的推送内容示例：

```json
{
  "notification": {
    "title": "",
    "body": "",
  },
  "data": {
    "customId": ""
    //
  }
}
```

其中，`notification`部分为预先定义的系统使用字段，其包含的字段可参考[`notification`部分常用字段](notification部分常用字段)；`data`部分为用户自定义字段，如示例中的`{"customId": ""}`。

### `notification`部分常用字段

| 名称 | 类型 | 说明 |
|:---:|:----:|:-----|
| `title` | 字符串 | 消息提醒标题 |
| `body` | 字符串 | 消息提醒主要内容 |
| `icon` | 字符串 | 消息提醒的图标，默认为在manifest中定义的app图标 |
| `sound` | 字符串 | 消息提醒播放的声音，默认为`default` |
| `notification_count` | 数值 | 设置消息提醒的标示数字 |
| `visibility` | 布尔值 | 是否展示消息提醒 |
| `image` | 字符串 | 消息提醒展示的图片 |

关于更多的FCM字段，可参考[AndroidNotification - Firebase](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#androidnotification)。

## 无法获取数据的问题

### 正确区分开发环境与生产环境

有些平台的推送需要区分不同的环境，例如iOS的推送APNs，需要区分`APNS`以及`APNS_SANDBOX`。在使用AWS SNS创建Topic消息时，若使用了错误的环境，可能导致终端接收到的数据为`default`中的信息。例如在我们上面的测试代码中发送消息至开发环境，终端接收到的数据可能为：

```json
{
  "aps": {
    "alert": "默认消息"
  }
}
```

### 使用SNS需将payload转为字符串

使用SNS创建消息推送时，必须将各payload数据先转为字符串的形式，否则可能无法收到正确的推送内容，如示例代码中的`APNS: JSON.stringify({})`。

## 参考资料

- [Generating a Remote Notification - Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification)
- [Firebase Cloud Messaging HTTP protocol - Firebase](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
- [使用平台特定负载发布 - AWS SNS](https://docs.aws.amazon.com/zh_cn/sns/latest/dg/sns-send-custom-platform-specific-payloads-mobile-devices.html)
